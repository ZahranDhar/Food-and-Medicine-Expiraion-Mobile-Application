import { addMonths, addYears, addDays, isValid, format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParseResult {
  /** Expiration date in YYYY-MM-DD format, or null if not reliably determined. */
  expirationDate: string | null;
  /** Confidence score 0–1. Caller should treat < 0.5 as unreliable. */
  confidence: number;
  /**
   * Label that produced the result:
   *  "EXP" | "EXPIRY" | "BEST_BEFORE" | "USE_BY" | "BBE" | "VALID_UNTIL" |
   *  "EXPIRES" | "MFD_SHELF_LIFE" | null
   */
  source: string | null;
  /** The raw text fragment that was matched. */
  rawMatch: string | null;
  /** Manufacturing date if found (YYYY-MM-DD), otherwise null. */
  manufacturingDate: string | null;
  /** Shelf-life string if found (e.g. "12 MONTHS"), otherwise null. */
  shelfLife: string | null;
}

// ─── Month name → number map ──────────────────────────────────────────────────

const MONTH_NAMES: Record<string, number> = {
  JAN: 1,  FEB: 2,  MAR: 3,  APR: 4,  MAY: 5,  JUN: 6,
  JUL: 7,  AUG: 8,  SEP: 9,  OCT: 10, NOV: 11, DEC: 12,
};

// ─── Text normalisation ───────────────────────────────────────────────────────

/**
 * Normalise OCR text before parsing:
 * 1. Uppercase the whole string.
 * 2. Collapse intra-character spaces in well-known keywords
 *    (e.g. "E X P" → "EXP") that Vision sometimes emits one character at a time.
 *
 * We do NOT perform aggressive digit substitutions (O→0, I→1) on raw text
 * because that can corrupt product names or batch codes.
 * Digit substitution is applied only inside extracted date strings.
 */
function normalizeText(text: string): string {
  let t = text.toUpperCase();

  // Collapse spaced-out keyword variants (Vision may space individual chars)
  t = t.replace(/\bE\s+X\s+P\b/g, 'EXP');
  t = t.replace(/\bB\s+B\s+E\b/g, 'BBE');
  t = t.replace(/\bM\s+F\s+D\b/g, 'MFD');
  t = t.replace(/\bM\s+F\s+G\b/g, 'MFG');
  t = t.replace(/\bB\s+E\s+S\s+T\s+B\s+E\s+F\s+O\s+R\s+E\b/g, 'BEST BEFORE');
  t = t.replace(/\bU\s+S\s+E\s+B\s+Y\b/g, 'USE BY');
  t = t.replace(/\bV\s+A\s+L\s+I\s+D\s+U\s+N\s+T\s+I\s+L\b/g, 'VALID UNTIL');

  return t;
}

/**
 * Normalise common OCR digit substitutions within an already-isolated date string.
 * Applied only to the extracted date candidate, not the full document.
 */
function normalizeDigits(str: string): string {
  return str
    .replace(/O/g, '0')   // O → 0
    .replace(/[Il]/g, '1'); // I or l → 1
}

/**
 * Pre-normalise the entire OCR text for digit substitutions that are safe
 * to apply globally (e.g. O→0 in clearly numeric contexts).
 * We only substitute O→0 when surrounded by digits or date separators,
 * and I/l→1 in the same bounded context, so we do not corrupt product names.
 */
function normalizeTextDigits(text: string): string {
  // Replace O between digits/separators: e.g. 2O27 → 2027, 1O/O8/2O27 → 10/08/2027
  return text
    .replace(/(?<=\d)O(?=\d)/g, '0')
    .replace(/(?<=[\/\-\.])O(?=\d)/g, '0')
    .replace(/(?<=\d)O(?=[\/\-\.])/g, '0')
    .replace(/(?<=\d)[Il](?=\d)/g, '1')
    .replace(/(?<=[\/\-\.])[Il](?=\d)/g, '1');
}

// ─── Year normalisation ───────────────────────────────────────────────────────

function normalizeYear(y: number): number {
  if (y >= 100) return y; // already 4-digit
  return y < 50 ? 2000 + y : 1900 + y;
}

// ─── Date ambiguity resolution ────────────────────────────────────────────────
/**
 * Interpret a two-part numeric date (A/B/YYYY) where A and B are the first two
 * components and YYYY is the year.
 *
 * Convention (DD/MM is the global default for food/medicine labels):
 *
 *   • A > 12   → A is definitely the day (cannot be a month)   → DD/MM
 *   • B > 12   → B is definitely the day (cannot be a month in MM/DD)
 *                and A must be the month                        → MM/DD
 *   • Both ≤ 12 → AMBIGUOUS → default to DD/MM (day=A, month=B)
 *
 * Examples:
 *   01/02/2027 → ambiguous → DD/MM → Feb 1 2027
 *   13/02/2027 → A=13 > 12 → DD/MM → Feb 13 2027
 *   02/13/2027 → B=13 > 12 → MM/DD → Feb 13 2027  (month=02, day=13)
 */
function parseTwoPartDate(
  aPart: string,
  bPart: string,
  yearPart: string
): Date | null {
  const a = parseInt(normalizeDigits(aPart));
  const b = parseInt(normalizeDigits(bPart));
  const year = normalizeYear(parseInt(normalizeDigits(yearPart)));

  if (isNaN(a) || isNaN(b) || isNaN(year)) return null;

  let day: number, month: number;

  if (a > 12 && b > 12) {
    return null; // impossible — neither can be a valid month
  } else if (a > 12) {
    // A cannot be a month → DD/MM
    day = a; month = b;
  } else if (b > 12) {
    // B cannot be a day in a MM/DD layout → MM/DD
    month = a; day = b;
  } else {
    // Ambiguous → default DD/MM (day=A, month=B)
    day = a; month = b;
  }

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  return isValid(date) ? date : null;
}

// ─── Date parsers ─────────────────────────────────────────────────────────────

interface DateMatch {
  date: Date;
  raw: string;
}

/**
 * Try to parse any supported date format from the start of `text`.
 * Returns the first successful match, or null.
 *
 * Supported formats (in priority order):
 *   YYYY-MM-DD | YYYY/MM/DD
 *   DD/MM/YYYY | DD-MM-YYYY | DD.MM.YYYY  (+ ambiguous MM/DD handled above)
 *   D MMM YYYY | MMM D YYYY  (named month)
 *   MM/YYYY    | MM-YYYY     (day defaults to 1)
 */
function tryParseDate(text: string): DateMatch | null {
  // 1. YYYY-MM-DD or YYYY/MM/DD (unambiguous — most specific, check first)
  {
    const m = text.match(/\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/);
    if (m) {
      const year = parseInt(m[1]);
      const month = parseInt(normalizeDigits(m[2]));
      const day = parseInt(normalizeDigits(m[3]));
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day);
        if (isValid(date)) return { date, raw: m[0] };
      }
    }
  }

  // 2. DD/MM/YYYY | DD-MM-YYYY | DD.MM.YYYY  (two-part ambiguity handled above)
  {
    const m = text.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
    if (m) {
      const date = parseTwoPartDate(m[1], m[2], m[3]);
      if (date) return { date, raw: m[0] };
    }
  }

  // 3. Named month — DD MMM YYYY or DD-MMM-YYYY  (e.g. 12 AUG 2027)
  {
    const m = text.match(
      /\b(\d{1,2})[\s\-](JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\w*[\s\-,]+(\d{2,4})\b/i
    );
    if (m) {
      const day = parseInt(m[1]);
      const month = MONTH_NAMES[m[2].toUpperCase().substring(0, 3)];
      const year = normalizeYear(parseInt(m[3]));
      if (month && day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day);
        if (isValid(date)) return { date, raw: m[0] };
      }
    }
  }

  // 4. Named month — MMM DD YYYY  (e.g. AUG 12 2027)
  {
    const m = text.match(
      /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\w*[\s\-,]+(\d{1,2})[\s\-,]+(\d{2,4})\b/i
    );
    if (m) {
      const month = MONTH_NAMES[m[1].toUpperCase().substring(0, 3)];
      const day = parseInt(m[2]);
      const year = normalizeYear(parseInt(m[3]));
      if (month && day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day);
        if (isValid(date)) return { date, raw: m[0] };
      }
    }
  }

  // 5. MM/YYYY or MM-YYYY (day-less; day defaults to 1)
  //    Only match when the first number is a valid month (1-12) AND
  //    it is not the middle slice of a 3-part date (DD/MM/YYYY):
  //    lookbehind ensures no digit+separator precedes it,
  //    lookahead ensures no separator+digits follow the year.
  {
    const m = text.match(/(?<![\/\-\.\d])\b(0?[1-9]|1[0-2])[\/\-](\d{4})\b(?![\/\-\d])/);
    if (m) {
      const month = parseInt(normalizeDigits(m[1]));
      const year = parseInt(m[2]);
      if (month >= 1 && month <= 12 && year >= 2000) {
        const date = new Date(year, month - 1, 1);
        if (isValid(date)) return { date, raw: m[0] };
      }
    }
  }

  return null;
}

// ─── Label regular expressions ────────────────────────────────────────────────

/**
 * Matches all known expiration label variants.
 * Capture group 1 is the clean label text.
 */
const EXP_LABEL_RE =
  /\b(EXP(?:IRY|IRATION|IRES)?\.?|USE\s+BY|BEST\s+(?:BEFORE|BY)|BBE|VALID\s+UNTIL|EXPIRES?)\s*[:\-]?\s*/;

/**
 * Matches manufacturing date label variants.
 */
const MFD_LABEL_RE =
  /\b(MFD|MFG|MANUFACTURED?\s*(?:ON|DATE)?|MANUFACTURING\s+DATE)\s*[:\-]?\s*/;

/**
 * Matches shelf-life expressions:
 *   "BEST BEFORE 12 MONTHS", "SHELF LIFE: 18 MONTHS", "USE WITHIN 6 MONTHS",
 *   "USE BEFORE 1 YEAR", "VALID FOR 9 MONTHS"
 */
const SHELF_LIFE_RE =
  /\b(?:BEST\s+BEFORE|SHELF\s+LIFE|USE\s+WITHIN|USE\s+BEFORE|VALID\s+FOR)\s*[:\-]?\s*(\d+)\s*(MONTHS?|YEARS?|DAYS?)\b/;

// ─── Helper: search for a label then parse the date after it ─────────────────

interface LabelDateResult {
  labelText: string;
  dateMatch: DateMatch;
  rawSnippet: string;
}

function findLabeledDate(
  lines: string[],
  labelRe: RegExp
): LabelDateResult | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const labelMatch = line.match(labelRe);
    if (!labelMatch) continue;

    // Try the text after the label on the same line
    const afterLabel = line.slice(labelMatch.index! + labelMatch[0].length);
    const dateResult = tryParseDate(afterLabel);
    if (dateResult) {
      return {
        labelText: labelMatch[1].trim(),
        dateMatch: dateResult,
        rawSnippet: `${labelMatch[0].trim()} ${dateResult.raw}`,
      };
    }

    // Try combining this line with the next 1–2 lines
    // (Vision sometimes puts the date on the line immediately following the label)
    const combined = lines.slice(i, i + 3).join(' ');
    const combinedLabelMatch = combined.match(labelRe);
    if (combinedLabelMatch) {
      const afterCombined = combined.slice(
        combinedLabelMatch.index! + combinedLabelMatch[0].length
      );
      const combinedDate = tryParseDate(afterCombined);
      if (combinedDate) {
        return {
          labelText: combinedLabelMatch[1].trim(),
          dateMatch: combinedDate,
          rawSnippet: combined.trim().substring(0, 100),
        };
      }
    }
  }
  return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Parse expiration information from OCR text.
 *
 * Priority:
 *   1. Explicit expiration label (EXP, BEST BEFORE, USE BY, …) → confidence 0.95
 *   2. Manufacturing date + shelf-life expression               → confidence 0.80
 *   3. Nothing reliable found                                   → null, confidence 0
 *
 * The function NEVER invents a date. If extraction fails it returns null.
 */
export function parseExpirationDate(rawText: string): ParseResult {
  // Apply global digit normalization before any parsing
  const text = normalizeTextDigits(normalizeText(rawText));
  const lines = text.split(/\n+/).filter(Boolean);

  const result: ParseResult = {
    expirationDate: null,
    confidence: 0,
    source: null,
    rawMatch: null,
    manufacturingDate: null,
    shelfLife: null,
  };

  // ── PHASE 1: Explicit expiration label + date ────────────────────────────
  const expFound = findLabeledDate(lines, EXP_LABEL_RE);
  if (expFound) {
    result.expirationDate = format(expFound.dateMatch.date, 'yyyy-MM-dd');
    result.confidence = 0.95;
    result.source = expFound.labelText.replace(/\s+/g, '_');
    result.rawMatch = expFound.rawSnippet;
  }

  // ── PHASE 2: Manufacturing date (always try, even if EXP was found) ──────
  const mfdFound = findLabeledDate(lines, MFD_LABEL_RE);
  if (mfdFound) {
    result.manufacturingDate = format(mfdFound.dateMatch.date, 'yyyy-MM-dd');
  }

  // ── PHASE 2b: Shelf life → calculate expiry (only if no EXP label found) ─
  if (!result.expirationDate && result.manufacturingDate) {
    const shelfMatch = text.match(SHELF_LIFE_RE);
    if (shelfMatch) {
      const amount = parseInt(shelfMatch[1]);
      const unit = shelfMatch[2].toUpperCase();
      result.shelfLife = `${amount} ${shelfMatch[2]}`;

      const mfdDate = mfdFound!.dateMatch.date;
      let expiryDate: Date;

      if (unit.startsWith('MONTH')) {
        expiryDate = addMonths(mfdDate, amount);
      } else if (unit.startsWith('YEAR')) {
        expiryDate = addYears(mfdDate, amount);
      } else {
        expiryDate = addDays(mfdDate, amount);
      }

      result.expirationDate = format(expiryDate, 'yyyy-MM-dd');
      result.confidence = 0.80;
      result.source = 'MFD_SHELF_LIFE';
      result.rawMatch =
        `MFD: ${mfdFound!.dateMatch.raw} + ${result.shelfLife}`;
    }
  }

  // ── PHASE 3: No reliable date found ──────────────────────────────────────
  // We deliberately do NOT fall back to unlabeled date guessing.
  // Batch numbers, lot codes, and other numbers that look like dates must not
  // be silently promoted to an expiry date.

  return result;
}
