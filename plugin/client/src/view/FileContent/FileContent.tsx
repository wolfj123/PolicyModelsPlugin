import * as React from 'react';
import AnswersFileContent from './AnswersFileContent';
import SpaceFileContnet from './SpaceFileContnet';
import TextEditor from './TextEditor';
import Text from '../Text/Text';
import Page from '../Page/Page';
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
    case 'sections.md':
      RendererComponent = <SpaceFileContnet key={id} content={content} onFileChange={handleFileChange} />;
      break;
    default:
      RendererComponent = <TextEditor key={id} content={content} onFileChange={handleFileChange} />;
      break;
  }

  const renderHeader = () => {
    return (
      <div>
        <Text bold color={'white'} key={name} size={'25px'}>
          {name}
        </Text>
        <Text key={'md'} size={'smaller'}>
          MarkDown editor
        </Text>
      </div>
    );
  };

  return <Page content={RendererComponent} header={renderHeader()} />;
};

export default FileContent;
