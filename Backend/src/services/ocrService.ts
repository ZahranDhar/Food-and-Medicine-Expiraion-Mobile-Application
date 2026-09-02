import axios from 'axios';
import FormData from 'form-data';
import AppError from '../utils/AppError';

// ─── OCR.space Types ──────────────────────────────────────────────────────────

interface OcrSpaceParsedResult {
  ParsedText?: string;
  ErrorMessage?: string;
  ErrorDetails?: string;
  FileParseExitCode?: number;
}

interface OcrSpaceResponse {
  ParsedResults?: OcrSpaceParsedResult[];
  OCRExitCode?: number;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  ErrorDetails?: string;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Extract all text from an image buffer using the OCR.space API.
 *
 * Uses axios + form-data (backed by Node's https module) for compatibility with
 * environments where Node's native fetch (undici) cannot reach external HTTPS.
 *
 * @param imageBuffer  Raw image bytes (from Multer memoryStorage)
 * @returns            Full OCR text or an empty string if nothing is detected
 */
export async function extractTextFromBuffer(imageBuffer: Buffer): Promise<string> {
  const apiKey = process.env.OCR_SPACE_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    throw new AppError(
      'OCR.space API key is not configured. Set OCR_SPACE_API_KEY in your .env file.',
      503
    );
  }

  const formData = new FormData();
  formData.append('apikey', apiKey.trim());
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('file', imageBuffer, {
    filename: 'product.png',
    contentType: 'image/png',
  });

  let data: OcrSpaceResponse;
  try {
    const response = await axios.post<OcrSpaceResponse>(
      'https://api.ocr.space/parse/image',
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 100000,
      }
    );
    data = response.data;
  } catch (err: any) {
    const message =
      err.response?.data?.message ||
      err.response?.statusText ||
      err.message ||
      String(err);
    throw new AppError(`OCR.space API request failed: ${message}`, 502);
  }

  if (!data) {
    throw new AppError('OCR.space returned an empty response.', 502);
  }

  if (data.IsErroredOnProcessing) {
    let errMsg = 'Processing error occurred';
    if (Array.isArray(data.ErrorMessage)) {
      errMsg = data.ErrorMessage.join('; ');
    } else if (typeof data.ErrorMessage === 'string') {
      errMsg = data.ErrorMessage;
    } else if (data.ParsedResults?.[0]?.ErrorMessage) {
      errMsg = data.ParsedResults[0].ErrorMessage;
    }
    throw new AppError(`OCR.space processing error: ${errMsg}`, 502);
  }

  if (!data.ParsedResults || !Array.isArray(data.ParsedResults) || data.ParsedResults.length === 0) {
    return '';
  }

  const extractedText = data.ParsedResults
    .map((result) => result.ParsedText || '')
    .join('\n')
    .trim();

  return extractedText;
}

export default extractTextFromBuffer;
