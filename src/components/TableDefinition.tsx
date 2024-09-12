import { useState } from 'react';
import './TableDefinition.css';

interface TableDef {
  name: string;
  columns: {
    cid: number;
    name: string;
    type: string;
    isNotNull: boolean;
    isPrimaryKey: boolean;
  }[];
}

interface Props {
  definition: TableDef;
  onDelete: () => void;
}

export const TableDefinition = ({ definition, onDelete }: Props) => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <div className="table-definition">
      <div className="background-button">
        <button className="expand-button" onClick={() => setOpen(!open)}>
          {open ? '-' : '+'}
        </button>
        <label onClick={() => setOpen(!open)}>{definition.name}</label>
        <button onClick={onDelete}>
          Delete
        </button>
      </div>
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