import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

export const initSQLite = async () => {
  const sqlite3 = await sqlite3InitModule({
    print: console.log,
    printErr: console.error,
  });

  const db = new sqlite3.oo1.JsStorageDb('local');
  return {
    db,
  };
};