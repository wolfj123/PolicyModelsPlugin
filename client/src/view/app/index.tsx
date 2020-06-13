import React, { FunctionComponent } from 'react';
import * as ReactDOM from 'react-dom';
import { ICommand, CommandAction } from '../Types/model';
import LocalizationContainer from '../LocalizationContainer/LocalizationContainer';

 /**
   * The App component is the enrty point for the react app.
   * Its containe the vscode Api and creates custome events for the user
   * localization app operations.
   * Its manage the store (app state) of the react application.
   *
   * @param {LanguageData} initialLanguageFilesData - path of the file that need to be saved.
   */


declare global {
  interface Window {
    acquireVsCodeApi(): any;
    initialData: any;
  }
}
const vscode = window.acquireVsCodeApi();
const languageFilesData = window.initialData;

interface AppProps {
  initialLanguageFilesData: any;

}

const App: FunctionComponent<AppProps> = ({ initialLanguageFilesData }) => {
  const initialState = {
    languageFilesData: initialLanguageFilesData
  };

  const [store, setStore] = React.useState(initialState);

  /**
   * Callback for saving a file.
   * @onSaveCallback onSaveCallback
   * @param {string} path - path of the file that need to be saved.
   * @param {string} content - new content for the provided path.
   */


  const onSave = (path, content) => {
    const command: ICommand = {
      action: CommandAction.Save,
      content: content,
      additionalInfo: { path }
    };
    vscode.postMessage(command);
  };

  /**
   * Callback for creating new language.
   * @onCreateNewLanguageCallBack onCreateNewLanguageCallBack
   */

  const onCreateNewLanguage = async () =>{
    const command: ICommand = {
      action: CommandAction.NewLanguage,
      content: null,
    };
    vscode.postMessage(command);
  }

  React.useEffect(() => {
    window.addEventListener('message', event => {
      const response = event.data;
      if(response.action === CommandAction.Response){
        setStore(response.content);
      }
    });

  }, []);

  const { languageFilesData } = store;
  return <LocalizationContainer languageFilesData={languageFilesData} onSave={onSave} onCreateNewLanguage={onCreateNewLanguage} />;
};

ReactDOM.render(<App initialLanguageFilesData={languageFilesData} />, document.getElementById('root'));
