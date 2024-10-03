import { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import './App.css';
import { sqlite } from './sqlite';
import { Sidebar } from './components/Sidebar';
import { MonacoEditor } from './monaco/MonacoEditor';
import { SQLiteResults } from './sqlite/types';
import { ConfigProvider } from 'antd';

function App() {
  const [sql, setSql] = useState<string>('');
  const [result, setResult] = useState<SQLiteResults>({
    isError: false,
    columns: [],
    rows: [],
  });

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
      <ConfigProvider
        theme={{
          components: {
            Form: {
              itemMarginBottom: 12,
            },
          },
        }}
      >
        <PanelGroup direction="horizontal">
          <Panel defaultSize={15} minSize={10}>
            <Sidebar />
          </Panel>
          <PanelResizeHandle style={{ backgroundColor: 'black', width: 1 }} />
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
                    <button onClick={() => sqlite.exec(sql).then(setResult)}>
                      Run Query
                    </button>
                  </div>
                  <MonacoEditor
                    onChange={value => setSql(value)}
                    onSubmit={value => sqlite.exec(value).then(setResult)}
                  />
                </div>
              </Panel>
              <PanelResizeHandle style={{ backgroundColor: 'black', height: 1 }} />
              <Panel defaultSize={20}>
                <div
                  className="fill"
                  style={{
                    overflow: 'auto',
                  }}
                >
                  <table
                    style={{
                      color: result.isError ? 'red' : 'unset',
                      textAlign: 'left',
                    }}
                  >
                    <thead>
                      <tr>
                        {result.columns.map((c, i) => <th key={i}>{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((r, i) => (
                        <tr key={i}>{r.map((d, i) => <td key={i}>{d}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </ConfigProvider>
    </div>
  );
}

export default App;
