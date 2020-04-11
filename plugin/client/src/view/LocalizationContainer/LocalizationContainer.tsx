import * as React from 'react';
import Text from '../Text/Text';
import FileContent from '../FileContent/FileContent';
import CompareToPanel from '../CompareToPanel/CompareToPanel';
import {LanguageData} from '../Types/model';
import './LocalizationContainer.css';

interface Props {
  languageFilesData: LanguageData[];
  onSave(path: string, content: string): void;
}

const LocalizationContainer: React.FunctionComponent<Props> = ({ languageFilesData, onSave }) => {
  const [selectedLanguage, setSelectedLanguage] = React.useState(languageFilesData[0]);
  const [selectedFile, setSelectedFile] = React.useState(languageFilesData[0].files[0]);

  const handleFileChange = (path,content)=>{
    onSave(path,content);
  }

  const languagesMenu = languageFilesData.map(data => {
    const isSelected = selectedLanguage.language === data.language;
    return (
      <Text onClick={() => {setSelectedLanguage(data); setSelectedFile(data.files[0]);}} isSelected={isSelected}>
        {data.language}
      </Text>
    );
  });


  const filesList = selectedLanguage.files.map(file => {
    const isSelected = selectedFile.id === file.id;
    return (
      <Text onClick={() => setSelectedFile(file)} isSelected={isSelected}>
        {file.name}
      </Text>
    );
  });

  const languagesNames = languageFilesData.map(languageData => languageData.language);
  return (
    <div className={'container'}>
      <div className="panel">{languagesMenu}</div>
      <div className="panel">{filesList}</div>
      <div className="panel"><FileContent key={selectedFile.id} fileData={selectedFile} onFileChange={handleFileChange}/></div>
      <div className="panel"><CompareToPanel key={selectedFile.id} languages={languagesNames} contentData={selectedFile} onSelectLanguage={language => console.log(`${language} is selected`)}/></div>
    </div>
  );
};

export default LocalizationContainer;
