import reportWebVitals from "../reportWebVitals";
import { initSQLite } from "./init";

type SQLitePromiserCallbackResult = {
  columnNames: string[],
  row?: any[],
  rowNumber: number | null,
  type: string,
};

type SQLiteState = 'loading' | 'loaded' | 'unloaded'; 

type SQLiteResults = {
  columns: string[],
  rows: any[][],
};

export class SQLite {
  private _initPromise?: Promise<void>;
  private _state: SQLiteState = 'unloaded';

  private _databaseId?: string;
  private _promiser?: (event: string, args: any) => Promise<void>;

  private _isProcessing: boolean = false;
  private _execQueue: (() => Promise<void>)[] = [];

  public init = (): Promise<void> => {
    if (this._state === 'loaded') {
      return Promise.resolve();
    } else if (this._state === 'loading' && this._initPromise) {
      return this._initPromise;
    } else {
      this._state = 'loading';
      this._initPromise = initSQLite().then(result => {
        this._databaseId = result!.databaseId;
        this._promiser = result!.promiser;
        this._state = 'loaded';
      });
      return this._initPromise;
    }
  };

  public exec = (sql: string, values?: any[]): Promise<SQLiteResults> => {
    if (!this._databaseId) {
      throw new Error('No database ID! Did you init SQLite?');
    } else if (!this._promiser) {
      throw new Error('No promiser! Did you init SQLite?');
    }

    // Create a deferred promise to capture the query results.
    let deferResolve: (results: SQLiteResults) => void;
    const resultPromise = new Promise<SQLiteResults>((resolve) => {
      deferResolve = resolve;
    });

    // Setup our exec task (we only want to run one of these at a time).
    const execTask = async () => {
      let columns: string[] = [];
      let rows: any[][] = [];

      const execPromise = this._promiser!('exec', {
        dbId: this._databaseId!,
        sql,
        bind: values,
        callback: (result: SQLitePromiserCallbackResult) => {
          if (columns.length === 0) {
            columns.push(...result.columnNames);
          }
          if (result.row) {
            rows.push(result.row);
          }
        }
      });

      try {
        await execPromise;
      } catch (error: any) {
        columns = ['Error Class', 'Error Message'];
        rows = [
          [error.result.errorClass, error.result.message]
        ];
      } finally {
        deferResolve({ columns, rows });
      }
    };
    this._execQueue.push(execTask);

    // Kick off the processor if there isn't one already,
    // but don't wait for it since we don't want to hold up execution.
    if (!this._isProcessing) {
      this._processExecQueue();
    }

    // Return the deferred promise to the caller.
    return resultPromise;
  };

  private _processExecQueue = async (): Promise<void> => {
    this._isProcessing = true;
    for (let exec = this._execQueue.shift(); !!exec; exec = this._execQueue.shift()) {
      await exec();
    }
    this._isProcessing = false;
  }
}

export const sqlite = new SQLite();