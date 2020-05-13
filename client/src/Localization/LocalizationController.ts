import { LanguageData, File } from '../view/Types/model';
import FileService from './FileService';

var PATH = require('path');

const systemFilesNameToFilter = ['.DS_Store'];
const supportedExtensions = ['.md', '.txt'];
const localizationRootFolder = '/languages';

export default class LocalizationController {
  _localizationPath: string;
  _extensionProps: any;
  _fileService: any;
  _onError: any;

  constructor(extensionProps, rootPath, onError) {
    this._extensionProps = extensionProps;
    this._fileService = new FileService();
    this._localizationPath = rootPath + localizationRootFolder;
    this._onError = onError;
  }

  activateLocalization({ onError }) {
    const languagesFilesData = this.getLanguagesFilesData();
    const ViewLoader = require('../view/ViewLoader').default; //lazy loading require for testing this component without 'vscode' dependency
    const view = new ViewLoader(languagesFilesData, this._extensionProps, this.onSaveFile, onError);
  }

  filterSystemFiles(direntFiles) {
    return direntFiles.filter(file => !systemFilesNameToFilter.includes(file.name));
  }

  isSupportedFile(path) {
    return supportedExtensions.includes(PATH.extname(path));
  }

  createLanguageFilesData(languageDir): LanguageData {
    const allFiles = this.getFiles(this._localizationPath + '/' + languageDir.name);
    return { language: languageDir.name, files: allFiles };
  }

  getFiles = (path: string): File[] => {
    let directoryContent;
    try {
      directoryContent = this._fileService.getDirectoryContent(path);
    } catch (err) {
      this._onError(err);
      return;
    }
    let filteredFiles = this.filterSystemFiles(directoryContent);
    const filesData = filteredFiles.reduce((dataAcc, dirent) => {
      const { name } = dirent;
      const filePath = path + '/' + name;
      let currData = [];
      if (dirent.isFile()) {
        if(this.isSupportedFile(filePath)){
        try {
          const content = this._fileService.readFromFile(filePath);
          currData = [{ id: filePath, name, content, path: filePath, extension: PATH.extname(filePath) }];
        } catch (err) {
          this._onError(err);
        }
      }
      } else if (dirent.isDirectory()) {
        currData = this.getFiles(filePath);
      } else {
        this._onError(`${path}/ ${name} is not directory or text file`);
      }
      return dataAcc.concat(currData);
    }, []);
    return filesData || [];
  };

  onSaveFile = (path, newData) => {
    this._fileService.writeToFile(path, newData);
    const newLanguagesFilesData = this.getLanguagesFilesData();
    return newLanguagesFilesData;
  };

  getLanguagesFilesData(): LanguageData[] {
    let languages_dirent;
    try {
      languages_dirent = this._fileService.getDirectoryContent(this._localizationPath);
    } catch (e) {
      throw new Error('Cannot read main localization folder.');
    }
    languages_dirent = this.filterSystemFiles(languages_dirent);
    const languagesFilesData = languages_dirent.map(language =>
      language.isDirectory() ? this.createLanguageFilesData(language) : this._onError(`Expected ${language.name} to be language folder`)
    );
    return languagesFilesData;
  }
}
