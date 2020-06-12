import * as React from 'react';
import AnswersFileContent from './AnswersFileContent';
import SpaceFileContent from './SpaceFileContent';
import TextEditor from './TextEditor';
import Text from '../Text/Text';
import Page from '../Page/Page';
import { File } from '../Types/model';


/**
 * This component is container for all the editor panel components.
 * @param   {File} fileData    file object data.
 * @param   {onSaveCallback} onFileChange    onFileChange handler
*/

interface Props {
  fileData: File;
  onFileChange(path: string, content: string): void;
}

const FileContent: React.FunctionComponent<Props> = props => {
  const { name, content, path, id, additionalInfo } = props.fileData;
  const handleFileChange = content => {
    props.onFileChange(path, content);
  };

  let RendererComponent;
  let editorHeader;
  switch (name) {
    case 'answers.txt':
      RendererComponent = <AnswersFileContent key={id} content={content} onFileChange={handleFileChange} additionalInfo={additionalInfo} />;
      editorHeader = "answer.txt editor"
      break;
    case 'space.md':
    case 'sections.md':
      RendererComponent = <SpaceFileContent key={id} content={content} onFileChange={handleFileChange} />;
      editorHeader = "MarkDown editor"
      break;
    default:
      RendererComponent = <TextEditor key={id} content={content} onFileChange={handleFileChange} />;
      editorHeader = "MarkDown editor"
      break;
  }

  const renderHeader = () => {
    return (
      <div>
        <Text bold color={'white'} key={name} size={'25px'}>
          {name}
        </Text>
        <Text key={'md'} size={'smaller'}>
          {editorHeader}
        </Text>
      </div>
    );
  };

  return <Page content={RendererComponent} header={renderHeader()} />;
};

export default FileContent;
