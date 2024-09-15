/**
 * Loading spinner HTML provided by https://loading.io/css/ under CC0 License.
 */

import './Spinner.css';

export const Spinner = () => {
  return (
    <div className="lds-default">
      <div/><div/><div/><div/><div/><div/><div/><div/><div/><div/><div/><div/>
    </div>
  );
};