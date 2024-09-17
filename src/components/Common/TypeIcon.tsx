import { faCubes } from "@fortawesome/free-solid-svg-icons/faCubes";
import { faHashtag } from "@fortawesome/free-solid-svg-icons/faHashtag";
import { faQuestion } from "@fortawesome/free-solid-svg-icons/faQuestion";
import { faQuoteRight } from "@fortawesome/free-solid-svg-icons/faQuoteRight";
import { faSquareRootVariable } from "@fortawesome/free-solid-svg-icons/faSquareRootVariable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
  type: string;
};

export const TypeIcon = ({ type }: Props) => {
  switch (type?.toLowerCase()) {
    case 'int':
    case 'integer':
      return <FontAwesomeIcon title="Integer" icon={faHashtag} />;
    case 'real':
      return <FontAwesomeIcon title="Real" icon={faSquareRootVariable} />;
    case 'text':
      return <FontAwesomeIcon title="Text" icon={faQuoteRight} />;
    case 'blob':
      return <FontAwesomeIcon title="Blob" icon={faCubes} />
    case 'any':
    default:
      return <FontAwesomeIcon title="Any" icon={faQuestion} />
  }
};
