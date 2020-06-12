import { LanguageData, File, UpdateResponse } from '../view/Types/model';

import FileService from '../services/FileService';
import PolicyModelLibApi from '../services/PolicyModelLibApi';

var PATH = require('path');

const systemFilesNameToFilter = ['.DS_Store'];
const supportedExtensions = ['.md', '.txt'];



/**
 * The LocalizationDomain class is the main domain of the localization app.
 * It uses as the model and the controller in the localization app design.
 * Responsible for handling all the events that called by the client.
 * Also responsible for all localization files operation thru {@link FileService}.
 *
*/

export default class LocalizationDomain {
  _localizationPath: string;
  _extensionProps: any;
  _onError: any;
  _updateResponse: UpdateResponse

  constructor(extensionProps, localizationPath, onError) {
    this._extensionProps = extensionProps;
    this._localizationPath = localizationPath;
    this._onError = onError;
  }


/**
 * Starts the localization app, using new instance of {@link ViewLoader}.
 *
 * @param  {UpdateResponse} updateResponse update action response to present in the client.
*/

  activateLocalization(updateResponse?: UpdateResponse) {
    this._updateResponse = updateResponse;
    const languagesFilesData = this.getLanguagesFilesData();
    const ViewLoader = require('../view/ViewLoader').default; //lazy loading require for testing this component without 'vscode' dependency
    const view = new ViewLoader(languagesFilesData, this._extensionProps, { onSaveFile: this.onSaveFile, createNewLanguage: this.createNewLanguage }, this._onError);

  }

  /**
   * Using {@link PolicyModelLibApi} to create new language.
   *
   * @param  {string} name new localization name.
  */

  createNewLanguage = async (name) => {
    const api: PolicyModelLibApi = PolicyModelLibApi.getInstance();
    const created = await api.createNewLocalization(name);
    if (created) {
      const newLanguagesFilesData = this.getLanguagesFilesData();
      return newLanguagesFilesData;
    } else {
      this._onError("Cannot add languages")
    }
  }

  filterSystemFiles(direntFiles) {
    return direntFiles.filter(file => !systemFilesNameToFilter.includes(file.name));
  }

  isSupportedFile(path) {
    return supportedExtensions.includes(PATH.extname(path));
  }



  createLanguageFilesData(languageDir): LanguageData {
    const languagePath = this._localizationPath + '/' + languageDir.name;
    const allFiles = this.getFiles(this._localizationPath + '/' + languageDir.name);
    return { language: languageDir.name, files: allFiles, id: languagePath };
  }

  getFiles = (path: string): File[] => {
    let directoryContent;
    try {
      directoryContent = FileService.getDirectoryContent(path);
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
        if (this.isSupportedFile(filePath)) {
          try {
            const content = FileService.readFromFile(filePath);
            currData = [{ id: filePath, name, content, path: filePath, extension: PATH.extname(filePath), additionalInfo: {} }];
            currData[0] = this.addAdditionalInfoToFile(currData[0]);
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

  addAdditionalInfoToFile(file: File): File {
    const { answersToRemove } = this.getUpdateResponse();
    if (file.name === 'answers.txt') {
      file.additionalInfo = {answersToRemove};
    }
    return file;
  }

  getUpdateResponse(){
    return this._updateResponse || {answersToRemove: []};
  }

  onSaveFile = (path, newData) => {
    FileService.writeToFile(path, newData);
    const newLanguagesFilesData = this.getLanguagesFilesData();
    return newLanguagesFilesData;
  };


  /**
   * Create Language Data objects from the current localization files.
   * This function calls {@link FileService} to get all the relevant data from the files,
   * loop over them and creates adapted object data for the client
   *
   * @returns  {LanguageData[]} LanguageData.
  */

  getLanguagesFilesData(): LanguageData[] {
    let languages_dirent;
    try {
      languages_dirent = FileService.getDirectoryContent(this._localizationPath);
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
