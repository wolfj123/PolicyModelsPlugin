import {
	CompletionItem,
	CompletionList,
	LocationLink,
	WorkspaceEdit,
	ReferenceParams,
	DeclarationParams,
	RenameParams,
	FoldingRange,
	FoldingRangeParams,
	TextDocumentPositionParams,
	PrepareRenameParams,
	Location,
	TextDocumentItem,
	TextDocumentIdentifier,
	DidChangeTextDocumentParams,
	DocumentUri,
	Range,
	TextEdit,
	Position,
	TextDocumentEdit,
	VersionedTextDocumentIdentifier,
	Diagnostic
} from 'vscode-languageserver';

import { TextDocumentManager, documentManagerResultTypes, TextDocumentManagerInt, DocumentManagerResult } from './DocumentManager';
import { LanguageServicesFacade, SyntaxError } from './LanguageServices';
import { logSources, getLogger } from './Logger';
import * as Path from 'path';
import { URI } from 'vscode-uri';
import { isNullOrUndefined } from 'util';
import { version } from 'punycode';

export interface SolverInt {

	//----------------------------  user/client event handlers
	/**
	 * @param params TextDocumentPositionParams as receievd from VS-Code
	 * @returns possible completion items list for specified word and location in cide
	 */
	onCompletion(params: TextDocumentPositionParams): CompletionList;
	/**
	 * Generates additional information on item to show to user when looking at completion suggestions
	 * 
	 * @param params CompletionItem as receievd from VS-Code
	 * @returns the item received with additonal data
	 */
	onCompletionResolve(params: CompletionItem): CompletionItem;

	/**
	 * finds the definition places of current word.
	 * more than 1 location is possible if user has an error in his code and defiened 2 objects with the same name in same file
	 * 
	 * @param params DeclarationParams as receievd from VS-Code
	 * @returns LocationLink array of all possible definitions for word
	 */
	onDefinition(params:DeclarationParams): LocationLink [];

	/**
	 * @param params PrepareRenameParams as receievd from VS-Code
	 * @returns null if word can't be renamed, otherwise full range of word to be renamed 
	 */
	onPrepareRename(params:PrepareRenameParams):  Range ;
	/**
	 * finds all places to rename and convert them to WorkspaceEdit result.
	 * file version is ignored because VS-Code isn't using it and after this result is sent to client
	 * the client sends onDidChangeTextDocument event for all changes from this functions result
	 * 
	 * @param params RenameParams as receievd from VS-Code
	 * @returns workspace edits that should be done due to rename, using WorkspaceEdit documentChanges and not changes
	 */
	onRenameRequest(params:RenameParams): WorkspaceEdit;

	/**
	 * @param params ReferenceParams as receievd from VS-Code
	 * @returns Location array of all refrences to requested word
	 */
	onReferences(params: ReferenceParams): Location[];

	/**
	 * @param params FoldingRangeParams as receievd from VS-Code
	 * @returns array of FoldingRange
	 */
	onFoldingRanges(params: FoldingRangeParams): FoldingRange[];


	//----------------------------   document control envents handlers

	/**
	 * updates document state to open and updates LanguageServicesFacade if necessary
	 * 
	 * @param opendDocParam TextDocumentItem as receievd from VS-Code
	 */
	onDidOpenTextDocument (opendDocParam: TextDocumentItem): Promise<void>;

	/**
	 * updates document state to closed and updates LanguageServicesFacade if necessary
	 * 
	 * @param closedDcoumentParams TextDocumentIdentifier as receievd from VS-Code
	 */
	onDidCloseTextDocument (closedDcoumentParams: TextDocumentIdentifier);

	/**
	 * updates document changes and notifies LanguageServicesFacade
	 * 
	 * @param params DidChangeTextDocumentParams as receievd from VS-Code
	 */
	onDidChangeTextDocument (params: DidChangeTextDocumentParams);

	/**
	 * deltes document from memory and notifies LanguageServicesFacade
	 * 
	 * @param deletedFile DocumentUri as receievd from VS-Code
	 */
	onDeleteFile (deletedFile:DocumentUri);

	/**
	 * creates new document in memory and notifies LanguageServicesFacade
	 * 
	 * @param newFileUri DocumentUri as receievd from VS-Code
	 */
	onCreatedNewFile (newFileUri:DocumentUri);

	/**
	 * updates manager about folder opening and notifies LanguageServicesFacade about documents collected by manager
	 * 
	 * @param pathUri URI representing the folder opened in client or null if no folder is opened and only a file was opened
	 */
	onOpenFolder (pathUri: DocumentUri | null);
}


export class PMSolver implements SolverInt{

	private _documentManagerForFolder: TextDocumentManagerInt;
	private _documentManagerSingleFiles: TextDocumentManagerInt; // handles all document managin for single files outside of folder
	private _pluginFSPath: string;
	private _workspaceFolderFSPath: string;
	private _facdeForFolder: LanguageServicesFacade;
	private _facdeForFilesFS: {[id: string]: LanguageServicesFacade};  // id is fodler FS path
	private _sovlerReady: boolean;
	private _publishDiagnosticsCallback: (uri: DocumentUri, diagnostics: Diagnostic[], docVersion?: number) => void;

	constructor(pluginDir: string, diagnosticsCallback: (uri: DocumentUri, diagnostics: Diagnostic[], docVersion?: number) => void){
		this._documentManagerForFolder = new TextDocumentManager();
		this._documentManagerSingleFiles = new TextDocumentManager(); 
		this._documentManagerSingleFiles.openedFolder(null);
		this._workspaceFolderFSPath = undefined;
		this._pluginFSPath = pluginDir;
		this._facdeForFilesFS = {};
		this._facdeForFolder = undefined;
		this._sovlerReady = false;
		this._publishDiagnosticsCallback = diagnosticsCallback;
	}

	public creatediagnosticsCallback() : (uri: DocumentUri, errors: SyntaxError []) => void {
		let pmsolverRef : PMSolver = this
		const callback = (uri: DocumentUri, errors: SyntaxError []) => {
			let diagnostics: Diagnostic [] = []
			if (errors !== null && errors !== undefined){
				errors.forEach(currError =>{
					diagnostics.push({
						message: currError.message,
						source: currError.message,
						range: currError.location.range
					});
				});
			}

			let docVersion: number = pmsolverRef.getDocManager(uri).getDocument(uri).version;
	
			pmsolverRef._publishDiagnosticsCallback(uri,diagnostics,docVersion);
		}
			
		return callback
	}

	//#region private functions
	/**
	 * 
	 * @param fileUri 
	 * @returns true if the file belongs to the workspace folder in the client
	 */
	private isFolderRelevant (fileUri: DocumentUri): boolean{
		let folderFSPath: string = this.getFSFolderFromUri(fileUri);
		return folderFSPath === this._workspaceFolderFSPath;
	}

	private clearDiagnostics(uri: DocumentUri){
		this._publishDiagnosticsCallback(uri,[]);
	}
	
	private getFSFolderFromUri(uri: DocumentUri): string{
		let fileFSPath: string = URI.parse(uri).fsPath;
		return Path.dirname(fileFSPath);
	}

	/**
	 * 
	 * @param uri 
	 * @returns relevant DocumentManager according to URI
	 */
	private getDocManager(uri: DocumentUri): TextDocumentManagerInt{
		if (this.isFolderRelevant(uri)){
			return this._documentManagerForFolder;
		}else{
			return this._documentManagerSingleFiles;
		}
	}

	/**
	 * initializes new parsers if needed,
	 * this function assumes workspace folder facades is created only once, if the function is called more than once with null parameter
	 * the old workspace folder facade is overwritten
	 * 
	 * @param fileUri file Uri for new facade or null if createin facade for workspace folder
	 */
	private async initParser(fileUri: DocumentUri | null): Promise<void> {
		let shouldOpenNewFacade: boolean = true
		let fileDir: string = this.getFSFolderFromUri(fileUri);
		if (fileUri !== null){ 
			shouldOpenNewFacade = isNullOrUndefined(this._facdeForFilesFS[fileDir]);
		}
		if (! shouldOpenNewFacade){
			return;
		}

		// initialize facade and set class variables
		await LanguageServicesFacade.init([], this._pluginFSPath,this.creatediagnosticsCallback())
		.then(facadeAns => {
			getLogger(logSources.server).info(`generated new LanguageServicesFacade for file ${fileUri}`)
			if (fileUri === null){
				this._facdeForFolder = facadeAns;
			}else{
				this._facdeForFilesFS[fileDir] = facadeAns;
			}
		})
		.catch(rej => {
			getLogger(logSources.server).error('reject form LanguageServicesFacade init', rej);
		});
	}

	/**
	 * all calls to facades from document event handlers should be done from this fucntion.
	 * it wrappes the facade call to prevent error and create new facades if necessary
	 * for document events we can't assume any order on events (THANKS ALOT VS-Code), so before calling the facade
	 * we must check for its existence and if it doens't exist we create a new one before continuing 
	 * 
	 * @param params parameters for facade request
	 * @param funcName facade function to be activated
	 * @param uri uri of the file the request was made on
	 */
	private async facdeCallWrapperForDocumentEvents (params: any, funcName: string, uri: DocumentUri | null): Promise<void> {
		if (! this._sovlerReady){
			return new Promise(resolve =>
				setTimeout(() => resolve(this.facdeCallWrapperForDocumentEvents(params,funcName,uri)) , 100)
			);
		}
		
		let uriFolder: string = this.getFSFolderFromUri(uri);
		let isFolderRelevant = this.isFolderRelevant(uri);
		let facade: LanguageServicesFacade = isFolderRelevant ? this._facdeForFolder : this._facdeForFilesFS[uriFolder];
		
		if (facade === undefined || facade === null){
			await this.initParser(uri).then (_ =>{
				facade = isFolderRelevant ? this._facdeForFolder : this._facdeForFilesFS[uriFolder]
				facade[funcName](params);
			});
		}else {
			facade[funcName](params);
		}
	}

	
	/**
	 * All request to facades that are relevant to client events should be made through herer
	 * this is a wrapper for the facade to prevent errors of using undefined facades
	 * we assume that facades are always initalized for every file before a user request is made with one excetption for folding range,
	 * this function is a safety messure in case the above assumption is wrong
	 * 
	 * @param params parameters for facade request
	 * @param uri uri of the file the request was made on
	 * @param funcName facade function to be activated if facade exists
	 * @returns null if facade doesn't exists, otherwise the relevant LanguageServicesFacade response
	 */
	private facadeCallWrapperForUserEvents(params: any, uri: DocumentUri, funcName: string): any {
		let facade: LanguageServicesFacade;
		if (this.isFolderRelevant(uri)){
			facade = this._facdeForFolder;
		}else{
			facade = this._facdeForFilesFS[this.getFSFolderFromUri(uri)];
		}
		if (facade === undefined || facade == null){
			getLogger(logSources.server).error(`trying to activate non existing facade for file ${uri} with function ${funcName}`, params);
			return null;
		}

		return facade[funcName](params);
	}

	//#endregion private functions

	//#region
	//----------------------------  user/client event handlers --------------------------------------

	onCompletion(params: TextDocumentPositionParams): CompletionList {
		let ans = this.facadeCallWrapperForUserEvents(params, params.textDocument.uri, "onCompletion");
		return ans;
	}

	onCompletionResolve(params: CompletionItem): CompletionItem {
		//throw new Error('Method not implemented.');
		return null;
	}

	onDefinition(params: DeclarationParams): LocationLink[] {
		return this.facadeCallWrapperForUserEvents(params, params.textDocument.uri,"onDefinition");
	}

	onPrepareRename(params: PrepareRenameParams): Range | null {
		return this.facadeCallWrapperForUserEvents(params, params.textDocument.uri,"onPrepareRename");
	}

	onRenameRequest(params: RenameParams): WorkspaceEdit {
		let locationsToRename: Location[] = this.facadeCallWrapperForUserEvents(params, params.textDocument.uri,"onRenameRequest");
		if (locationsToRename === null){
			return null;
		}

		let newName: string = params.newName;
		let uniqeFiles: DocumentUri [] = [... new Set(locationsToRename.map(currLocation => currLocation.uri))];
		let allFilesEdits:TextDocumentEdit [] = [];

		uniqeFiles.forEach(currFile => {
			let curFileLocationsToEdit: Location [] = locationsToRename.filter(currLocation => currLocation.uri === currFile);
			let currFileEdits:TextEdit [] = curFileLocationsToEdit.map(currChangeLocation =>{
				return TextEdit.replace(currChangeLocation.range,newName);
			});

			if (currFileEdits !== undefined && currFileEdits.length !== 0){
				let textDocToChange: VersionedTextDocumentIdentifier = {
					uri: currFile,
					version: null
				} 
				allFilesEdits.push({
					edits:currFileEdits,
					textDocument: textDocToChange
				});
			}
		})

		return {documentChanges:allFilesEdits};
	}

	onReferences(params: ReferenceParams): Location [] {
		return this.facadeCallWrapperForUserEvents(params, params.textDocument.uri,"onReferences");
	}
	
	onFoldingRanges(params: FoldingRangeParams): FoldingRange [] {
		let foldingLocations: Location [] =  this.facadeCallWrapperForUserEvents(params, params.textDocument.uri,"onFoldingRanges");

		if (foldingLocations === null || foldingLocations === undefined || foldingLocations.length === 0){
			return [];
		}

		let foldingRanges: FoldingRange[] = foldingLocations.map (currLocation => 
			FoldingRange.create(currLocation.range.start.line,currLocation.range.end.line,
				currLocation.range.start.character,currLocation.range.end.character)
		);
		return foldingRanges;
	}

	//#endregion

	//#region 
	//----------------------------   document control envents handlers --------------------------------------------

	public async onDidOpenTextDocument(opendDocParam: TextDocumentItem): Promise<void> {
		if (! this._sovlerReady){
			return new Promise(resolve =>
				setTimeout(() => resolve(this.onDidOpenTextDocument(opendDocParam)) , 150)
			);
		}

		let docManager: TextDocumentManagerInt = this.getDocManager(opendDocParam.uri);
		let openDocumentsResults : DocumentManagerResult [] = await docManager.openedDocumentInClient(opendDocParam)
		.catch(rej => getLogger(logSources.server).error(`onDidOpenTextDocument was rejected`,{rej}));
		
		for (let i =0; i < openDocumentsResults.length; i++){
			let currChange: DocumentManagerResult = openDocumentsResults[i];
			switch(currChange.type){
				case documentManagerResultTypes.noChange:
					break;
				case documentManagerResultTypes.newFile:
					await this.facdeCallWrapperForDocumentEvents([currChange.result],"addDocs",opendDocParam.uri)
					break;
				case documentManagerResultTypes.removeFile:
					this.facdeCallWrapperForDocumentEvents(currChange.result,"removeDoc",opendDocParam.uri)
					this.clearDiagnostics(currChange.result);
					break;
				default:
					getLogger(logSources.server).error('onDidOpenTextDocument wrong change type',currChange);
					break;
			}
		}
	}

	public async onDidCloseTextDocument(closedDcoumentParams: TextDocumentIdentifier) {
		if (! this._sovlerReady){
			return new Promise(resolve =>
				setTimeout(() => resolve(this.onDidCloseTextDocument(closedDcoumentParams)) , 150)
			);
		}

		let docManager: TextDocumentManagerInt = this.getDocManager(closedDcoumentParams.uri);
		await docManager.closedDocumentInClient(closedDcoumentParams)
		.then(async change=>{
			switch(change.type){
				case documentManagerResultTypes.removeFile:
					await this.facdeCallWrapperForDocumentEvents(change.result,"removeDoc",closedDcoumentParams.uri);
					this.clearDiagnostics(change.result);
					break;
				default:
					getLogger(logSources.server).error('onDidCloseTextDocument wrong change type',change);
					break;
			}
		})
		.catch(rej => getLogger(logSources.server).error(`onDidCloseTextDocument was rejected `, rej));
	}

	public async onDidChangeTextDocument(params: DidChangeTextDocumentParams) {
		if (! this._sovlerReady){
			return new Promise(resolve =>
				setTimeout(() => resolve(this.onDidChangeTextDocument(params)) , 150)
			);
		}

		let docManager: TextDocumentManagerInt = this.getDocManager(params.textDocument.uri);
		await docManager.changeTextDocument(params)
		.then(change =>{
			switch(change.type){
				case documentManagerResultTypes.updateFile:
					let docUri: DocumentUri = params.textDocument.uri;
					this.facdeCallWrapperForDocumentEvents(docManager.getDocument(docUri),"updateDoc",docUri);
					//this._languageFacade.updateDoc(this._documentManager.getDocument(params.textDocument.uri));
					break;
				case documentManagerResultTypes.noChange:
					break;
				default:
					getLogger(logSources.server).error('onDidChangeTextDocument wrong change type',change);
					break;
			}
		})
		.catch(rej => getLogger(logSources.server).error(`onDeleteFile was rejected `,rej));
	}

	public async onDeleteFile(deletedFileUri: DocumentUri): Promise<void> {
		if (! this._sovlerReady){
			return new Promise(resolve =>
				setTimeout(() => resolve(this.onDeleteFile(deletedFileUri)) , 150)
			);
		}

		let docManager: TextDocumentManagerInt = this.getDocManager(deletedFileUri);
		await docManager.deletedDocument(deletedFileUri)
		.then(change =>{
			switch(change.type){
				case documentManagerResultTypes.removeFile:
					this.facdeCallWrapperForDocumentEvents(change.result,"removeDoc",deletedFileUri)
					this.clearDiagnostics(change.result);
				default:
					getLogger(logSources.server).error('onDeleteFile wrong change type',change);
					break;
			}
		})
		.catch(rej => getLogger(logSources.server).error(`onDeleteFile was rejected `, rej));
	}

	public async onCreatedNewFile(newFileUri: DocumentUri): Promise<void> {
		if (! this._sovlerReady){
			return new Promise(resolve =>
				setTimeout(() => resolve(this.onCreatedNewFile(newFileUri)) , 150)
			);
		}

		let docManager: TextDocumentManagerInt = this.getDocManager(newFileUri);
		await docManager.clientCreatedNewFile(newFileUri)
		.then(change => {
			switch(change.type){
				case documentManagerResultTypes.newFile:
					this.facdeCallWrapperForDocumentEvents([change.result],"addDocs",newFileUri);
					// this._languageFacade.addDocs([change.result]);
				default:
					getLogger(logSources.server).error('onCreatedNewFile wrong change type',change);
					break;
			}
		})
		.catch(rej =>getLogger(logSources.server).error(`onCreatedNewFile was rejected`, rej));
	}

	public async onOpenFolder(pathUri: string | null) {
		console.log(`open folder - ${pathUri}`);
		let folderFSPath: string = URI.parse(pathUri).fsPath;
		this._workspaceFolderFSPath = folderFSPath;
		this._documentManagerForFolder.openedFolder(pathUri);
		await this.initParser(null);
		this._facdeForFolder.addDocs(this._documentManagerForFolder.allDocumnets);
		this._sovlerReady = true;
	}
	//#endregion
}