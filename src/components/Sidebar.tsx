import { useCallback, useEffect, useState } from 'react';
import { sqlite } from '../sqlite';
import { TableDefinition } from './TableDefinition';
import { ImportModal } from './ImportModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpFromBracket } from '@fortawesome/free-solid-svg-icons/faArrowUpFromBracket';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons/faArrowsRotate';

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
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
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

  const handleDelete = useCallback(async (table: string) => {
    await sqlite.init();

    await sqlite.exec(`DROP TABLE ${table}`);

    await handleRefresh();
  }, [handleRefresh]);

  useEffect(() => {
    handleRefresh()
  }, [handleRefresh]);

  return (
    <div style={{
      backgroundColor: '#F5F5F5',
      height: '100%',
    }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 4,
          padding: 4,
        }}
      >
        <label style={{ flexGrow: 1 }}>Tables</label>
        <button className="btn-icon" title="Import CSV" onClick={() => setDialogOpen(true)}><FontAwesomeIcon icon={faArrowUpFromBracket} /></button>
        <button className="btn-icon" title="Refresh Tables" onClick={handleRefresh}><FontAwesomeIcon icon={faArrowsRotate} /></button>
      </div>
      <div style={{ overflowX: 'hidden', overflowY: 'auto' }}>
        {tables.map((table, index) => (
          <TableDefinition key={index} definition={table} onDelete={() => handleDelete(table.name)} />
        ))}
      </div>
      <ImportModal open={dialogOpen} onCancel={() => setDialogOpen(false)} />
    </div>
  );
};