export interface SQLiteResults {
  columns: string[];
  rows: any[][];
}

export interface SQLiteRunner {
  init: () => Promise<void>;
  exec: (sql: string, values?: any[]) => Promise<SQLiteResults>;
}
