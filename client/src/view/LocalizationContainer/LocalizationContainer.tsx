import * as React from 'react';
import FileContent from '../FileContent/FileContent';
import CompareToPanel from '../CompareToPanel/CompareToPanel';
import SideBarMenu from '../SideBarMenu/SideBarMenu';
import { LanguageData,ItemMenuData } from '../Types/model';
import './LocalizationContainer.css';


interface Props {
  languageFilesData: LanguageData[];
  onSave(path: string, content: string): void;
}


const LocalizationContainer: React.FunctionComponent<Props> = ({ languageFilesData, onSave }) => {
  const [selectedLanguageId, setSelectedLanguageId] = React.useState(languageFilesData[0].id);
  const [selectedFileId, setSelectedFileId] = React.useState(languageFilesData[0].files[0].id);
  const [previewFileId, setPreviewFileId] = React.useState(languageFilesData[0].files[0].id);
  const [previewLanguageName, setPreviewLanguageName] = React.useState(languageFilesData[0].language);

  const selectedLanguage = languageFilesData.find(data => data.id=== selectedLanguageId);
  const selectedFile = selectedLanguage.files.find(file => file.id===selectedFileId);


  const getFileFromId = id =>{
    const allFiles = languageFilesData.reduce((filesAcc,languages) => filesAcc.concat(languages.files),[]);
    return allFiles.find(file => file.id===id)
  }

  const getFileByNameAndLanguageName = (fileName,languageName) =>{
    const languageData = languageFilesData.find(language => language.language===languageName);
    const languageFiles = languageData.files;
    const file = languageFiles.find(file => file.name===fileName);
    return file;
  }

  const setPreviewFileFromSelectedLanguage = language => {
    const currentFileName = selectedFile.name;
    const newPreviewFile = getFileByNameAndLanguageName(currentFileName,language);
    setPreviewFileId(newPreviewFile.id);
    setPreviewLanguageName(language);
  }

  const handleFileChange = (path, content) => {
    onSave(path, content);
  };

  const languagesMenuData: ItemMenuData[] = languageFilesData.map((data) => {
    return {
      isSelected: selectedLanguage.id === data.id,
      onClick: () => {
        setSelectedLanguageId(data.id);
        setSelectedFileId(data.files[0].id);
      },
      text: data.language,
      id: data.id
    };
  });



   const filesMenuData: ItemMenuData[] = selectedLanguage.files.map((file) => {
    return {
      isSelected: selectedFile.id === file.id,
      onClick: () => setSelectedFileId(file.id),
      text: file.name,
      id: file.id
    };
  });

  React.useEffect(()=>setPreviewFileFromSelectedLanguage(previewLanguageName),[selectedFileId]);

  const previewFile = getFileFromId(previewFileId);
  const languagesNames = languageFilesData.map((languageData) => languageData.language);
  return (
    <div className={'App'}>
      <div className={'container'}>
      <div className="panel" style={{flex: '0 0 130px',height: '100%'}}>
        <SideBarMenu filesMenuData={filesMenuData} languagesMenuData={languagesMenuData} />
      </div>
      <div className="panel" style={{flex: '1 1 0',maxWidth: 'calc((100vw - 240px) / 2)'}}>
        <FileContent key={selectedFile.id} fileData={selectedFile} onFileChange={handleFileChange} />
      </div>
      <div className="panel" style={{flex: '1 1 0', maxWidth: 'calc((100vw - 240px) / 2)'}}>
        <CompareToPanel
          key={selectedFile.id}
          languages={languagesNames}
          previewFile={previewFile}
          previewLanguageName={previewLanguageName}
          onSelectLanguage={language => setPreviewFileFromSelectedLanguage(language)}
        />
      </div>
      </div>
    </div>
  );
};

export default LocalizationContainer;
