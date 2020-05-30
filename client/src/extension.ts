/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import * as vscode from 'vscode';
import * as Parser from 'web-tree-sitter';
import * as scopes from './color/scopes';
import * as colors from './color/colors';
import LocalizationController from './Localization/LocalizationController';
import PolicyModelLibApi from './services/PolicyModelLibApi';
import GraphvizController from './Graphviz/GraphvizController';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind, DocumentSelector } from 'vscode-languageclient';
import * as FS from 'fs';


let client: LanguageClient;

export function activate(context: ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  buildLibServiceAppApiInstance();
  
  addGraphvizCommand(context);
  addLocalizationCommand(context);
  addRunCommand(context);
  addNewModelCommand(context);
  activateSyntaxColoring(context);

  // The server is implemented in node
  let serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  let serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions
    }
  };

  let documentSelectorOptions :DocumentSelector =
		[
			{
				language:'policyspace',
				pattern:"**/*.{ps,pspace}"
      },
      {
				language:'valueinference',
				pattern:"**/*.{vi}"
      },
			{
				language:'decisiongraph',
				pattern:"**/*.{dg}"
			}
    ]
  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    //register all relevant file types
    documentSelector: documentSelectorOptions,
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
    },
    outputChannelName: 'Language Server'
  };

  // Create the language client and start the client.
  client = new LanguageClient('PolicyModelsServer', 'PolicyModels Server', serverOptions, clientOptions);

  // Start the client. This will also launch the server
  client.start();

  client.onReady().then(_ => {
    let shouldLog:boolean = vscode.workspace.getConfiguration("PolicyModelsServer").get("Logging") !== "false";
    client.sendRequest("setPluginDir",[context.extensionPath,shouldLog]);

    client.onRequest("getPluginDir",(a)=>{
      console.log(`getPluginDir ------------- ---------------- --------------- ------------------`)
      console.log(`${JSON.stringify(a)}`);
      console.log(`getPluginDir ------------- ---------------- --------------- ------------------`)

      return context.extensionPath;
    });
  });
}

function buildLibServiceAppApiInstance() {
  let rootPath: string = vscode.workspace.rootPath;
  rootPath  = rootPath === undefined ? "" : rootPath;
  const onMessage = message => vscode.window.showInformationMessage("Policy Model CLI: ",message);
  PolicyModelLibApi.buildInstance(rootPath,onMessage);
}


export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}

let myStatusBarItem: vscode.StatusBarItem;

export function addNewModelCommand({ subscriptions }: vscode.ExtensionContext) {
  let myStatusBarItem: vscode.StatusBarItem;

  const myCommandId = 'policymodel.newModel';
  subscriptions.push(
    vscode.commands.registerCommand(myCommandId,async () => {
     PolicyModelLibApi.getInstance().createNewModel()
      .then(async newModelPath => {
          if (FS.existsSync(newModelPath)){
            let uri:vscode.Uri = vscode.Uri.file(newModelPath);
            await vscode.commands.executeCommand('vscode.openFolder', uri)
          }
        })
        .catch(rej => 
          vscode.window.showInformationMessage(rej)
        );
    })
  );

  myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, -100001);
  myStatusBarItem.command = myCommandId;
  subscriptions.push(myStatusBarItem);

  // register some listener that make sure the status bar
  // item always up-to-date
  // subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));
  // subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem));

  // update status bar item once at start
  myStatusBarItem.text = '$(play) new Model';
  myStatusBarItem.show();
}

export function addRunCommand({ subscriptions }: vscode.ExtensionContext) {
  // register a command that is invoked when the status bar
  // item is selected
  const myCommandId = 'policymodel.runModel';
  subscriptions.push(
    vscode.commands.registerCommand(myCommandId, () => {
      client.sendRequest('Run_Model', ['Params for execute']).then((res:string) => vscode.window.showInformationMessage(res));
    })
  );

  // create a new status bar item that we can now manage
  myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, -100001);
  myStatusBarItem.command = myCommandId;
  subscriptions.push(myStatusBarItem);

  // register some listener that make sure the status bar
  // item always up-to-date
  subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));
  subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem));

  // update status bar item once at start
  updateStatusBarItem();
}

function updateStatusBarItem(): void {
  myStatusBarItem.text = '$(play) Run Model';
  myStatusBarItem.show();
}

function addLocalizationCommand(context: vscode.ExtensionContext){
  const localizationCommand = 'activateLocalization';
  const {subscriptions} = context;
  let disposable = vscode.commands.registerCommand(localizationCommand, () => {
    const extensionPath = context.extensionPath;
    const extensionRootPath = vscode.workspace.rootPath;
    const onError = e => vscode.window.showErrorMessage(e);
    const localization = new LocalizationController({ extensionPath },extensionRootPath,onError);
    try{
    localization.activateLocalization({onError});
    }catch(e){
      onError(e);
    }
  });
  subscriptions.push(disposable);

  let statusBarItem: vscode.StatusBarItem;
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, -100000);
  statusBarItem.command = localizationCommand;
  statusBarItem.text = '$(preserve-case) Localization ';
  statusBarItem.show();
  subscriptions.push(statusBarItem);

}

/**************************************/
/******** COLOR SYNTAX SECTION ********/
/**************************************/

// Be sure to declare the language in package.json and include a minimalist grammar.
const languages: {[id: string]: {module: string, color: colors.ColorFunction, parser?: Parser}} = {
	'policyspace': {module: 'tree-sitter-policyspace', color: colors.colorPolicySpace},
	'decisiongraph': {module: 'tree-sitter-decisiongraph', color: colors.colorDecisionGraph},
	'valueinference': {module: 'tree-sitter-valueinference', color: colors.colorValueInference}
}

// Create decoration types from scopes lazily
const decorationCache = new Map<string, vscode.TextEditorDecorationType>();
function decoration(scope: string): vscode.TextEditorDecorationType | undefined {
  // If we've already created a decoration for `scope`, use it
  if (decorationCache.has(scope)) {
    return decorationCache.get(scope);
  }
  // If `scope` is defined in the current theme, create a decoration for it
  const textmate = scopes.find(scope);
  if (textmate) {
    const decoration = createDecorationFromTextmate(textmate);
    decorationCache.set(scope, decoration);
    return decoration;
  }
  // Otherwise, give up, there is no color available for this scope
  return undefined;
}
function createDecorationFromTextmate(themeStyle: scopes.TextMateRuleSettings): vscode.TextEditorDecorationType {
  let options: vscode.DecorationRenderOptions = {};
  options.rangeBehavior = vscode.DecorationRangeBehavior.OpenOpen;
  if (themeStyle.foreground) {
    options.color = themeStyle.foreground;
  }
  if (themeStyle.background) {
    options.backgroundColor = themeStyle.background;
  }
  if (themeStyle.fontStyle) {
    let parts: string[] = themeStyle.fontStyle.split(' ');
    parts.forEach(part => {
      switch (part) {
        case 'italic':
          options.fontStyle = 'italic';
          break;
        case 'bold':
          options.fontWeight = 'bold';
          break;
        case 'underline':
          options.textDecoration = 'underline';
          break;
        default:
          break;
      }
    });
  }
  return vscode.window.createTextEditorDecorationType(options);
}

// Load styles from the current active theme
async function loadStyles() {
  await scopes.load();
  // Clear old styles
  for (const style of decorationCache.values()) {
    style.dispose();
  }
  decorationCache.clear();
}

// For some reason this crashes if we put it inside activate
const initParser = Parser.init(); // TODO this isn't a field, suppress package member coloring like Go

// Called when the extension is first activated by user opening a file with the appropriate language
export async function activateSyntaxColoring(context: vscode.ExtensionContext) {
	console.log("Activating tree-sitter...")
	// Parse of all visible documents
	const trees: {[uri: string]: Parser.Tree} = {}
	async function open(editor: vscode.TextEditor) {
		const language = languages[editor.document.languageId]
		if (language == null) return
		if (language.parser == null) {
			const absolute = path.join(context.extensionPath, 'parsers', language.module + '.wasm')
			const wasm = path.relative(process.cwd(), absolute)
			const lang = await Parser.Language.load(wasm)
			const parser = new Parser()
			parser.setLanguage(lang)
			language.parser = parser
		}
		const t = language.parser.parse(editor.document.getText()) // TODO don't use getText, use Parser.Input
		trees[editor.document.uri.toString()] = t
		colorUri(editor.document.uri)
	}
	// NOTE: if you make this an async function, it seems to cause edit anomalies
	function edit(edit: vscode.TextDocumentChangeEvent) {
		const language = languages[edit.document.languageId]
		if (language == null || language.parser == null) return
		updateTree(language.parser, edit)
		colorUri(edit.document.uri)
	}
	function updateTree(parser: Parser, edit: vscode.TextDocumentChangeEvent) {
		if (edit.contentChanges.length == 0) return
		const old = trees[edit.document.uri.toString()]
		for (const e of edit.contentChanges) {
			const startIndex = e.rangeOffset
			const oldEndIndex = e.rangeOffset + e.rangeLength
			const newEndIndex = e.rangeOffset + e.text.length
			const startPos = edit.document.positionAt(startIndex)
			const oldEndPos = edit.document.positionAt(oldEndIndex)
			const newEndPos = edit.document.positionAt(newEndIndex)
			const startPosition = asPoint(startPos)
			const oldEndPosition = asPoint(oldEndPos)
			const newEndPosition = asPoint(newEndPos)
			const delta = {startIndex, oldEndIndex, newEndIndex, startPosition, oldEndPosition, newEndPosition}
			old.edit(delta)
		}
		const t = parser.parse(edit.document.getText(), old) // TODO don't use getText, use Parser.Input
		trees[edit.document.uri.toString()] = t
	}
	function asPoint(pos: vscode.Position): Parser.Point {
		return {row: pos.line, column: pos.character}
	}
	function close(doc: vscode.TextDocument) {
		delete trees[doc.uri.toString()]
	}
	function colorUri(uri: vscode.Uri) {
		for (const editor of vscode.window.visibleTextEditors) {
			if (editor.document.uri == uri) {
				colorEditor(editor)
			}
		}
	}
  const warnedScopes = new Set<string>()
  const largeFileCharacterLength : Number = 50000
	function colorEditor(editor: vscode.TextEditor) {
    const isLargeFile : boolean = true //TODO: editor.document.getText().length >= largeFileCharacterLength
		const t = trees[editor.document.uri.toString()]
		if (t == null) return
		const language = languages[editor.document.languageId]
		if (language == null) return
		const scopes = language.color(t, visibleLines(editor), isLargeFile)
		for (const scope of scopes.keys()) {
			const dec = decoration(scope)
			if (dec) {
				const ranges = scopes.get(scope)!.map(range)
				editor.setDecorations(dec, ranges)
			} else if (!warnedScopes.has(scope)) {
				console.warn(scope, 'was not found in the current theme')
				warnedScopes.add(scope)
			}
		}
		for (const scope of decorationCache.keys()) {
			if (!scopes.has(scope)) {
				const dec = decorationCache.get(scope)!
				editor.setDecorations(dec, [])
			}
		}
	}
	async function colorAllOpen() {
		for (const editor of vscode.window.visibleTextEditors) {
			await open(editor)
		}
	}
	// Load active color theme
	async function onChangeConfiguration(event: vscode.ConfigurationChangeEvent) {
        let colorizationNeedsReload: boolean = event.affectsConfiguration("workbench.colorTheme")
			|| event.affectsConfiguration("editor.tokenColorCustomizations")
		if (colorizationNeedsReload) {
			await loadStyles()
			colorAllOpen()
		}
	}
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(onChangeConfiguration))
	context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors(colorAllOpen))
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(edit))
	context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(close))
	context.subscriptions.push(vscode.window.onDidChangeTextEditorVisibleRanges(change => colorEditor(change.textEditor)))
	// Don't wait for the initial color, it takes too long to inspect the themes and causes VSCode extension host to hang
	async function activateLazily() {
		await loadStyles()
		await initParser
		colorAllOpen()
	}
	activateLazily()
}

function visibleLines(editor: vscode.TextEditor) {
  return editor.visibleRanges.map(range => {
    const start = range.start.line;
    const end = range.end.line;
    return { start, end };
  });
}

function range(x: colors.Range): vscode.Range {
  return new vscode.Range(x.start.row, x.start.column, x.end.row, x.end.column);
}


/**************************************/


function addGraphvizCommand(context: vscode.ExtensionContext) {
  const {subscriptions} = context;
  const visualizePolicySpaceID = 'graphviz_visualizePolicySpace';
  const visualizeDecisionGraphID = 'graphviz_visualizeDecisionGraph';

  subscriptions.push(
    vscode.commands.registerCommand(visualizePolicySpaceID, () => {
      try{
      const graphvizController = new GraphvizController(vscode.workspace.rootPath);
      graphvizController.visualizePolicySpace();
      }catch(e){
        console.log(e)
      }
    })
  );

  subscriptions.push(
    vscode.commands.registerCommand(visualizeDecisionGraphID, () => {
      try{
      const graphvizController = new GraphvizController(vscode.workspace.rootPath);
      graphvizController.visualizeDecisionGraph();
      }catch(e){
        console.log(e)
      }
    })
  );

  let statusBarItemPS: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, -99999);
  statusBarItemPS.text = '$(graph) Visualization PS';
  statusBarItemPS.command = visualizePolicySpaceID;
  statusBarItemPS.show();
  subscriptions.push(statusBarItemPS);

  let statusBarItemDG: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, -99998);
  statusBarItemDG.text = '$(graph) Visualization DG';
  statusBarItemDG.command = visualizeDecisionGraphID;
  statusBarItemDG.show();
  subscriptions.push(statusBarItemDG);
}

// function graphvizInteractivePreview(context: vscode.ExtensionContext) {
//   let args = {
//     content: "C:\\Users\\Shira\\Desktop\\School\\project\\PolicyModelsPlugin\\client\\src\\Graphviz\\example\\test.svg",
//   }
//   vscode.commands.executeCommand("graphviz-interactive-preview.preview.beside", args);
// }

