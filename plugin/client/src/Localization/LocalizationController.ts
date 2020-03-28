import * as vscode from 'vscode';
import ViewLoader from '../view/ViewLoader';

var fs = require('fs');
var PATH = require('path');

let id = 0;

const systemFilesNameToFilter = ['.DS_Store'];
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

  createLanguageFilesData(languageDir) {
    const allFiles = this.getAllFiles(this._localizationPath + '/' + languageDir.name);
    return { language: languageDir.name, files: allFiles };
  }

  getAllFiles(path) {
    let direntFiles;
    try {
      direntFiles = fs.readdirSync(path, { withFileTypes: true });
    } catch (err) {
      if (err) {
        e(err, 'getAllFiles');
        return;
      }
    }

    const filteredFiles = this.filterSystemFiles(direntFiles);
    const filesData = filteredFiles.reduce((dataAcc, dirent) => {
      const { name } = dirent;
      const filePath = path + '/' + name;
      let currData;
      if (dirent.isFile()) {
				const content = this.readFromFile(filePath);
        currData = [{ id: id++, name,content, path: filePath, extension: PATH.extname(filePath) }];
      } else if (dirent.isDirectory()) {
        currData = this.getAllFiles(filePath);
      } else {
        e(` File ${path}/ ${name} is not directory or regular file`, 'getAllFiles');
      }
      return dataAcc.concat(currData);
    }, []);
    return filesData;
  }

  writeToFile(path, newData) {
    fs.writeFileSync(path, newData);
	}

	onSaveFile = (path, newData) =>{
		this.writeToFile(path, newData);
		const newLanguagesFilesData = this.getLanguagesFilesData();
		return newLanguagesFilesData;
	}

  readFromFile(path) {
    let content = null;
    try {
      content = fs.readFileSync(path, 'utf8');
    } catch (error) {
      e(error, 'readFromFile');
    }
    return content;
	}

	getLanguagesFilesData(){
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
