import { LanguageData, File } from '../view/Types/model';
import FileService from './FileService';

var fs = require('fs');
var PATH = require('path');

const systemFilesNameToFilter = ['.DS_Store'];
const supportedExtensions = ['.md', '.txt'];
const e = (message, functionName) => console.error(`Localization Error: ${message}. \n Function: ${functionName}`);

export default class LocalizationController {
  _localizationPath: string;
  _extensionProps: any;
  _fileService: any;
  _onError: any;

  constructor(extensionProps,rootPath,onError) {
    this._extensionProps = extensionProps;
    this._fileService = new FileService(e);
    this._localizationPath = rootPath + '/languages';
    this._onError = onError;
  }

  activateLocalization() {
    let languagesFilesData;
    try{
     languagesFilesData = this.getLanguagesFilesData();
    }catch(e){
      this._onError(e);
    }
    const ViewLoader = require('../view/ViewLoader').default;   //lazy loading require for testing this component without 'vscode' dependency
    const view = new ViewLoader(languagesFilesData, this._extensionProps, this.onSaveFile,this._onError);
  }

  filterSystemFiles(direntFiles) {
    return direntFiles.filter(file => !systemFilesNameToFilter.includes(file.name));
  }

  isSupportedFile(path) {
    return supportedExtensions.includes(PATH.extname(path));
  }

  createLanguageFilesData(languageDir): LanguageData {
    const allFiles = this.getAllFiles(this._localizationPath + '/' + languageDir.name);
    return { language: languageDir.name, files: allFiles };
  }

  getAllFiles = (path: string): File[] =>  {
    const directoryContent = this._fileService.getDirectoryContent(path);
    let filteredFiles = this.filterSystemFiles(directoryContent);
    const filesData = filteredFiles.reduce((dataAcc, dirent) => {
      const { name } = dirent;
      const filePath = path + '/' + name;
      let currData;
      if (dirent.isFile()) {
        if (this.isSupportedFile(filePath)) {
          const content = this.readFromFile(filePath);
          currData = [{ id: filePath, name, content, path: filePath, extension: PATH.extname(filePath) }];
        } else {
          currData = [];
        }
      } else if (dirent.isDirectory()) {
        currData = this.getAllFiles(filePath);
      } else {
        e(` File ${path}/ ${name} is not directory or regular file`, 'getAllFiles');
      }
      return dataAcc.concat(currData);
    }, []);
    return filesData || [];
  }

  writeToFile(path, newData) {
    try {
      fs.writeFileSync(path, newData);
    } catch (err) {
      throw new Error("Cant write to File: "+path);
    }
  }

  onSaveFile = (path, newData) => {
    this.writeToFile(path, newData);
    const newLanguagesFilesData = this.getLanguagesFilesData();
    return newLanguagesFilesData;
  };

  readFromFile(path) {
    let content = null;
    try {
      content = fs.readFileSync(path, 'utf8');
    } catch (error) {
      e(error, 'readFromFile');
    }
    return content;
  }

  getLanguagesFilesData(): LanguageData[] {
    let languages_dirent = this._fileService.getDirectoryContent(this._localizationPath);
    languages_dirent = this.filterSystemFiles(languages_dirent);
    const languagesFilesData = languages_dirent.map(language =>
      language.isDirectory() ? this.createLanguageFilesData(language) : e(`Expected ${language.name} to be language folder`, 'activateLocalization')
    );
    return languagesFilesData;
  }
}
