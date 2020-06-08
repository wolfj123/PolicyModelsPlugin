/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
	createConnection,
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
	Diagnostic
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

	let capabilities = params.capabilities;

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

	connection.onRequest("setPluginDir", async (dir:string, shouldLog: boolean) => {
		initLogger(dir,shouldLog);
		
		solver = new PMSolver(dir,(uri: DocumentUri, diagnostics: Diagnostic[], docVersion?: number)=>{
			if (! hasDiagnosticRelatedInformationCapability){
				return;
			}
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
		
		//TODO notify LSP won't work
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

	
	if (hasWorkspaceFolderCapability) {
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
	//this reutnrs the range of the word if it can be renamed and null if it can'
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

