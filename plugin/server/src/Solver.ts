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
	Location
} from 'vscode-languageserver';

import { TextDocumentManager } from './DocumentManager';

// export interface SolverInt<T extends TextDocWithChanges> {
// 	solve(params:any, requestName: string, textDocument): any;
// 	onDidChangeContent(change: TextDocumentChangeEvent<T>): void;
// 	onDidOpen(change: TextDocumentChangeEvent<T>): void;
// 	onDidSave(change: TextDocumentChangeEvent<T>): void;
// 	onDidClose(change: TextDocumentChangeEvent<T>): void;
// 	onDidChangeWatchedFiles?(change: DidChangeWatchedFilesParams): void;
// }

export interface SolverInt {
	onCompletion(params: TextDocumentPositionParams, uri: string): CompletionList;
	onCompletionResolve(params: CompletionItem, uri: string): CompletionItem;
	onDefinition(params:DeclarationParams, uri: string): LocationLink [];
	onPrepareRename(params:PrepareRenameParams, uri: string):  Range ;
	onRenameRequest(params:RenameParams, uri: string): WorkspaceEdit;
	onReferences(params: ReferenceParams, uri: string): Location[];
	onFoldingRanges(params: FoldingRangeParams, uri: string): FoldingRange[];
}


export class PMSolver implements SolverInt{

	private _documentManager: TextDocumentManager;
	private _languageFacade;

	constructor(docManager: TextDocumentManager){
		this._documentManager = docManager;
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
	onPrepareRename(params: PrepareRenameParams, uri: string): Range {
		//throw new Error('Method not implemented.');
		return null;
	}
	onRenameRequest(params: RenameParams, uri: string): WorkspaceEdit {
		//throw new Error('Method not implemented.');
		return null;
	}
	onReferences(params: ReferenceParams, uri: string): Location[] {
		//throw new Error('Method not implemented.');
		return null;
	}
	onFoldingRanges(params: FoldingRangeParams, uri: string): FoldingRange[] {
		//throw new Error('Method not implemented.');
		return null;
	}
	
}