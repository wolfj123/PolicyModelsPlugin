import * as React from 'react';
const ReactMarkdown = require('react-markdown');
import Select from 'react-select';

interface ContentData {
  name: string;
  content: string;
  extension: string;
}

interface Props {
  contentData: ContentData;
  languages: string[];
  onSelectLanguage: any;
}

const CompareToPanel: React.FunctionComponent<Props> = (props) => {
  const { contentData, languages } = props;
  const { name, content, extension } = contentData;

  const languagesOptions = languages.map((language) => {
    return { value: language, label: language };
  });
  return (
    <>
      <div style={{ minWidth: '225px', color: 'black' }}>
        <Select options={languagesOptions} value={languages[0]} />
      </div>
      {name}
      {extension}
      <ReactMarkdown source={content} />
    </>
  );
};

export default CompareToPanel;
