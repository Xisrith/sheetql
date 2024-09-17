import { useEffect, useState } from 'react';
import { parse } from 'csv-parse/browser/esm/sync';
import { Dialog } from './Common/Dialog';
import { sqlite } from '../sqlite';
import { Spinner } from './Common/Spinner';
import { TypeIcon } from './Common/TypeIcon';

type Props = {
  open: boolean;
  onCancel: () => void;
}

export const ImportModal = ({ open, onCancel }: Props) => {
  // Stage 1 values.
  const [file, setFile] = useState<File>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Stage 2 values.
  const [defaultTableName, setDefaultTableName] = useState<string>('');
  const [customTableName, setCustomTableName] = useState<string>('');
  const [customTableNameError, setCustomTableNameError] = useState<string>('');
  const [delimiter, setDelimiter] = useState<string>(',');
  const [customDelimiter, setCustomDelimiter] = useState<string>('');
  const [customDelimiterError, setCustomDelimiterError] = useState<string>('');
  const [dataHasHeaders, setDataHasHeaders] = useState<boolean>(false);
  const [data, setData] = useState<string[][]>([]);

  const hasData = () => data.length > 0 && data[0].length > 0;

  useEffect(() => {
    if (!file) {
      setDefaultTableName('');
      setData([]);
      return;
    }
    
    // Setup our default table name derived from the file name.
    const fileName = file.name
      .replace(/\..*$/g, '')              // Remove file extensions
      .replace(/-| /g,'_')                // Replace dashes and spaces with underscores
      .replace(/[^\w]/g, '')              // Remove any non-word characters (alpha, num, underscore)
      .replace(/^\d/g, (s) => `_${s}`);   // Put a leading underscore to block a leading number
    setDefaultTableName(fileName);

    // Load the contents of the file.
    file.text().then((text) => {
      try {
        const records = parse(text, {
          delimiter: delimiter === 'custom' ? customDelimiter : delimiter,
          skip_empty_lines: true,
        });
        setData(records);
      } catch { 
        setData([]);
      }
    });
  }, [file, delimiter, customDelimiter]);

  // Stage 3 values.
  const [defaultHeaders, setDefaultHeaders] = useState<string[]>([]);
  const [customHeaders, setCustomHeaders] = useState<string[]>([]);
  const [bodyTypes, setBodyTypes] = useState<string[]>([]);
  const [fullTypes, setFullTypes] = useState<string[]>([]);

  const iconFromType = (type: string) => {
    switch (type) {
      case 'INTEGER':
        return <kbd>#</kbd>;
      case 'REAL':
        return <kbd>.</kbd>;
      case 'TEXT':
        return <kbd>T</kbd>;
      default:
        return <kbd>?</kbd>;
    }
  }

  useEffect(() => {
    if (!hasData()) {
      setDefaultHeaders([]);
      setCustomHeaders([]);
      return;
    }

    // Setup arrays for headers and types.
    const _defaultHeaders = [];
    const _customHeaders = [];
    const _bodyTypes = [];
    const _fullTypes = [];
    for (let i = 0; i < data[0].length; i++) {
      _defaultHeaders.push(`column_${i}`);
      _customHeaders.push('');
      _fullTypes.push('INTEGER');
    }

    // We save two copies of the type array, one that factors in the first row
    // and one that ignores it in case the user says the data has headers.
    // By saving both now, we don't have to reiterate over the data again
    // when the user checks/unchecks "Data Has Headers"
    for (let r = data.length - 1; r >= 0; r--) {
      for (let c = 0; c < data[r].length; c++) {
        // SQLite doesn't have a boolean type, so we make false/true to 0/1
        // to use the integer type as intended by SQLite
        let rv = data[r][c].toLowerCase() === 'false' ? '0' : data[r][c].toLowerCase() === 'true' ? '1' : data[r][c];
        
        // Evalute types based on the full types
        if (_fullTypes[c] !== 'TEXT') {
          if (Number.isNaN(Number.parseFloat(rv)) || rv.replace(/[\.,\-]/g, '').match(/[^\d]/g)) {
            _fullTypes[c] = 'TEXT';
          } else if (Number.parseFloat(rv) !== Number.parseInt(rv)) {
            _fullTypes[c] = 'REAL';
          }
        }

        // If this is the penultimate row, assign types to body types
        if (r === 1) {
          _bodyTypes.push(..._fullTypes);
        }
      }
    }

    // Assign state changes.
    setDefaultHeaders(_defaultHeaders);
    setCustomHeaders(_customHeaders);
    setBodyTypes(_bodyTypes);
    setFullTypes(_fullTypes);
  }, [data]);

  const setCustomHeader = (index: number, value: string) => {
    setCustomHeaders([...customHeaders.slice(0, index), value, ...customHeaders.slice(index + 1)]);
  };

  const handleClose = () => {
    setFile(undefined);
    setIsLoading(false);
    onCancel();
  };

  const handleCustomDelimiterInput = (value: string) => {
    setCustomDelimiter(value);
    if (!value) {
      setCustomDelimiterError('Custom delimiter cannot be empty!');
    }
  };

  const handleImport = async () => {
    if (!file || !hasData) {
      return;
    }
    await sqlite.init();
    
    const tableName = customTableName || defaultTableName;
    const tableColumns = customHeaders.map((_, i) => {
      const columnName = (dataHasHeaders ? data[0][i] : undefined) || customHeaders[i] || defaultHeaders[i];
      const columnType = dataHasHeaders ? bodyTypes[i] : fullTypes[i];
      return `[${columnName}] ${columnType}`;
    });
    
    const createTableSql = `CREATE TABLE IF NOT EXISTS [${tableName}] (${tableColumns.join(', ')})`;
    await sqlite.exec(createTableSql);
    for (let i = dataHasHeaders ? 1 : 0; i < data.length; i++) {
      const insertRowSql = `INSERT INTO [${tableName}] VALUES (${data[i].map(() => '?').join(', ')})`;
      await sqlite.exec(insertRowSql, [...data[i]]);
    }

    handleClose();
  };

  const handleTableNameInput = (value: string) => {
    setCustomTableName(value);
    if (value.match(/^\d/g)) {
      setCustomTableNameError('Table Name cannot start with a number!');
    } else if (value.match(/[^\w]/g)) {
      setCustomTableNameError('Table Name must contain only letters, numbers, and underscores');
    } else {
      setCustomTableNameError('');
    }
  };

  return (
    <Dialog open={open} onCancel={handleClose}>
      {open && (
        <>
          <div style={{ maxWidth: '90vw', minWidth: '480px', position: 'relative' }}>
            <h1>Import CSV</h1>
            <input
              accept=".csv"
              type="file"
              onChange={(event) => {
                setFile(event.target.files?.item(0) ?? undefined);
                setIsLoading(false);
              }}
              onClick={() => setIsLoading(true)}
            />
            {file &&
              <>
                <hr />
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'max-content auto',
                    gridGap: '4px',
                    marginBottom: 8,
                  }}
                >
                  <label htmlFor="table-name">Table Name</label>
                  <input id="table-name" placeholder={defaultTableName} value={customTableName} onChange={e => handleTableNameInput(e.target.value)} />
                  {customTableNameError && <label style={{ color: 'red', fontSize: 12, fontStyle: 'italic', gridColumn: 2 }}>{customTableNameError}</label>}
                  <label>Delimiter</label>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                    <div>
                      <input defaultChecked={true} id="delimiter-comma" name="delimiter" type="radio" value="," onChange={e => setDelimiter(e.target.value)} />
                      <label htmlFor="delimiter-comma">Comma <kbd>,</kbd></label>
                    </div>
                    <div>
                      <input id="delimiter-pipe" name="delimiter" type="radio" value="|" onChange={e => setDelimiter(e.target.value)}/>
                      <label htmlFor="delimiter-pipe">Pipe <kbd>|</kbd></label>
                    </div>
                    <div>
                      <input id="delimiter-space" name="delimiter" type="radio" value=" " onChange={e => setDelimiter(e.target.value)}/>
                      <label htmlFor="delimiter-space">Space</label>
                    </div>
                    <div>
                      <input id="delimiter-custom" name="delimiter" type="radio" value="custom" onChange={e => setDelimiter(e.target.value)}/>
                      <label htmlFor="delimiter-custom">Custom</label>
                    </div>
                  </div>
                  {delimiter === 'custom' && <input style={{ gridColumn: 2 }} value={customDelimiter} onChange={e => handleCustomDelimiterInput(e.target.value)}/>}
                  {delimiter === 'custom' && customDelimiterError && <label style={{ color: 'red', fontSize: 12, fontStyle: 'italic', gridColumn: 2 }}>{customDelimiterError}</label>}
                  <label htmlFor="data-has-headers">Data Has Headers</label>
                  <input id="data-has-headers" type="checkbox" style={{ justifySelf: 'left' }} onChange={e => setDataHasHeaders(e.target.checked)} />
                </div>
              </>
            }
            {hasData() &&
              <>
                <div
                  style={{
                    maxHeight: '50vh',
                    overflow: 'auto',
                  }}
                >
                  <table style={{ minWidth: '100%' }}>
                    <thead>
                      <tr style={{ border: '1px solid black' }}>
                        {data[0].map((head, headIndex) => (
                          <th key={`head_${headIndex}`} style={{  }}>
                            <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', gap: 4 }}>
                              <TypeIcon type={dataHasHeaders ? bodyTypes[headIndex] : fullTypes[headIndex]} />
                              {dataHasHeaders ? head : <input placeholder={defaultHeaders[headIndex]} value={customHeaders[headIndex]} style={{ flexGrow: 1 }} onChange={e => setCustomHeader(headIndex, e.target.value)}/>}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, rowIndex) => (
                        (rowIndex > 0 || !dataHasHeaders) && <tr key={`row_${rowIndex}`}>{row.map((cell, cellIndex) => (
                          <td key={`cell_${rowIndex}_${cellIndex}`}>{cell}</td>
                        ))}</tr> 
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            }
            {file && <hr/>}
            <div style={{ display: 'flex', flexDirection: 'row', gap: 4, justifyContent: 'end' }}>
              <button onClick={handleClose}>Cancel</button>
              {hasData() && <button onClick={handleImport}>Import</button>}
            </div>
          </div>
          {isLoading && (
            <>
              <div style={{ height: 200 }} />
              <div style={{
                display: 'grid',
                alignItems: 'center',
                justifyItems: 'center',
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'white',
              }}>
                <div style={{
                  display: 'grid',
                  alignItems: 'center',
                  justifyItems: 'center',
                }}>
                  <Spinner />
                  Opening CSV file
                </div>
              </div>
            </>
          )}
        </>
      )}
    </Dialog>
  );
};
