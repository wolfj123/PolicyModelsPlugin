import * as vscode from 'vscode';
import * as path from 'path';

import { ICommand, CommandAction } from './Types/model';


/**
 * The ViewLoader class is the engine of the localization GUI.
 * responsible to connect the  WebviewPanel with the react application.
 * In addition this class is the first communication layer between the {@link LocalizationDomain}
 * and the Gui. It gets request from the client and pass them to the controller.
 *
*/


export default class ViewLoader {
  private readonly _panel: vscode.WebviewPanel | undefined;
  private readonly _extensionPath: string;
  private _disposables: vscode.Disposable[] = [];

  constructor(languageFilesData, extensionProps, handlers,onError) {
    const {onSaveFile,createNewLanguage} = handlers;
    const { extensionPath } = extensionProps;
    this._extensionPath = extensionPath;
    this._panel = vscode.window.createWebviewPanel('Localization', 'Localization', vscode.ViewColumn.One, {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'configViewer'))],
      retainContextWhenHidden: true,
    });

    this._panel.webview.html = this.getWebviewContent(languageFilesData);

    this._panel.webview.onDidReceiveMessage(
      (command: ICommand) => {
        switch (command.action) {
          case CommandAction.Save:
            try{
            const newLanguageFilesData = onSaveFile(command.additionalInfo.path, command.content);
            this.updateLanguageFilesData(newLanguageFilesData);
            }catch(err){
              onError(err);
            }
            break;
            case CommandAction.NewLanguage:
             vscode.window.showInputBox({prompt: "Enter localization name"}).then(languageName => {
              createNewLanguage(languageName).then(newLanguageFilesData => this.updateLanguageFilesData(newLanguageFilesData));
             } );

              break;
        }
      },
      undefined,
      this._disposables
    );
  }

    /**
   * pass updated languageFilesData from the back end system to the front.
   *
   * @param languageFilesData languages files data to render
  */


  private updateLanguageFilesData(newLanguageFilesData) {
    this._panel.webview.postMessage({ action: CommandAction.Response, content: { languageFilesData: newLanguageFilesData } });
  }


  /**
   * create the initial html file. this file call the app script from the 'reactAppUri'.
   *
   * @param languageFilesData languages files data to render
	 * @returns {string} initial html
  */

  private getWebviewContent(languageFilesData): string {
    // Local path to main script run in the webview
    const reactAppPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'configViewer', 'configViewer.js'));
    const reactAppUri = reactAppPathOnDisk.with({ scheme: 'vscode-resource' });

    const languageFilesDataJson = JSON.stringify(languageFilesData);

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Config View</title>

        <meta http-equiv="Content-Security-Policy"
                    content="default-src 'none';
                             img-src https:;
                             script-src 'unsafe-eval' 'unsafe-inline' vscode-resource:;
                             style-src vscode-resource: 'unsafe-inline';">

        <script>
          window.acquireVsCodeApi = acquireVsCodeApi;
          window.initialData = ${languageFilesDataJson};
        </script>
    </head>
    <body style="background-color:#1e1e1e;color:#d4d4d4;">
        <div id="root"></div>
        <script src="${reactAppUri}"></script>
    </body>
    </html>`;
  }
}
