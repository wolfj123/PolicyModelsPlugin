/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
	createConnection,
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
	InitializeResult,
	DidChangeWatchedFilesNotification,
	DidChangeWatchedFilesRegistrationOptions,
	WatchKind,
	TextDocumentSyncKind,
	DidOpenTextDocumentNotification,
	DidSaveTextDocumentNotification,
	DidChangeTextDocumentNotification,
	DidCloseTextDocumentNotification,
	DidChangeConfigurationNotification,
	TextDocumentChangeRegistrationOptions,
	PrepareRenameParams,
	DidChangeWatchedFilesParams,
	FileEvent,
	FileChangeType,
	DocumentUri,
} from 'vscode-languageserver';

import * as child_process from "child_process";
import * as path from 'path';
import {SolverInt, PMSolver} from './Solver';
import {initLogger, logSources,Logger, getLogger} from './Logger';
import { URI } from 'vscode-uri';
import {getOsType, osTypes} from './Utils';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);
let folderFS: string = undefined;

// Make the text document manager listen on the connection
// for open, change and close text document events
//documents.listen(connection);

// Listen on the connection
connection.listen();

let solver: SolverInt;

// -------------- Initialize And Capabilites ----------------------
let clientSupportswatchedFiles: boolean = false;

// probably can be deleted
let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;



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
				textDocumentSync:
				{
			 		openClose:true,
			 		change:TextDocumentSyncKind.Full
				},

				to check:
				documentHighlightProvider, - to check with others
				documentSymbolProvider, - WTF
			*/

			workspace:{
				workspaceFolders:{
					supported: false,
				}
			},

			completionProvider: {
				resolveProvider: true
			},

			definitionProvider: true,
			//foldingRangeProvider: true,
			referencesProvider: true,
			renameProvider: {
				prepareProvider: true
			},
		},
		serverInfo:{
			name: 'Ps server to extened',
			version: '0.1'
		}
	};
});


connection.onInitialized(() => {
	connection.onRequest("Run_Model", param => runModel(param));
	connection.onRequest("setPluginDir", async (dir:string) => {
		initLogger(dir);
		
		solver = new PMSolver(dir,(uri: DocumentUri, diagnostics: Diagnostic[], docVersion?: number)=>{
			if (! hasDiagnosticRelatedInformationCapability){
				return;
			}
			console.log(`\ndiagnostics ans- ${uri} , \n ${diagnostics}\n\n`);
			if (docVersion !== undefined){
				connection.sendDiagnostics({
					uri: uri,
					version: docVersion,
					diagnostics: diagnostics
				})
			}else{
				connection.sendDiagnostics({
					uri: uri,
					diagnostics: diagnostics
				});
			}
		});


		// await solver.initParser(dir);
		console.log("finish init from client");
		return null;
	})

	if (clientSupportswatchedFiles){
		let watchedFilesOptions: DidChangeWatchedFilesRegistrationOptions = {
			watchers: [
				{
					kind: WatchKind.Create | WatchKind.Delete, // this will notiryf only when files are created or delted from workspace
					globPattern: "**/*{.ps,.pspace,definitions.ts}"
				},
				{
					kind: WatchKind.Create | WatchKind.Delete,
					globPattern:"**/*.{dg}"
				},
				{
					kind: WatchKind.Create | WatchKind.Delete,
					globPattern:"**/*.{vi}"
				}
			]
		}
		connection.client.register(DidChangeWatchedFilesNotification.type,watchedFilesOptions);
	}else{
		//TODO amsel what wolud happen if we don't support (we will need to check the filesystem all the time to see if file was created or delted)
		console.log("client doesn't support watched files - is this a problem??");
	}

	let textDocumnetNotificationOptions: TextDocumentChangeRegistrationOptions = {
		syncKind: TextDocumentSyncKind.Incremental,
		documentSelector:
		[
			{
				language:'policyspace',
				pattern:"**/*{.ps,.pspace,definitions.ts}"
			},
			{
				language:'decisiongraph',
				pattern:"**/*.{dg}"
			},
			{
				language:'valueinference',
				pattern:"**/*.{vi}"
			}
		]
	};

	//this options must be implemented by the client therfore we don't need to check for clinet support like other options
	connection.client.register(DidOpenTextDocumentNotification.type,textDocumnetNotificationOptions);
	connection.client.register(DidSaveTextDocumentNotification.type,textDocumnetNotificationOptions);
	connection.client.register(DidCloseTextDocumentNotification.type,textDocumnetNotificationOptions);
	connection.client.register(DidChangeTextDocumentNotification.type,textDocumnetNotificationOptions);

	//amsel probalby not needed beacuse we don't care about configurations
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}

	//TODO amsel delete
	if (hasWorkspaceFolderCapability) {
		//pretty sure this is not needed - because we the server closes when we change folders
		// leaving it here for now just to be sure
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
			console.log(`getWorkspaceFolders params: \n${JSON.stringify(_event)}`);

			//connection.console.log(`onDidChangeWorkspaceFolders params: \n${JSON.stringify(_event)}`);
		});

		// this function must be declared here or else an error will occur
		// we need this in order to get the folder that is currently open.
		connection.workspace.getWorkspaceFolders().then(async _event => {
			connection.console.log('getWorkspaceFolders folder change event received.');
			if (_event === null || _event === undefined) {
				await solver.onOpenFolder(null);
				folderFS = undefined;
				console.log(`finished wiating for open folder`);
			}else{
				await solver.onOpenFolder(_event[0].uri);
				folderFS = URI.parse(_event[0].uri).fsPath;
				console.log(`finished wiating for open folder`);
			}
		});

	}
	console.log('finish on intilized')
});



//------------- User Requests ------------------------------

connection.onExit(():void => {
	connection.dispose();
});

connection.onCompletion(
(params: TextDocumentPositionParams): CompletionList => {
	getLogger(logSources.serverHttp).http(`onCompletion`, params);
	return solver.onCompletion(params);
});

connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		getLogger(logSources.serverHttp).http(`onCompletionResolve`,item);
		return solver.onCompletionResolve(item);
});

connection.onDefinition(
	(params: DeclarationParams): LocationLink[] => {
		getLogger(logSources.serverHttp).http(`onDefinition`,params);
		return solver.onDefinition(params);
});

connection.onFoldingRanges(
	(params: FoldingRangeParams): FoldingRange[] => {
		getLogger(logSources.serverHttp).http(`onFoldingRanges`,params);
		return solver.onFoldingRanges(params);
});

connection.onReferences(
	(params: ReferenceParams): Location[] => {
		getLogger(logSources.serverHttp).http(`onReferences`,params);
		return solver.onReferences(params);
});

connection.onPrepareRename (
	//this reutnrs the range of the word if can be renamed and null if it can't
	(params:PrepareRenameParams) =>  {
		getLogger(logSources.serverHttp).http(`onPrepareRename`,params);
		return solver.onPrepareRename(params);
});

connection.onRenameRequest(
	(params: RenameParams): WorkspaceEdit => {
		getLogger(logSources.serverHttp).http(`onRenameRequest`,params);
		return solver.onRenameRequest(params);
});

function runModel(param: string[]): string {
	getLogger(logSources.serverHttp).http(`runModel`, param);
	console.log("server is running the model")
	let cliJar: string = path.join(__dirname, "/../../cli/PolicyModels-1.9.9.uber.jar");
	const runPolicyModelCommand = folderFS? `java -jar "${cliJar}" "${folderFS}"` : `java -jar "${cliJar}"`;
	let fullCommand;
	const os = getOsType();
	switch (os) {
		case osTypes.WINDOWS:
			fullCommand = `start cmd.exe /K ${runPolicyModelCommand}`;
			break;
		case osTypes.MAC:
			fullCommand =`cd ${__dirname}/../../cli ;echo ${runPolicyModelCommand} > run.command; chmod +x run.command;open run.command`;
			break;
		default:
			return "Running the model works ONLY from Windows or Mac Operation System."

	}
	child_process.exec(fullCommand);
	return "Model is running";
}


// --------------------- File Updates  -----------------------------



connection.onDidChangeWatchedFiles( (_change: DidChangeWatchedFilesParams) => {
	getLogger(logSources.serverHttp).http(`onDidChangeWatchedFiles`,_change);
	_change.changes.forEach( (currChange: FileEvent) => {
		switch(currChange.type){
			case FileChangeType.Created:
				solver.onCreatedNewFile(currChange.uri);
				break;
			case FileChangeType.Deleted:
				solver.onDeleteFile(currChange.uri);
				break;
		}
	});
	console.log(`onDidChangeWatchedFiles\n${JSON.stringify(_change)}`);
});

connection.onDidChangeTextDocument(event => {
	getLogger(logSources.serverHttp).http(`onDidChangeTextDocument`,event);
	console.log("onDidChangeTextDocument")
	solver.onDidChangeTextDocument(event);
});

connection.onDidCloseTextDocument(event => {
	getLogger(logSources.serverHttp).http(`onDidCloseTextDocument`,event);
	console.log(`onDidCloseTextDocument`);
	solver.onDidCloseTextDocument(event.textDocument);

});

connection.onDidOpenTextDocument(event => {
	getLogger(logSources.serverHttp).http(`onDidOpenTextDocument`,event);
	console.log(`onDidOpenTextDocument`);
	solver.onDidOpenTextDocument(event.textDocument);
});




//------------------------------ UNKOWNN CODE   ----------------------------------------------
/*
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
	documents.all().forEach(element => {
		validateTextDocument(element.textDocument);
	});//    forEach(validateTextDocument);
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
*/

