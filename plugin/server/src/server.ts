/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { TextDocument, TextEdit } from 'vscode-languageserver-textdocument';

import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	CompletionItem,
	TextDocumentPositionParams,
	LocationLink,
	DeclarationParams,
	FoldingRangeParams,
	FoldingRange,
	ReferenceParams,
	Location,
	WorkspaceEdit,
	RenameParams,
	CompletionList,
	EOL, // send this to document controller - represents the end of line optins allowed
	InitializeResult,
	DidChangeWatchedFilesNotification,
	DidChangeWatchedFilesRegistrationOptions,
	WatchKind,
	TextDocumentSyncKind,
	TextDocumentRegistrationOptions,
	TextDocumentChangeEvent,
	DidOpenTextDocumentNotification,
	DidSaveTextDocumentNotification,
	DidChangeTextDocumentNotification,
	DidCloseTextDocumentNotification,
} from 'vscode-languageserver';

import * as child_process from "child_process";
import * as debugAnalyzer from './DebugAnalyzer';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

let clientSupportswatchedFiles: boolean = false;


connection.onInitialize((params: InitializeParams): InitializeResult => {
	// console.log(`on initialize parmas:\n ${JSON.stringify(params)}`);
	// connection.console.log(`on initialize parmas:\n ${JSON.stringify(params)}`);

	let capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we will fall back using global settings
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);
	



	// the didChangeWatchedFiles is used to notify the server when a new file was opned a file was delted or renamed
	clientSupportswatchedFiles = capabilities.workspace.didChangeWatchedFiles.dynamicRegistration; 


	return {
		capabilities: {
			//TODO : amsel add all capabilites		
			/*
				not supported:
				workspaceFolders,
				hoverProvider,
				signatureHelpProvider,
				typeDefinitionProvider,
				declarationProvider,
				codeLensProvider,
				experimental,
				codeActionProvide - this are some refactor options including: extract, inline, rewrite, organize imports,
				executeCommandProvider - this are commends connected to workspace folders we don't care about this, maybe will be need for localiztion,
				workspaceSymbolProvider - symbol serach feautre we don't support this,
				implementationProvider, - go to implementation - we support go to definiton as the sam I think
				colorProvider, - sets colors for user for now will be set to VS code defaults
				documentLinkProvider - a link to another file / URL 
				documentFormattingProvider - allows some basic formatting to the file like Lint
				documentRangeFormattingProvider - same as documentFormattingProvider but in a specifc range
				documentOnTypeFormattingProvider - same as documentFormattingProvider during typing
				selectionRangeProvider - when the user asks to select a scope aroung the current cursor / mouse position
			*/
			

			/* to check:
				documentHighlightProvider, - to check with others
				documentSymbolProvider, - WTF
			*/
			
			workspace:{
				workspaceFolders:{
					supported: false,
				}
			},

			textDocumentSync:
			{
				openClose:true,
				change:TextDocumentSyncKind.Full, // incremental only cause the client to send also _lineoffset therefore not need
			},

			completionProvider: {
				resolveProvider: true
			},
			definitionProvider: true,
			foldingRangeProvider: true,
			referencesProvider: true,
			renameProvider: true,
		},
		serverInfo:{
			name: 'Ps server to extened',
			version: '0.1'	
		}
	};
});

connection.onInitialized(() => {
	connection.onRequest("Run_Model", param => runModel(param));

	
	if (clientSupportswatchedFiles){
		let wtachedFilesOptions: DidChangeWatchedFilesRegistrationOptions = {
			watchers: [
				{
					kind: WatchKind.Create | WatchKind.Delete, // this will notiryf only when files are created or delted from workspace
					globPattern: "**/*.{ps,pspace}"
				} //TODO add support for DG and more supported file types
			]
		}
		connection.client.register(DidChangeWatchedFilesNotification.type,wtachedFilesOptions);
	}else{
		//TODO amsel what wolud happen if we don't support (we will need to check the filesystem all the time to see if file was created or delted)
		console.log("client doesn't support watched files - is this a problem??");
	}
	
	
	let textDocumentNotificationOptions: TextDocumentRegistrationOptions = {
		documentSelector: [
			{
				language:'policyspace',
				pattern:"**/*.{ps,pspace}"
			}, ////TODO add support for DG and more supported file types
		]
	};	

	//this options must be implemented by the client therfore we don't need to check for clinet support like other options
	connection.client.register(DidOpenTextDocumentNotification.type,textDocumentNotificationOptions);
	connection.client.register(DidSaveTextDocumentNotification.type,textDocumentNotificationOptions);
	connection.client.register(DidCloseTextDocumentNotification.type,textDocumentNotificationOptions);
	connection.client.register(DidChangeTextDocumentNotification.type,textDocumentNotificationOptions);
		

	//amse probalby not needed beacuse we don't care about configurations
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		//connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}

	//TODO amsel delete
	if (hasWorkspaceFolderCapability) {
		//pretty sure this is not needed - because we the server closes when we change folders
		// leaving it here for now just to be sure
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
			console.log(`getWorkspaceFolders params: \n${JSON.stringify(_event)}`);
			connection.console.log(`onDidChangeWorkspaceFolders params: \n${JSON.stringify(_event)}`);
		});

		//this in not needed - we support only one root folder
		// connection.workspace.getWorkspaceFolders().then(_event => {
		// 	connection.console.log('getWorkspaceFolders folder change event received.');
		// 	console.log(`getWorkspaceFolders params: \n${JSON.stringify(_event)}`);
		// 	connection.console.log(`getWorkspaceFolders params: \n${JSON.stringify(_event)}`);
		// });


		// //this is not needed - returns VS code configurations we don't care
		// connection.workspace.getConfiguration().then(_event => {
		// 	connection.console.log('Workspace folder change event received.');
		// 	console.log(`getConfiguration params: \n${JSON.stringify(_event)}`);
		// 	connection.console.log(`getConfiguration params: \n${JSON.stringify(_event)}`);
		// });

	}
});

connection.onExit(():void => {
	connection.dispose();
	process.exit(0);
});

connection.onCompletion(
	(params: TextDocumentPositionParams): CompletionList => {	
		return debugAnalyzer.solve(params,"onCompletion") as CompletionList;
	}
);

connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		return debugAnalyzer.solve(item,"onCompletionResolve") as CompletionItem;
	}
);

connection.onDefinition(
	(params: DeclarationParams) : LocationLink[] => {
		return debugAnalyzer.solve(params,"onDefinition") as LocationLink[];
	}
);

connection.onFoldingRanges(
	(params: FoldingRangeParams) : FoldingRange[] => {
		return debugAnalyzer.solve(params,"onFoldingRanges") as FoldingRange[];
	}
);

connection.onReferences(
	(params: ReferenceParams): Location[] => {
		return debugAnalyzer.solve(params,"onReferences") as Location[];
	}
);

connection.onRenameRequest(
	(params: RenameParams): WorkspaceEdit =>{
		return debugAnalyzer.solve(params,"onRenameRequest") as WorkspaceEdit;
	}
)






// every change to file that matches pattern above will be notifed here
connection.onDidChangeWatchedFiles(_change => {
	console.log(`onDidChangeWatchedFiles\n${JSON.stringify(_change)}`);
	connection.console.log(`onDidChangeWatchedFiles\n${JSON.stringify(_change)}`);
});


// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	//validateTextDocument(change.document);
	console.log(`onDidChangeContent\n${JSON.stringify(change)}`);
	connection.console.log(`onDidChangeContent\n${JSON.stringify(change)}`);

});

// this is called when the user open a documnet (new one or already existing) - we can't tell if it is a new one or existing
// in order to control if it is a new on we need onDidChangeWatchedFiles
documents.onDidOpen(
	(params: TextDocumentChangeEvent<TextDocument>): void => {
		console.log(`onDidOpen \n ${JSON.stringify(params)}`);
		connection.console.log(`onDidOpen \n ${JSON.stringify(params)}`);
	});

// this is called when the user closes the document tab (can't tell if also the file was deleted for this we need the watched)
documents.onDidClose(
	(params: TextDocumentChangeEvent<TextDocument>): void => {
		console.log(`onDidClose \n ${JSON.stringify(params)}`);
		connection.console.log(`onDidClose \n ${JSON.stringify(params)}`);
	});

//this is called when the usere saves the document
documents.onDidSave(
	(params: TextDocumentChangeEvent<TextDocument>): void => {
		console.log(`onDidSave \n ${JSON.stringify(params)}`);
		connection.console.log(`onDidSave \n ${JSON.stringify(params)}`);
	});



/*
this funcations aren't really called in current configuration -NO IDEA why but we have supplemnts aboce

connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.textDocument.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.textDocument.text the initial full content of the document.
	console.log(`onDidOpenTextDocument\n${params.textDocument.uri} opened.`);
	connection.console.log(`onDidOpenTextDocument\n${params.textDocument.uri} opened.`);
});

connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.textDocument.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	console.log(`onDidChangeTextDocument\n${params.textDocument.uri} opened.`);
	connection.console.log(`onDidChangeTextDocument\n${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});

connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.textDocument.uri uniquely identifies the document.
	console.log(`onDidCloseTextDocument\n${params.textDocument.uri} opened.`);
	connection.console.log(`onDidCloseTextDocument\n${params.textDocument.uri} closed.`);
});*/


// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();


function runModel(param : string[]) : string {
	console.log("server is running the model")
	let cwd = __dirname + "/../../";
	child_process.execSync(`start cmd.exe /K java -jar "${cwd}/cli/DataTagsLib.jar"`);
	return "execute ends";
}






























// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ExampleSettings>(
			(change.settings.PolicyModelsServer || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'PolicyModelsServer'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	// In this simple example we get the settings for every validate run.
	let settings = await getDocumentSettings(textDocument.uri);

	// The validator creates diagnostics for all uppercase words length 2 and more
	let text = textDocument.getText();
	let pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;

	let problems = 0;
	let diagnostics: Diagnostic[] = [];
	while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
		problems++;
		let diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			},
			message: `${m[0]} is all uppercase.`,
			source: 'ex'
		};
		if (hasDiagnosticRelatedInformationCapability) {
			diagnostic.relatedInformation = [
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Spelling matters'
				},
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Particularly for names'
				}
			];
		}
		diagnostics.push(diagnostic);
	}

	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}






