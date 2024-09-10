import { useState } from 'react';
import './TableDefinition.css';

type TableDef = {
  name: string,
  columns: {
    cid: number,
    name: string,
    type: string,
    isNotNull: boolean,
    isPrimaryKey: boolean,
  }[];
};

type Props = {
  definition: TableDef,
};

export const TableDefinition = ({ definition }: Props) => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <div className="table-definition">
      <button onClick={() => setOpen(!open)}>
        <span>
          {open ? '[-]' : '[+]'}
        </span>
        <label>{definition.name}</label>
      </button>
      <div>
        {open && (
          <ul>
            {definition.columns.map(column => (
              <li key={column.cid}>
                {column.name} {column.type}{column.isNotNull ? ' NOT NULL' : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};