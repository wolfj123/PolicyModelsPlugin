import * as React from 'react';
import AnswersFileContent from './AnswersFileContent';
import SpaceFileContnet from './SpaceFileContnet';
import TextEditor from './TextEditor';
import { File } from '../Types/model';

interface Props {
  fileData: File;
  onFileChange(path: string, content: string): void;
}

const FileContent: React.FunctionComponent<Props> = props => {
  const { name, content, path, id } = props.fileData;

  const handleFileChange = content => {
    props.onFileChange(path, content);
  };

  let RendererComponent;
  switch (name) {
    case 'answers.txt':
      RendererComponent = <AnswersFileContent key={id} content={content} onFileChange={handleFileChange} />;
      break;
    case 'space.md':
      RendererComponent = <SpaceFileContnet key={id} content={content} onFileChange={handleFileChange} />;
      break;
    default:
      RendererComponent = <TextEditor key={id} content={content} onFileChange={handleFileChange}/>;
      break;
  }

  return RendererComponent;
};

export default FileContent;
