import * as vscode from 'vscode';
import ViewLoader from '../view/ViewLoader';
import { LanguageData, File } from '../view/Types/model';

var fs = require('fs');
var PATH = require('path');

const systemFilesNameToFilter = ['.DS_Store'];
const supportedExtensions = ['.md', '.txt'];
const e = (message, functionName) => console.error(`Localization Error: ${message}. \n Function: ${functionName}`);

export default class LocalizationController {
  _localizationPath: string;
  _extensionProps: any;

  constructor(extensionProps) {
    this._extensionProps = extensionProps;
    const rootPath = vscode.workspace.rootPath;
    this._localizationPath = rootPath + '/languages';
  }

  activateLocalization() {
    vscode.window.showInformationMessage('Localization is active!');
    const languagesFilesData = this.getLanguagesFilesData();
    const view = new ViewLoader(languagesFilesData, this._extensionProps, this.onSaveFile);
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

  getAllFiles(path: string): File[] {
    let direntFiles;
    try {
      direntFiles = fs.readdirSync(path, { withFileTypes: true });
    } catch (err) {
      if (err) {
        e(err, 'getAllFiles');
        return;
      }
    }

    let filteredFiles = this.filterSystemFiles(direntFiles);

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
      console.log(err);
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
    let direntFiles;
    try {
      direntFiles = fs.readdirSync(this._localizationPath, { withFileTypes: true });
    } catch (err) {
      if (err) {
        e(err, 'activateLocalization');
        return;
      }
    }
    const languages_dirent = this.filterSystemFiles(direntFiles);
    const languagesFilesData = languages_dirent.map(language =>
      language.isDirectory() ? this.createLanguageFilesData(language) : e(`Expected ${language.name} to be language folder`, 'activateLocalization')
    );
    return languagesFilesData;
  }
}
