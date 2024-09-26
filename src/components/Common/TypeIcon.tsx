import { FieldBinaryOutlined, FieldNumberOutlined, FieldStringOutlined, QuestionOutlined } from "@ant-design/icons";

interface Props {
  type: string;
};

export const TypeIcon = ({ type }: Props) => {
  switch (type?.toLowerCase()) {
    case 'int':
    case 'integer':
    case 'real':
      return <FieldNumberOutlined />;
    case 'text':
      return <FieldStringOutlined />;
    case 'blob':
      return <FieldBinaryOutlined />;
    case 'any':
    default:
      return <QuestionOutlined />;
  }
};
