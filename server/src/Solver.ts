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
	VersionedTextDocumentIdentifier
} from 'vscode-languageserver';

import { TextDocumentManager, documentManagerResultTypes, TextDocumentManagerInt } from './DocumentManager';
import { LanguageServicesFacade } from './LanguageServices';
import { logSources, getLogger } from './Logger';

export interface SolverInt {

	//// user request functions
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


	//// document control functions

	/**
	 * updates document state to open and updates LanguageServicesFacade if necessary
	 * 
	 * @param opendDocParam TextDocumentItem as receievd from VS-Code
	 */
	onDidOpenTextDocument (opendDocParam: TextDocumentItem);

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
	 * @param pathUri URI representing the folder opened in client of null if no folder is opened and only a file was opened
	 */
	onOpenFolder (pathUri: string | null);

	/**
	 * initializes parsers of LanguageServicesFacade
	 * 
	 * @param pluginDir FS path of the plugin directory
	 */
	initParser (pluginDir:string);

	/**
	 * represnets of the parsers initialization is completed
	 */
	facadeIsReady: boolean;
}


export class PMSolver implements SolverInt{

	private _documentManager: TextDocumentManagerInt;
	private _languageFacade: LanguageServicesFacade;

	constructor(){
		this._documentManager = new TextDocumentManager;
		this._languageFacade = undefined;
	}

	public get facadeIsReady(){
		return this._languageFacade !== undefined;
	}
	
	onCompletion(params: TextDocumentPositionParams): CompletionList {
		//throw new Error('Method not implemented.');
		return this._languageFacade.onCompletion(params);
	}

	onCompletionResolve(params: CompletionItem): CompletionItem {
		//throw new Error('Method not implemented.');
		return null; //TODO
	}

	onDefinition(params: DeclarationParams): LocationLink[] {
		let ans:LocationLink[]= this._languageFacade.onDefinition(params);
		return ans;
	}

	onPrepareRename(params: PrepareRenameParams): Range | null {
		return this._languageFacade.onPrepareRename(params);
	}

	onRenameRequest(params: RenameParams): WorkspaceEdit {
		let locationsToRename: Location[] = this._languageFacade.onRenameRequest(params);
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
		return this._languageFacade.onReferences(params);
	}
	
	onFoldingRanges(params: FoldingRangeParams): FoldingRange [] {	
		if (!this.facadeIsReady){
			return null;
		}
		let foldingLocations: Location [] = this._languageFacade.onFoldingRanges(params);

		if (foldingLocations === null || foldingLocations === undefined){
			return [];
		}

		let foldingRanges: FoldingRange[] = foldingLocations.map (currLocation => 
			FoldingRange.create(currLocation.range.start.line,currLocation.range.end.line,
				currLocation.range.start.character,currLocation.range.end.character)
		);
		return foldingRanges;
	}




	async onDidOpenTextDocument(opendDocParam: TextDocumentItem) {
		await this._documentManager.openedDocumentInClient(opendDocParam)
		.then(changeResults=> {
			changeResults.forEach(currChange => {
				switch(currChange.type){
					case documentManagerResultTypes.noChange:
						break;
					case documentManagerResultTypes.newFile:
						this._languageFacade.addDocs([currChange.result]);
						break;
					case documentManagerResultTypes.removeFile:
						this._languageFacade.removeDoc(currChange.result)
						break;
					default:
						getLogger(logSources.server).error('onDidOpenTextDocument wrong change type',currChange);
						break;
				}
			});
		})
		.catch(rej => getLogger(logSources.server).error(`onDidOpenTextDocument was rejected`,{rej}));
	}

	async onDidCloseTextDocument(closedDcoumentParams: TextDocumentIdentifier) {
		await this._documentManager.closedDocumentInClient(closedDcoumentParams)
		.then(change=>{
			switch(change.type){
				case documentManagerResultTypes.removeFile:
					this._languageFacade.removeDoc(change.result);
					break;
				default:
					getLogger(logSources.server).error('onDidCloseTextDocument wrong change type',change);
					break;
			}
		})
		.catch(rej => getLogger(logSources.server).error(`onDidCloseTextDocument was rejected `, rej));
	}

	async onDidChangeTextDocument(params: DidChangeTextDocumentParams) {
		await this._documentManager.changeTextDocument(params)
		.then(change =>{
			switch(change.type){
				case documentManagerResultTypes.updateFile:
					this._languageFacade.updateDoc(this._documentManager.getDocument(params.textDocument.uri));
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

	async onDeleteFile(deletedFile: string) {
		await this._documentManager.deletedDocument(deletedFile)
		.then(change =>{
			switch(change.type){
				case documentManagerResultTypes.removeFile:
					this._languageFacade.removeDoc(change.result);
				default:
					getLogger(logSources.server).error('onDeleteFile wrong change type',change);
					break;
			}
		})
		.catch(rej => getLogger(logSources.server).error(`onDeleteFile was rejected `, rej));
	}

	async onCreatedNewFile(newFileUri: string) {
		await this._documentManager.clientCreatedNewFile(newFileUri)
		.then(change => {
			switch(change.type){
				case documentManagerResultTypes.newFile:
					this._languageFacade.addDocs([change.result]);
				default:
					getLogger(logSources.server).error('onCreatedNewFile wrong change type',change);
					break;
			}
		})
		.catch(rej =>getLogger(logSources.server).error(`onCreatedNewFile was rejected`, rej));
	}

	async onOpenFolder(pathUri: string | null) {
		if (this._languageFacade !== undefined) {
			this._documentManager.openedFolder(pathUri);
			this._languageFacade.addDocs(this._documentManager.allDocumnets);
		}else{
			getLogger(logSources.server).warn("opend folder when facade wasn't initialized");
			setTimeout(() => {
				this.onOpenFolder(pathUri);
			}, 200);
		}
		console.log("finish open folder");
	}
	

	async initParser (pluginDir:string) {
		await LanguageServicesFacade.init(this._documentManager.allDocumnets, pluginDir)
		.then(ans => {console.log (`resolve parser init successfully`);
		this._languageFacade = ans;})
		.catch(rej => getLogger(logSources.server).error('reject form LanguageServicesFacade init', rej));
	}
}