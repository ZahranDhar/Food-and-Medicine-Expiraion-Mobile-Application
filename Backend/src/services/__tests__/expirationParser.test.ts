/**
 * Expiration Parser — Test Suite
 *
 * Run with:
 *   npx ts-node src/services/__tests__/expirationParser.test.ts
 *
 * Uses Node's built-in `assert` module. No external test framework required.
 */

import assert from 'assert';
import { parseExpirationDate, ParseResult } from '../expirationParser';

// ─── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ❌  ${name}`);
    console.error(`       ${msg}`);
    failed++;
  }
}

function assertDate(result: ParseResult, expected: string, minConfidence = 0.5): void {
  assert.ok(
    result.expirationDate !== null,
    `Expected expirationDate "${expected}" but got null (confidence=${result.confidence})`
  );
  assert.strictEqual(
    result.expirationDate,
    expected,
    `Expected "${expected}" but got "${result.expirationDate}"`
  );
  assert.ok(
    result.confidence >= minConfidence,
    `Expected confidence >= ${minConfidence} but got ${result.confidence}`
  );
}

function assertNull(result: ParseResult): void {
  assert.strictEqual(
    result.expirationDate,
    null,
    `Expected null but got "${result.expirationDate}" (source=${result.source})`
  );
  assert.strictEqual(result.confidence, 0, `Expected confidence=0 but got ${result.confidence}`);
}

// ─── TEST 1 ───────────────────────────────────────────────────────────────────
// EXP label with DD/MM/YYYY date.
// 12/08/2027: both 12 and 08 are ≤ 12 → ambiguous → default DD/MM → Aug 12 2027

console.log('\n── TEST 1: EXP label ──────────────────────────────────────');
test('EXP: 12/08/2027 → 2027-08-12', () => {
  const result = parseExpirationDate('EXP: 12/08/2027');
  assertDate(result, '2027-08-12');
  assert.strictEqual(result.source, 'EXP');
});

test('EXPIRY 12-08-2027 → 2027-08-12', () => {
  const result = parseExpirationDate('EXPIRY 12-08-2027');
  assertDate(result, '2027-08-12');
});

test('BEST BEFORE 12/08/2027 → 2027-08-12', () => {
  const result = parseExpirationDate('BEST BEFORE 12/08/2027');
  assertDate(result, '2027-08-12');
});

test('USE BY: 12.08.2027 → 2027-08-12', () => {
  const result = parseExpirationDate('USE BY: 12.08.2027');
  assertDate(result, '2027-08-12');
});

// ─── TEST 2 ───────────────────────────────────────────────────────────────────
// MFD + "BEST BEFORE: 12 MONTHS" → calculated expiry

console.log('\n── TEST 2: MFD + BEST BEFORE 12 MONTHS ────────────────────');
test('MFD: 12/02/2026 + BEST BEFORE: 12 MONTHS → 2027-02-12', () => {
  const ocr = 'MFD: 12/02/2026\nBEST BEFORE: 12 MONTHS';
  const result = parseExpirationDate(ocr);
  assertDate(result, '2027-02-12', 0.7);
  assert.strictEqual(result.manufacturingDate, '2026-02-12');
  assert.strictEqual(result.source, 'MFD_SHELF_LIFE');
});

// ─── TEST 3 ───────────────────────────────────────────────────────────────────

console.log('\n── TEST 3: MFD + BEST BEFORE 6 MONTHS ─────────────────────');
test('MFD: 01/03/2026 + BEST BEFORE 6 MONTHS → 2026-09-01', () => {
  const ocr = 'MFD: 01/03/2026\nBEST BEFORE 6 MONTHS';
  const result = parseExpirationDate(ocr);
  assertDate(result, '2026-09-01', 0.7);
  assert.strictEqual(result.manufacturingDate, '2026-03-01');
});

// ─── TEST 4 ───────────────────────────────────────────────────────────────────

console.log('\n── TEST 4: MFD + SHELF LIFE 18 MONTHS ─────────────────────');
test('MFD: 01/03/2026 + SHELF LIFE: 18 MONTHS → 2027-09-01', () => {
  const ocr = 'MFD: 01/03/2026\nSHELF LIFE: 18 MONTHS';
  const result = parseExpirationDate(ocr);
  assertDate(result, '2027-09-01', 0.7);
  assert.strictEqual(result.shelfLife, '18 MONTHS');
});

// ─── TEST 5 ───────────────────────────────────────────────────────────────────
// Batch number must NOT become expiration date.

console.log('\n── TEST 5: Batch number must NOT be expiry ─────────────────');
test('MFD: 12/02/2026 + BATCH: 12022027 → expirationDate null', () => {
  const ocr = 'MFD: 12/02/2026\nBATCH: 12022027';
  const result = parseExpirationDate(ocr);
  assertNull(result);
  // MFD date should still be captured
  assert.strictEqual(result.manufacturingDate, '2026-02-12');
});

test('LOT: 12/08/2027 alone → expirationDate null (LOT is not an EXP label)', () => {
  const result = parseExpirationDate('LOT: 12/08/2027');
  assertNull(result);
});

// ─── TEST 6 ───────────────────────────────────────────────────────────────────
// Multiple dates — must use the labeled expiration, not any other date.

console.log('\n── TEST 6: Multiple dates — labeled one wins ───────────────');
test('Product with MFD, LOT, and EXP → EXP date wins', () => {
  const ocr = [
    'PRODUCT: PARACETAMOL 500MG',
    'MFD: 01/06/2025',
    'LOT: 060125001',
    'EXP: 06/2027',
    'BATCH: 20250601',
  ].join('\n');
  const result = parseExpirationDate(ocr);
  assertDate(result, '2027-06-01', 0.9);
  assert.ok(result.source?.includes('EXP'));
  assert.strictEqual(result.manufacturingDate, '2025-06-01');
});

// ─── TEST 7 ───────────────────────────────────────────────────────────────────
// No recognizable expiration information.

console.log('\n── TEST 7: No recognizable expiration info ─────────────────');
test('Random product text with no dates → null', () => {
  const ocr = 'ORGANIC GRANOLA BAR\nNET WT 40G\nCERTIFIED ORGANIC\nMADE IN USA';
  assertNull(parseExpirationDate(ocr));
});

test('Only a batch code present → null', () => {
  const ocr = 'BATCH NO: ABC12345\nMANUFACTURED BY ACME CORP';
  assertNull(parseExpirationDate(ocr));
});

// ─── TEST 8 ───────────────────────────────────────────────────────────────────
// Invalid / impossible dates must not produce a result.

console.log('\n── TEST 8: Invalid dates ────────────────────────────────────');
test('EXP: 32/08/2027 → null (day 32 is invalid)', () => {
  const result = parseExpirationDate('EXP: 32/08/2027');
  // parseTwoPartDate: a=32>12 → DD/MM, day=32 → rejected
  assertNull(result);
});

test('EXP: 13/13/2027 → null (both parts > 12)', () => {
  const result = parseExpirationDate('EXP: 13/13/2027');
  assertNull(result);
});

test('EXP: 00/00/2027 → null (zero month/day)', () => {
  const result = parseExpirationDate('EXP: 00/00/2027');
  assertNull(result);
});

// ─── AMBIGUITY RULE VERIFICATION ─────────────────────────────────────────────

console.log('\n── Ambiguity rule verification ─────────────────────────────');
test('01/02/2027 → ambiguous → DD/MM → Feb 1 2027', () => {
  const result = parseExpirationDate('EXP: 01/02/2027');
  assertDate(result, '2027-02-01');
});

test('13/02/2027 → A=13 > 12 → must be DD/MM → Feb 13 2027', () => {
  const result = parseExpirationDate('EXP: 13/02/2027');
  assertDate(result, '2027-02-13');
});

test('02/13/2027 → B=13 > 12 → must be MM/DD → Feb 13 2027', () => {
  const result = parseExpirationDate('EXP: 02/13/2027');
  assertDate(result, '2027-02-13');
});

// ─── OCR NOISE TESTS ─────────────────────────────────────────────────────────

console.log('\n── OCR noise ────────────────────────────────────────────────');
test('E X P label (spaced chars) → recognized', () => {
  const result = parseExpirationDate('E X P: 12/08/2027');
  assertDate(result, '2027-08-12');
});

test('2O27 → normalized to 2027', () => {
  const result = parseExpirationDate('EXP: 12/08/2O27');
  assertDate(result, '2027-08-12');
});

// ─── NAMED MONTH FORMATS ─────────────────────────────────────────────────────

console.log('\n── Named month formats ──────────────────────────────────────');
test('EXP: 12 AUG 2027', () => {
  const result = parseExpirationDate('EXP: 12 AUG 2027');
  assertDate(result, '2027-08-12');
});

test('BEST BEFORE: AUG 12 2027', () => {
  const result = parseExpirationDate('BEST BEFORE: AUG 12 2027');
  assertDate(result, '2027-08-12');
});

test('USE BY 12-AUG-2027', () => {
  const result = parseExpirationDate('USE BY 12-AUG-2027');
  assertDate(result, '2027-08-12');
});

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log(`  Total: ${passed + failed}  ✅ Passed: ${passed}  ❌ Failed: ${failed}`);
console.log('─'.repeat(60) + '\n');

if (failed > 0) process.exit(1);
