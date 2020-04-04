import {
	TextDocuments,
	TextDocumentChangeEvent,
	DidChangeWatchedFilesParams,
	TextDocumentIdentifier,
} from 'vscode-languageserver';

import { Analyzer } from './Analyzer';
import { allParamsTypes, allSolutionTypes, languagesIds } from './Utils';
import { CreateAnalyzer } from './Factory';
import { TextDocWithChanges } from './DocumentChangesManager';

export interface SolverInt<T extends TextDocWithChanges> {
	solve(params:any, requestName: string, textDocument): any;
	onDidChangeContent(change: TextDocumentChangeEvent<T>): void;
	onDidOpen(change: TextDocumentChangeEvent<T>): void;
	onDidSave(change: TextDocumentChangeEvent<T>): void;
	onDidClose(change: TextDocumentChangeEvent<T>): void;
	onDidChangeWatchedFiles?(change: DidChangeWatchedFilesParams): void;
}

interface analyzerHolder {
	uri: string,
	language: languagesIds,
	analyzer: Analyzer
}

export class Solver<T  extends TextDocWithChanges> implements SolverInt<T> {
	private documentsManager: TextDocuments<T>; // probalby will be extended 
	private anlayzers: analyzerHolder[]

	constructor(documentsManager: TextDocuments<T>){
		this.documentsManager = documentsManager;
		this.anlayzers = [];
		//TODO create analyzers for all files in folder
	}

	public solve(params:any, requestName: string, textDocument:TextDocumentIdentifier): allSolutionTypes {	
				
		let currAnalyzer = this.anlayzers.find(x => x.uri === textDocument.uri);

		let toActivate: (params: allParamsTypes) => allSolutionTypes = currAnalyzer.analyzer[requestName];
		if (toActivate === undefined) {
			//TODO error
			return null;
		}

		let partialAnswer =  toActivate(params);

		return partialAnswer;
	}

	// TEMP functions until fix doc manager

	onDidOpen(change: TextDocumentChangeEvent<T>): void {
		let langId = languagesIds [change.document.textDocument.languageId];
		let toAdd: analyzerHolder = {
			uri: change.document.textDocument.uri,
			language: langId,
			analyzer: CreateAnalyzer(change.document)
		}

		this.anlayzers.push(toAdd);
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