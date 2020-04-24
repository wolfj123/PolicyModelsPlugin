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

import { TextDocumentManager } from './DocumentManager';
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

	private _documentManager: TextDocumentManager;
	private _languageFacade: LanguageServicesFacade;

	constructor(){
		this._documentManager = new TextDocumentManager;
		this._languageFacade = undefined;
	}
	
	onCompletion(params: TextDocumentPositionParams, uri: string): CompletionList {
		//throw new Error('Method not implemented.');
		return null;
	}

	onCompletionResolve(params: CompletionItem, uri: string): CompletionItem {
		//throw new Error('Method not implemented.');
		return null;
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
		return null;
	}

	onReferences(params: ReferenceParams, uri: string): Location [] {
		return this._languageFacade.onReferences(params);
	}
	
	onFoldingRanges(params: FoldingRangeParams, uri: string): FoldingRange [] {
		let foldingLocations: Location [] = this._languageFacade.onFoldingRanges(params);
		let foldingRanges: FoldingRange[] = foldingLocations.map (currLocation => 
			FoldingRange.create(currLocation.range.start.line,currLocation.range.end.line,
				currLocation.range.start.character,currLocation.range.end.character)
		);
		return foldingRanges;
	}



	onDidOpenTextDocument(opendDocParam: TextDocumentItem) {
		this._documentManager.openedDocumentInClient(opendDocParam);
	}

	onDidCloseTextDocument(closedDcoumentParams: TextDocumentIdentifier) {
		this._documentManager.closedDocumentInClient(closedDcoumentParams);
	}

	onDidChangeTextDocument(params: DidChangeTextDocumentParams) {
		this._documentManager.changeTextDocument(params);
	}

	onDeleteFile(deletedFile: string) {
		this._documentManager.deletedDocument(deletedFile);
	}

	onCreatedNewFile(newFileUri: string) {
		this._documentManager.clientCreatedNewFile(newFileUri);
	}

	async onOpenFolder(pathUri: string | null) {
		this._documentManager.openedFolder(pathUri);
		await LanguageServicesFacade.init(this._documentManager.allDocumnets)
		.then(ans => this._languageFacade = ans)
		.catch(rej => console.log('reject form LanguageServicesFacade init \n' + rej));
	}
	
}