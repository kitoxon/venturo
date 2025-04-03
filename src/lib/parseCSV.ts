import Papa from "papaparse";

export interface DataRow {
  Date: string;
  Revenue: number;
  Expenses: number;
}

export function parseCSV(file: File): Promise<DataRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = (results.data as any[]).map((row) => ({
          Date: row.Date,
          Revenue: parseFloat(row.Revenue),
          Expenses: parseFloat(row.Expenses),
        }));
        resolve(parsed);
      },
      error: reject,
    });
  });
}
