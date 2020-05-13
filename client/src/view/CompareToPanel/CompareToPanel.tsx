import * as React from 'react';
import Select from '../Select';
import Text from '../Text/Text';
import { File } from '../Types/model';
import AnswersPreview from './AnswersPreview';
import Page from '../Page/Page';
const ReactMarkdown = require('react-markdown');

interface Props {
  previewFile: File;
  languages: string[];
  onSelectLanguage: any;
  previewLanguageName: string;
}

const CompareToPanel: React.FunctionComponent<Props> = props => {
  const { previewFile, languages, onSelectLanguage, previewLanguageName } = props;
  const { content,name } = previewFile;

  const renderHeader = () => {
    return (
      <div>
        <Text bold color={'white'} key={'pr'} size={'25px'}>
          Preview
        </Text>
        <Text key={''} size={'smaller'}>
          choose language: <Select options={languages} selected={previewLanguageName} onSelect={onSelectLanguage} />
        </Text>
      </div>
    );
  };

  let RendererComponent;
  switch (name) {
    case 'answers.txt':
      RendererComponent = <AnswersPreview content={content}/>;
      break;
    default:
      RendererComponent = <ReactMarkdown source={content}/>;
      break;
  }

  return (
    <Page
      header={renderHeader()}
      content={RendererComponent}
    />
  );
};

export default CompareToPanel;
