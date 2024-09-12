import { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import './App.css';
import { sqlite } from './sqlite';
import { Sidebar } from './components/Sidebar';

function App() {
  const [sql, setSql] = useState<string>('');
  const [cols, setCols] = useState<string[]>([]);
  const [rows, setRows] = useState<any[][]>([]);

  useEffect(() => {
    sqlite.init().then(() => {
      sqlite.exec('CREATE TABLE IF NOT EXISTS test (a, b)');
    });
  }, []);

  return (
    <div
      id="main"
      style={{
        height: '100vh',
        width: '100vw',
      }}
    >
      <PanelGroup direction="horizontal">
        <Panel defaultSize={10} minSize={10}>
          <Sidebar />
        </Panel>
        <PanelResizeHandle />
        <Panel>
          <PanelGroup direction="vertical">
            <Panel>
              <div
                className="fill"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                  }}
                >
                  <button
                    onClick={
                      () => sqlite.exec(sql).then(result => {
                        setCols(result.columns);
                        setRows(result.rows);
                      })
                    }
                  >
                    Run Query
                  </button>
                </div>
                <textarea
                  style={{
                    flexGrow: 1,
                    resize: 'none',
                  }}
                  onChange={result => setSql(result.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && event.ctrlKey) {
                      sqlite.exec(sql).then(result => {
                        setCols(result.columns);
                        setRows(result.rows);
                      });
                    }
                  }}
                />
              </div>
            </Panel>
            <PanelResizeHandle />
            <Panel defaultSize={10}>
              <div
                className="fill"
                style={{
                  overflow: 'auto',
                }}
              >
                <table
                  style={{
                    textAlign: 'left',
                  }}
                >
                  <thead>
                    <tr>
                      {cols.map((c, i) => <th key={i}>{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>{r.map((d, i) => <td key={i}>{d}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}

export default App;
