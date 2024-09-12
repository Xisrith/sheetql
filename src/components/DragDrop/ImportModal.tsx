import { useEffect, useMemo, useState } from 'react';
import { parse } from 'csv-parse/browser/esm/sync';
import { Dialog } from '../Common/Dialog';
import { sqlite } from '../../sqlite';

type Props = {
  file: File | null;
  onCancel: () => void;
}

export const ImportModal = ({ file, onCancel }: Props) => {
  const [data, setData] = useState<string[][]>([]);

  const [customHeaders, setCustomHeaders] = useState<string[]>([]);
  const [dataHasHeaders, setDataHasHeaders] = useState<boolean>(false);

  const { headers, rows, types } = useMemo(() => {
    const d = {
      headers: [] as string[],
      rows: [] as string[][],
      types: [] as string[],
    };

    if (!data || !data.length) {
      return d;
    }
    
    d.headers = dataHasHeaders ? data.slice(0, 1)[0] : [];
    if (d.headers.length === 0) {
      for (let i = 0; i < data[0].length; i++) {
        d.headers.push('');
      }
    }

    d.rows = dataHasHeaders ? data.slice(1) : data;
    
    const cHeaders = [];
    for (let h = 0; h < d.headers.length; h++) {
      d.types.push('INTEGER');
      cHeaders.push('');
    }
    setCustomHeaders(cHeaders);

    for (const row of d.rows) {
      for (let r = 0; r < row.length; r++) {
        // SQLite doesn't have a boolean type, so we make false/true to 0/1
        // to use the integer type as intended by SQLite.
        let rv = row[r].toLowerCase() === 'false' ? '0' : row[r].toLowerCase() === 'true' ? '1' : row[r];
        switch (d.types[r]) {
          case 'INTEGER':
            if(Number.isNaN(Number.parseInt(rv))) {
              d.types[r] = 'REAL';
              r--;
            }
            break;
          case 'REAL':
            if (Number.isNaN(Number.parseFloat(rv))) {
              d.types[r] = 'TEXT';
            }
            break;
        }
      }
    }

    return d;
  }, [data, dataHasHeaders]);


  useEffect(() => {
    file?.text().then((text) => {
      const records = parse(text, {
        skip_empty_lines: true,
      });
      setData(records);
    });
  }, [file]);

  const setCustomHeader = (index: number, value: string) => {
    setCustomHeaders([...customHeaders.slice(0, index), value, ...customHeaders.slice(index + 1)]);
  };

  const handleImport = async () => {
    if (!file) {
      return;
    }
    await sqlite.init();
    
    const tableName = file.name.substring(0, file.name.indexOf('.')).replace(/-/g,'_');
    const tableColumns = types.map((t, i) => `${headers[i] || customHeaders[i] || `column_${i}`} ${t}`);
    
    const createTableSql = `CREATE TABLE IF NOT EXISTS [${tableName}] (${tableColumns.map(c => `[${c}]`).join(', ')})`;
    await sqlite.exec(createTableSql);
    for(const row of rows) {
      const insertRowSql = `INSERT INTO [${tableName}] VALUES (${row.map(() => '?').join(', ')})`;
      await sqlite.exec(insertRowSql, [...row]);
    }

    onCancel();
  };

  return (
    <Dialog open={!!file} onCancel={onCancel}>
      {!!file && (
        <div style={{ maxWidth: '90vw' }}>
          <p>Import CSV File</p>
          <p>{file.name}</p>
          <label>Data Has Headers</label>
          <input type="checkbox" onChange={e => setDataHasHeaders(e.target.checked)} />
          {!dataHasHeaders &&
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              {customHeaders.map((h, i) => <input key={i} style={{ flexGrow: 1, minWidth: 10 }} value={h} onChange={e => setCustomHeader(i, e.target.value)}/>)}
            </div>
          }
          <div
            style={{
              maxHeight: '50vh',
              overflow: 'auto',
            }}
          >
            <table
              style={{
                width: '100%'
              }}
            >
              {!!headers.length &&
                <thead>
                  <tr>
                    {headers.map((h, i) => <th key={i}>{h || customHeaders[i] || `column_${i}`} ({types[i].substring(0, 1)})</th>)}
                  </tr>
                </thead>
              }
              <tbody>
                {rows.map((r, i) => <tr key={i}>{r.map((d, i) => <td key={i}>{d}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
          <button onClick={() => handleImport()}>Import</button>
        </div>
      )}
    </Dialog>
  );
};
