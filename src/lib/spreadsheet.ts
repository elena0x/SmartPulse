import Papa from "papaparse";
import readXlsxFile from "read-excel-file/browser";

export type SpreadsheetRow = Record<string, string>;

const normalizeRows = (rows: unknown[][]): SpreadsheetRow[] => {
  if (rows.length < 2) return [];

  const headers = rows[0].map((value, index) => {
    const header = String(value ?? "").trim();
    return header || `Column ${index + 1}`;
  });

  return rows.slice(1)
    .filter((row) => row.some((value) => String(value ?? "").trim() !== ""))
    .map((row) => Object.fromEntries(
      headers.map((header, index) => [header, String(row[index] ?? "")]),
    ));
};

export async function parseSpreadsheet(file: File): Promise<SpreadsheetRow[]> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    const result = Papa.parse<SpreadsheetRow>(await file.text(), {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header, index) => header.trim() || `Column ${index + 1}`,
    });

    if (result.errors.length > 0) {
      throw new Error(result.errors[0].message);
    }

    return result.data.map((row) => Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, String(value ?? "")]),
    ));
  }

  if (extension === "xlsx") {
    const rows = await readXlsxFile(file);
    return normalizeRows(rows as unknown as unknown[][]);
  }

  throw new Error("不支持该表格格式，请使用 .xlsx 或 .csv 文件。");
}
