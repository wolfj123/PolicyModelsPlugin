import * as React from 'react';
import AnswersFileContent from './AnswersFileContent';
import { File } from '../Types/model';
const ReactMarkdown = require('react-markdown');

interface Props {
  fileData: File;
  onFileChange(path: string, content: string): void;
}

const FileContent: React.FunctionComponent<Props> = (props) => {
  const { name, content, extension, path } = props.fileData;

  const handleFileChange = (content) => {
    props.onFileChange(path, content);
  };

  let RendererComponent;
  if (name == 'answers.txt') {
    RendererComponent = <AnswersFileContent content={content} onFileChange={handleFileChange} />;
  } else {
    RendererComponent = <ReactMarkdown source={content} />;
  }
  return (
    <div>
      {name}
      {extension}
      {RendererComponent}
    </div>
  );
};

export default FileContent;
