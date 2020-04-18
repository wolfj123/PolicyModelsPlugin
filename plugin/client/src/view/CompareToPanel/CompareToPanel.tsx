import * as React from 'react';
import Select from '../Select';
import { File } from '../Types/model';
const ReactMarkdown = require('react-markdown');

interface Props {
  previewFile: File;
  languages: string[];
  onSelectLanguage: any;
  previewLanguageName: string;
}

const CompareToPanel: React.FunctionComponent<Props> = props => {
  const { previewFile, languages, onSelectLanguage, previewLanguageName } = props;
  const {content } = previewFile;

  return (
    <>
      <Select options={languages} selected={previewLanguageName} onSelect={onSelectLanguage} />
      <ReactMarkdown source={content} />
    </>
  );
};

export default CompareToPanel;
