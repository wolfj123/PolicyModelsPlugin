import React, { FunctionComponent } from 'react';
import * as ReactDOM from 'react-dom';
import { ICommand, CommandAction } from '../Types/model';
import LocalizationContainer from '../LocalizationContainer/LocalizationContainer';

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

  const onSave = (path, content) => {
    const command: ICommand = {
      action: CommandAction.Save,
      content: content,
      additionalInfo: { path }
    };
    vscode.postMessage(command);
  };

  React.useEffect(() => {
    window.addEventListener('message', event => {
      const newLanguageFiles = event.data;
      setStore(newLanguageFiles);
    });
  }, []);

  const { languageFilesData } = store;
  return <LocalizationContainer languageFilesData={languageFilesData} onSave={onSave} />;
};

ReactDOM.render(<App initialLanguageFilesData={languageFilesData} />, document.getElementById('root'));
