import * as React from 'react';
 import './Page.css';

/**
 * Staylable page component .
 * @param   {Jsx} header
 * @param   {Jsx} content
*/


interface Props {
  header: any;
  content: any;
}

const Page: React.FunctionComponent<Props> = props => {
  const { header, content } = props;
  return (
    <div className="page">
      <div className="header">{header}</div>
      <div className="content">{content}</div>
    </div>
  );
};

export default Page;
