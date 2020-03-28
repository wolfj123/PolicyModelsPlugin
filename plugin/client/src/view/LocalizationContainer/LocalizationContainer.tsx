import * as React from 'react';
import Text from '../Text/Text';
import './LocalizationContainer.css';

interface Props {
  languageFilesData: any;
  onSave(path: string, content: string): void;
}

const LocalizationContainer: React.FunctionComponent<Props> = ({ languageFilesData, onSave }) => {
  console.log(onSave);
  const [selectedLanguage, setSelectedLanguage] = React.useState(languageFilesData[0]);
  const [selectedFile, setSelectedFile] = React.useState(languageFilesData[0].files[0]);
  const languages = languageFilesData.map(data => {
    const isSelected = selectedLanguage.language === data.language;
    return (
      <Text onClick={() => {setSelectedLanguage(data); setSelectedFile(data.files[0]);}} isSelected={isSelected}>
        {data.language}
      </Text>
    );
  });

  const createFilesList = language =>  language.files.map(file => {
    const isSelected = selectedFile.id === file.id;
    return (
      <Text onClick={() => setSelectedFile(file)} isSelected={isSelected}>
        {file.name}
      </Text>
    );
  });

  return (
    <div className={'container'}>
      <div className="panel">{languages}</div>
      <div className="panel">{createFilesList(selectedLanguage)}</div>
      <div className="panel">{'mark down'}</div>
    </div>
  );
};

export default LocalizationContainer;
