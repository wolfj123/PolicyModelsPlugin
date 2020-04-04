import {
	TextDocuments,
	TextDocumentChangeEvent,
	DidChangeWatchedFilesParams,
	TextDocumentIdentifier,
} from 'vscode-languageserver';

import { Analyzer } from './Analyzer';
import { allParamsTypes, allSolutionTypes, langugeIds } from './Utils';
import { CreateAnalyzer } from './AnalyzerFactory';
import { TextDocWithChanges } from './DocumentChangesManager';



export interface SolverInt<T extends TextDocWithChanges> {
	solve(params:any, requestName: string, textDocument): any;
	onDidChangeContent(change: TextDocumentChangeEvent<T>): void;
	onDidOpen(change: TextDocumentChangeEvent<T>): void;
	onDidSave(change: TextDocumentChangeEvent<T>): void;
	onDidClose(change: TextDocumentChangeEvent<T>): void;
	onDidChangeWatchedFiles?(change: DidChangeWatchedFilesParams): void;
}

export class Solver<T  extends TextDocWithChanges> implements SolverInt<T>{
	private documentsManager: TextDocuments<T>; // probalby will be extended 
	private anlayzers: {[id: string]: Analyzer};

	constructor(documentsManager: TextDocuments<T>){
		this.documentsManager = documentsManager;
		this.anlayzers = {};
		//TODO create analyzers for all files in folder
	}

	public solve(params:any, requestName: string, textDocument:TextDocumentIdentifier): allSolutionTypes {	
		
		//@ts-ignore
		let currAnalyzer = this.anlayzers[textDocument.uri];
		
		
		let handler: {[id: string]: (params: allParamsTypes) => allSolutionTypes} = {
			'onReferences':currAnalyzer.getAllRefernces,
			'onDefinition': currAnalyzer.getDefinition,
			'onRenameRequest': currAnalyzer.doRename,
			'onFoldingRanges': currAnalyzer.getFoldingRange,
			'onCompletion': currAnalyzer.autoCompleteRequest,
			'onCompletionResolve':currAnalyzer.resolveAutoCompleteItem,
		}

		// TODO add here a callback for this solver the callback will be any other analyzers activation needed
		// think about cyclic call backs how to prevent maybe not possible than the solver will be needed in all analyzers
		let toActivate: (params: allParamsTypes) => allSolutionTypes = handler[requestName];
		if (toActivate === undefined) {
			//TODO error
			return null;
		}

		return toActivate(params);
	}

	onDidOpen(change: TextDocumentChangeEvent<T>): void {
		let langId = langugeIds [change.document.textDocument.languageId];
		
		this.anlayzers[change.document.textDocument.uri] = CreateAnalyzer(change.document);
	}

	onDidChangeContent(change: TextDocumentChangeEvent<T>): void {
		//TODO
	}

	onDidChangeWatchedFiles(change:DidChangeWatchedFilesParams): void {
		//TODO
	}
	onDidSave(change: TextDocumentChangeEvent<T>): void {
		//throw new Error('Method not implemented.');
	}
	onDidClose(change: TextDocumentChangeEvent<T>): void {
		//throw new Error('Method not implemented.');
	}
}