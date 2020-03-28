import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ICommand, CommandAction } from './model';

declare global {
  interface Window {
    acquireVsCodeApi(): any;
    initialData: any;
  }
}
const vscode = window.acquireVsCodeApi();
const languageFilesData = window.initialData;

const onSave = (path, content) => {
  const command: ICommand = {
    action: CommandAction.Save,
    content: content,
    additionalInfo: { path }
  };
  vscode.postMessage(command);
};

interface Props {
  initialLanguageFilesData: any;
}

interface TestProps {
  languageFilesData: any;
}

const Test: React.FC<TestProps> = ({ languageFilesData }) => {
  const [inp,setinp] = React.useState("");
  const la = languageFilesData[0];
  const file = la.files[0];
  const path = file.path;
  const content = file.content;
  return (
    <div>
      <input type="text" value={inp} onChange={e=> setinp(e.target.value)}></input>
      <button onClick={() => onSave(path, inp)}>write to file</button>
      {content}
    </div>
  );
};

const App: React.FC<Props> = ({ initialLanguageFilesData }) => {
  const initialState = {
    languageFilesData: initialLanguageFilesData
  };

  const [state, setState] = React.useState(initialState);
  React.useEffect(() => {
    window.addEventListener('message', event => {
      const newLanguageFiles = event.data;
      setState(newLanguageFiles);
      console.log(event);
    });
  }, []);


  const { languageFilesData } = state;
  return <Test languageFilesData={languageFilesData} />;
};

ReactDOM.render(<App initialLanguageFilesData={languageFilesData} />, document.getElementById('root'));
