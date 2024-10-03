import { useCallback, useEffect, useMemo, useState } from 'react';
import { sqlite } from '../sqlite';
import { ImportModal } from './ImportModal';
import { Button, Flex, Typography, Tree, Popconfirm } from 'antd';
const { Text } = Typography;
import { DeleteTwoTone, ImportOutlined, ReloadOutlined } from '@ant-design/icons';
import { TypeIcon } from './Common/TypeIcon';

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
  const [selectedTable, setSelectedTable] = useState<string>();

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

  const tableTree = useMemo(() => (
    tables
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((table) => ({
        title: (
          <Flex rootClassName="hover-trigger" align="center" justify="space-between">
            {table.name}
            <Popconfirm
              title={`Delete ${table.name}?`}
              description="This action cannot be undone."
              okText="Delete"
              okType="danger"
              placement="right"
              onConfirm={() => handleDelete(table.name)}
            >
              <Button
                rootClassName="hover-show"
                icon={<DeleteTwoTone twoToneColor="#eb2f96" />}
                size="small"
                title={`Delete ${table.name}`}
                type="text"
                onClick={(event) => event.stopPropagation()}
              />
            </Popconfirm>
          </Flex>
        ),
        key: table.name,
        children: table.columns.map(column => ({
          title: column.name,
          key: `${table.name}.${column.name}`,
          icon: <TypeIcon type={column.type} />,
          selectable: false,
          children: [
            { title: column.type.toUpperCase(), key: `${table.name}.${column.name}.type`, selectable: false },
            { title: `${column.isNotNull ? 'NOT ' : ''}NULL`, key: `${table.name}.${column.name}.null`, selectable: false },
          ],
        })),
      }))
  ), [tables, handleDelete]);

  useEffect(() => {
    handleRefresh()
  }, [handleRefresh]);

  return (
    <div>
      <Flex style={{ padding: 4 }} justify="space-between">
        <Text>Tables</Text>
        <Flex gap={2}>
          <Button icon={<ImportOutlined />} size="small" title="Import CSV" type="text" onClick={() => setDialogOpen(true)} />
          <Button icon={<ReloadOutlined />} size="small" title="Refresh tables" type="text" onClick={handleRefresh} />
          {selectedTable && (
            <Button
              icon={<DeleteTwoTone twoToneColor="#eb2f96" />}
              size="small"
              title={`Delete ${selectedTable}`}
              type="text"
              onClick={() => {
                handleDelete(selectedTable);
                setSelectedTable(undefined);
              }}
            />
          )}
        </Flex>
      </Flex>
      <Tree
        rootStyle={{ background: 'none' }}
        blockNode={true}
        showIcon={true}
        showLine={true}
        treeData={tableTree}
        onSelect={([ key ]) => {
          setSelectedTable(key?.toString());
        }}
      />
      <ImportModal open={dialogOpen} onCancel={() => setDialogOpen(false)} />
    </div>
  );
};