import { Database } from '@sqlite.org/sqlite-wasm';
import { SQLiteResults, SQLiteRunner } from '../types';
import { initSQLite } from './init';

type SQLiteState = 'loading' | 'loaded' | 'unloaded'; 

export class SQLiteMain implements SQLiteRunner {
  private _initPromise?: Promise<void>;
  private _state: SQLiteState = 'unloaded';

  private _db?: Database;

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
        this._db = result!.db;
        this._state = 'loaded';
      });
      return this._initPromise;
    }
  };

  public exec = (sql: string, values?: any[]): Promise<SQLiteResults> => {
    if (!this._db) {
      throw new Error('No database ID! Did you init SQLite?');
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

      try {
        this._db?.exec({
          sql,
          bind: values,
          columnNames: columns,
          resultRows: rows,
        });

        // If the query doesn't provide its own results,
        // we'll add one just to say that the query is done.
        if (columns.length === 0 && rows.length === 0) {
          columns.push('Result');
          rows.push(['Query ran successfully']);
        }
      } catch (error: any) {
        console.error(error);
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
