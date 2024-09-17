import { useState } from 'react';
import './TableDefinition.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquareMinus, faSquarePlus } from '@fortawesome/free-regular-svg-icons';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons/faTrashCan';
import { TypeIcon } from './Common/TypeIcon';

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
        <button title={open ? "Show less" : "Show more"} className="btn-icon" onClick={() => setOpen(!open)}>
          <FontAwesomeIcon icon={open ? faSquareMinus : faSquarePlus} />
        </button>
        <label onClick={() => setOpen(!open)}>{definition.name}</label>
        <button className="btn-icon" title="Delete table"onClick={onDelete}>
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      </div>
      <div>
        {open && (
          <ul>
            {definition.columns.map(column => (
              <li key={column.cid}>
                <TypeIcon type={column.type} /> {column.name}{column.isNotNull ? ' NOT NULL' : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};