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
	Range
} from 'vscode-languageserver';

import { TextDocumentManager, documentManagerResultTypes, TextDocumentManagerInt } from './DocumentManager';
import { LanguageServicesFacade } from './LanguageServices';

export interface SolverInt {
	onCompletion(params: TextDocumentPositionParams, uri: string): CompletionList;
	onCompletionResolve(params: CompletionItem, uri: string): CompletionItem;
	onDefinition(params:DeclarationParams, uri: string): LocationLink [];
	onPrepareRename(params:PrepareRenameParams, uri: string):  Range ;
	onRenameRequest(params:RenameParams, uri: string): WorkspaceEdit;
	onReferences(params: ReferenceParams, uri: string): Location[];
	onFoldingRanges(params: FoldingRangeParams, uri: string): FoldingRange[];

	onDidOpenTextDocument (opendDocParam: TextDocumentItem);
	onDidCloseTextDocument (closedDcoumentParams: TextDocumentIdentifier);
	onDidChangeTextDocument (params: DidChangeTextDocumentParams);
	onDeleteFile (deletedFile:DocumentUri);
	onCreatedNewFile (newFileUri:DocumentUri);
	onOpenFolder (pathUri: string | null);
}


export class PMSolver implements SolverInt{

	private _documentManager: TextDocumentManagerInt;
	private _languageFacade: LanguageServicesFacade;

	constructor(){
		this._documentManager = new TextDocumentManager;
		this._languageFacade = undefined;
	}
	
	onCompletion(params: TextDocumentPositionParams, uri: string): CompletionList {
		//throw new Error('Method not implemented.');
		return null; //TODO
	}

	onCompletionResolve(params: CompletionItem, uri: string): CompletionItem {
		//throw new Error('Method not implemented.');
		return null; //TODO
	}

	onDefinition(params: DeclarationParams, uri: string): LocationLink[] {
		//throw new Error('Method not implemented.');
		let ans:LocationLink[]= this._languageFacade.onDefinition(params);
		return ans;
	}

	onPrepareRename(params: PrepareRenameParams, uri: string): Range | null {
		return this._languageFacade.onPrepareRename(params);
	}

	onRenameRequest(params: RenameParams, uri: string): WorkspaceEdit {
		//throw new Error('Method not implemented.');
		return null; //TODO
	}

	onReferences(params: ReferenceParams, uri: string): Location [] {
		return this._languageFacade.onReferences(params);
	}
	
	onFoldingRanges(params: FoldingRangeParams, uri: string): FoldingRange [] {
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
					case documentManagerResultTypes.newFile:
						this._languageFacade.addDocs([currChange.result]);
						break;
					case documentManagerResultTypes.removeFile:
						this._languageFacade.removeDoc(currChange.result)
						break;
				}
			});
		})
		.catch(rej => console.log(`onDidOpenTextDocument was rejected \n${rej} \n`));
	}

	async onDidCloseTextDocument(closedDcoumentParams: TextDocumentIdentifier) {
		await this._documentManager.closedDocumentInClient(closedDcoumentParams)
		.then(change=>{
			switch(change.type){
				case documentManagerResultTypes.removeFile:
					this._languageFacade.removeDoc(change.result);
					break;
			}
		})
		.catch(rej => console.log(`onDidCloseTextDocument was rejected \n${rej} \n`));
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
			}
		})
		.catch(rej => console.log(`onDeleteFile was rejected \n${rej} \n`));
	}

	async onDeleteFile(deletedFile: string) {
		await this._documentManager.deletedDocument(deletedFile)
		.then(change =>{
			switch(change.type){
				case documentManagerResultTypes.removeFile:
					this._languageFacade.removeDoc(change.result);
			}
		})
		.catch(rej => console.log(`onDeleteFile was rejected \n${rej} \n`));
	}

	async onCreatedNewFile(newFileUri: string) {
		await this._documentManager.clientCreatedNewFile(newFileUri)
		.then(change => {
			switch(change.type){
				case documentManagerResultTypes.newFile:
					this._languageFacade.addDocs([change.result]);
			}
		})
		.catch(rej => console.log(`onCreatedNewFile was rejected \n${rej} \n`));
	}

	async onOpenFolder(pathUri: string | null) {
		this._documentManager.openedFolder(pathUri);
		await LanguageServicesFacade.init(this._documentManager.allDocumnets)
		.then(ans => this._languageFacade = ans)
		.catch(rej => console.log('reject form LanguageServicesFacade init \n' + rej));
	}
	
}