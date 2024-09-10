import { useEffect, useMemo, useState } from 'react';
import { initSQLite } from './init.js';

type Promiser = (event: string, args: any) => Promise<void>;

export const useSQLite = () => {
  const [sqlite, setSQLite] = useState<{ databaseId: string, promiser: Promiser }>();
  useEffect(() => {
    initSQLite().then(result => setSQLite(result));
  }, []);

  return useMemo(() => {
    if (sqlite) {
      const exec = (sql: string, values?: any[]) => {
        const promise = new Promise((resolve) => {
          sqlite?.promiser('exec', {
            dbId: sqlite.databaseId,
            sql,
            bind: values,
            callback: (result: any) => {console.log(result); resolve(result)},
          })
        });
    
        return promise;
      };

      return {
        exec,
      };
    } else {
      return undefined;
    }
  }, [sqlite]);
};