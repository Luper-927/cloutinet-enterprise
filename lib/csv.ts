export type CsvColumn<T> = {
  header: string
  value: (row: T) => string | number | null | undefined
}

const NUMBER_LIKE = /^-?\d+(\.\d+)?$/

function cell(v: string | number | null | undefined): string {
  let s = v === null || v === undefined ? '' : String(v)
  // Stops spreadsheet formulas: text starting with = + - @ is made harmless.
  if (typeof v !== 'number' && /^[=+\-@\t\r]/.test(s) && !NUMBER_LIKE.test(s)) s = `'${s}`
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [columns.map((c) => cell(c.header)).join(',')]
  for (const row of rows) lines.push(columns.map((c) => cell(c.value(row))).join(','))
  // The leading mark lets Excel read Chinese characters correctly.
  return '\uFEFF' + lines.join('\r\n')
}
