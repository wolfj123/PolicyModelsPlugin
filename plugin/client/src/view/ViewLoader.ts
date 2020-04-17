import * as vscode from 'vscode';
import * as path from 'path';

import { ICommand, CommandAction } from './Types/model';

export default class ViewLoader {
  private readonly _panel: vscode.WebviewPanel | undefined;
  private readonly _extensionPath: string;
  private _disposables: vscode.Disposable[] = [];

  constructor(languageFilesData, extensionProps, onSave) {
    const { extensionPath } = extensionProps;
    this._extensionPath = extensionPath;
    this._panel = vscode.window.createWebviewPanel('Localization', 'Localization', vscode.ViewColumn.One, {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'configViewer'))],
      retainContextWhenHidden: true
    });

    this._panel.webview.html = this.getWebviewContent(languageFilesData);

    this._panel.webview.onDidReceiveMessage(
      (command: ICommand) => {
        switch (command.action) {
          case CommandAction.Save:
            const newLanguageFilesData = onSave(command.additionalInfo.path, command.content);
            this.updateLanguageFilesData(newLanguageFilesData);

            return;
        }
      },
      undefined,
      this._disposables
    );
  }

  private updateLanguageFilesData(newLanguageFilesData) {
    this._panel.webview.postMessage({ languageFilesData: newLanguageFilesData });
  }

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
    <body>
        <div id="root"></div>
        <script src="${reactAppUri}"></script>
    </body>
    </html>`;
  }
}
