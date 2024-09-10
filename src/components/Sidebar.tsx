import { useCallback, useEffect, useState } from 'react';
import { sqlite } from '../sqlite';
import { TableDefinition } from './TableDefinition';
import { DragDrop } from './DragDrop';

type TableDef = {
  name: string,
  columns: {
    cid: number,
    name: string,
    type: string,
    isNotNull: boolean,
    isPrimaryKey: boolean,
  }[];
}

export const Sidebar = () => {
  const [tables, setTables] = useState<TableDef[]>([]);
  
  const handleRefresh = useCallback(async () => {
    await sqlite.init();

    const tableNames = await sqlite.exec(
      `SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'`
    ).then(results => results.rows.map(row => row[0] as string));

    const tableDefs = await Promise.all(
      tableNames.map(name => sqlite.exec(
        `PRAGMA table_info(${name})`, [name]
      ).then(results => ({
        name,
        columns: results.rows.map(col => ({
          cid: col[0],
          name: col[1],
          type: col[2],
          isNotNull: !!col[3],
          isPrimaryKey: !!col[5],
        })),
      }) as TableDef))
    );

    setTables(tableDefs);
  }, [setTables]);

  useEffect(() => {
    handleRefresh()
  }, [handleRefresh]);

  return (
    <div style={{
      backgroundColor: '#F5F5F5',
      height: '100%',
      overflowX: 'auto'
    }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <label style={{ flexGrow: 1 }}>Tables</label>
        <button onClick={handleRefresh}>Refresh</button>
      </div>
      <div style={{ overflowY: 'auto' }}>
        {tables.map((table, index) => (
          <TableDefinition definition={table} key={index} />
        ))}
      </div>
      <DragDrop />
    </div>
  );
};