export type PeriodDetectionSource = 'filename' | 'workbook-metadata' | 'sheet-name' | 'manual';

export interface DetectedPeriod {
  year?: string;
  month?: string;
  source?: Exclude<PeriodDetectionSource, 'manual'>;
}

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const MONTH_TOKEN = new RegExp(`\\b(${MONTHS.join('|')}|${MONTHS.map(month => month.slice(0, 3)).join('|')})\\b`, 'i');
const YEAR_TOKEN = /\b(20\d{2})\b/;
const NUMERIC_PERIOD_TOKEN = /\b(0?[1-9]|1[0-2])\s*[/.-]\s*(20\d{2})\b|\b(20\d{2})\s*[/.-]\s*(0?[1-9]|1[0-2])\b/;

function monthNumber(value: string): string | undefined {
  const normalized = value.toLowerCase();
  const index = MONTHS.findIndex(month => month === normalized || month.slice(0, 3) === normalized);
  return index >= 0 ? String(index + 1) : undefined;
}

function detectFromText(text: string): { year?: string; month?: string } {
  const normalized = text.replace(/[_,:|()]+/g, ' ');
  const numeric = normalized.match(NUMERIC_PERIOD_TOKEN);
  if (numeric) {
    const month = numeric[1] || numeric[4];
    const year = numeric[2] || numeric[3];
    return { month, year };
  }

  const monthMatch = normalized.match(MONTH_TOKEN);
  const yearMatch = normalized.match(YEAR_TOKEN);
  return {
    month: monthMatch ? monthNumber(monthMatch[1]) : undefined,
    year: yearMatch?.[1],
  };
}

/**
 * Detect a reporting month/year from the file name, worksheet names, and
 * workbook metadata rows. It intentionally does not invent a period: callers
 * must show the manual fallback when either component is missing.
 */
export function detectPeriodFromWorkbook(
  fileName: string,
  matrix: unknown[][],
  sheetNames: string[] = [],
): DetectedPeriod {
  const fileResult = detectFromText(fileName);
  if (fileResult.month && fileResult.year) return { ...fileResult, source: 'filename' };

  for (const sheetName of sheetNames) {
    const sheetResult = detectFromText(sheetName);
    if (sheetResult.month && sheetResult.year) return { ...sheetResult, source: 'sheet-name' };
  }

  // Metadata normally appears above the table header. Scanning the first 30
  // rows avoids using beneficiary values as period evidence in large files.
  const metadataText = matrix
    .slice(0, 30)
    .map(row => (Array.isArray(row) ? row.map(cell => String(cell ?? '')).join(' ') : ''))
    .join(' ');
  const workbookResult = detectFromText(metadataText);
  if (workbookResult.month && workbookResult.year) {
    return { ...workbookResult, source: 'workbook-metadata' };
  }

  return {
    year: fileResult.year || workbookResult.year,
    month: fileResult.month || workbookResult.month,
    source: undefined,
  };
}
