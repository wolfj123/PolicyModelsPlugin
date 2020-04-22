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
	DocumentUri
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
	onOpenFolder (pathUri: string | null): void;
}


export class PMSolver implements SolverInt{

	private _documentManager: TextDocumentManager;
	private _languageFacade;

	constructor(){
		this._documentManager = new TextDocumentManager;
		//TODO init language Facade
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
		return null;
	}

	onPrepareRename(params: PrepareRenameParams, uri: string): Range | null {
		//throw new Error('Method not implemented.');
		return null;
	}

	onRenameRequest(params: RenameParams, uri: string): WorkspaceEdit {
		//throw new Error('Method not implemented.');
		return null;
	}

	onReferences(params: ReferenceParams, uri: string): Location [] {
		//throw new Error('Method not implemented.');
		return null;
	}
	
	onFoldingRanges(params: FoldingRangeParams, uri: string): FoldingRange [] {
		//throw new Error('Method not implemented.');
		return null;
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

	onOpenFolder(pathUri: string | null): void {
		this._documentManager.openedFolder(pathUri);
	}
	
}