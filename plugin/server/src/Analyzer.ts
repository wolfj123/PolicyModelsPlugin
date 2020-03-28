import {
	ReferenceParams,
	Location,
	Position,
	TextDocument,
	DeclarationParams,
	RenameParams,
	LocationLink,
	CompletionItem,
	TextDocumentPositionParams,
	FoldingRangeParams,
	FoldingRange,
	FoldingRangeKind,
	WorkspaceEdit,
	TextDocumentEdit,
	CompletionList,
	CompletionItemKind,
	TextDocuments,
	TextDocumentIdentifier,
	TextDocumentChangeEvent,
	DidChangeWatchedFilesParams,
} from 'vscode-languageserver';

import { TextEdit } from 'vscode-languageserver-textdocument';

declare type allParamsTypes = ReferenceParams | DeclarationParams | RenameParams | TextDocumentPositionParams | 
							  CompletionItem | FoldingRangeParams | string;
declare type allSolutionTypes = Location[] | WorkspaceEdit | CompletionList | CompletionItem | FoldingRange[] |
							    LocationLink[] | void;

enum langugeIds {
	policyspace =  0,
	decisionGraph =  1
}

interface CompletionItemData{
	textDocument: TextDocumentIdentifier
}

interface Analyzer{
	getAllRefernces(params:ReferenceParams):  Location[];
	getDefinition(params:DeclarationParams):  LocationLink[];
	doRename(params:RenameParams): WorkspaceEdit;

	autoCompleteRequest(params:TextDocumentPositionParams): CompletionList;
	resolveAutoCompleteItem(params:CompletionItem): CompletionItem;

	getFoldingRange(params:FoldingRangeParams): FoldingRange[];
}


class PolicySpaceAnalyzer implements Analyzer{

	getAllRefernces(params: ReferenceParams): Location[] {
		//TEST CODE TO DELELE
		let pos1:Position = Position.create(2,4);
		let pos2:Position = Position.create(2,15);
		return [
			{
				uri: params.textDocument.uri,
				range: {start:pos1,end:pos2}
			}
		];
	}
	getDefinition(params: DeclarationParams): LocationLink[] {
		//TEST CODE TO DELELE
		let uriAns:string = params.textDocument.uri;
		let pos1: Position = Position.create(1,0);
		let pos2: Position = Position.create(2,20);
		let pos3: Position = Position.create(2,3);
		let pos4: Position = Position.create(2,4);

		return [
			{
				originSelectionRange:  {start: params.position, end: params.position},
				targetUri: uriAns,
				targetRange: {start: pos1, end: pos2},
				targetSelectionRange: {start: pos3, end: pos4}
			}
		];
	}
	doRename(params: RenameParams): WorkspaceEdit {
		//TEST CODE TO DELELE
		let pos1: Position = {line:0,character:0};
		let pos2: Position = {line:0,character:5};
		
		let fileName:string = params.textDocument.uri;

		let edit: TextEdit = {
			range:{start:pos1, end: pos2},
			newText: "abcde"
		}

		let dc:TextDocumentEdit = {
			edits: [edit],
			textDocument: {
				uri: fileName,
				version: null
			}
		}
		
		let ans:WorkspaceEdit = {
			changes: null, // this can be null always it isn't used.
			documentChanges: [dc]
		}

		return ans;
	}

	autoCompleteRequest(params: TextDocumentPositionParams): CompletionList {
		// We need to add this information for all results - because we use it in the server
		let data: CompletionItemData = {
			textDocument: params.textDocument
		}
		//TEST CODE TO DELELE
		let compItmes:CompletionItem[] = [
			{
			  label: 'PolicyModels',
			  kind: CompletionItemKind.Text,
			  data: data
			},
			{
			  label: 'DecisionGraph',
			  kind: CompletionItemKind.Text,
			  data: data
			},
			{
			  label: 'PolicySpace',
			  kind: CompletionItemKind.Text,
			  data: data
			}
		  ];
	
		return {
			isIncomplete: false,
			items: compItmes
		};
	}
	resolveAutoCompleteItem(params: CompletionItem): CompletionItem {
		//TEST CODE TO DELELE
		let item = params;
		if (item.data === 1) {
			item.detail = 'PolicyModels details';
			item.documentation = 'PolicyModels documentation';
		} else if (item.data === 2) {
			item.detail = 'DecisionGraph details';
			item.documentation = 'DecisionGraph documentation';
		} else if (item.data === 3) {
			item.detail = 'PolicySpace details';
			item.documentation = 'PolicySpace documentation';
		}
		return item;
	}
	getFoldingRange(params: FoldingRangeParams): FoldingRange[] {
		//TEST CODE TO DELELE
		// NOTE the client we are using only supports for line folding - meaning the startCharacter & endCharacter are Irrelevant 
		return [
		{
			startLine:1,
			startCharacter:12,
			endLine:2,
			endCharacter:20,
			kind:FoldingRangeKind.Region
		}
	];
	}

}

class DecisionGraphAnalyzer implements Analyzer{
	getAllRefernces(params: ReferenceParams): Location[] {
		throw new Error('Method not implemented.');
	}
	getDefinition(params: DeclarationParams): LocationLink[] {
		throw new Error('Method not implemented.');
	}
	doRename(params: RenameParams): WorkspaceEdit {
		throw new Error('Method not implemented.');
	}
	autoCompleteRequest(params: TextDocumentPositionParams): CompletionList {
		throw new Error('Method not implemented.');
	}
	resolveAutoCompleteItem(params: CompletionItem): CompletionItem {
		throw new Error('Method not implemented.');
	}
	getFoldingRange(params: FoldingRangeParams): FoldingRange[] {
		throw new Error('Method not implemented.');
	}
	
}

export interface SolverInt<T extends TextDocument> {
	solve(params:any, requestName: string, fileUri: string): any;
	onDidChangeContent(change: TextDocumentChangeEvent<T>): void;
	onDidSave?(change: TextDocumentChangeEvent<T>): void;
	onDidClose?(change: TextDocumentChangeEvent<T>): void;
	onDidChangeWatchedFiles?(change: DidChangeWatchedFilesParams): void;
}

export class Solver<T extends TextDocument> implements SolverInt<T>{
	private policyAnalyzer: Analyzer;
	private decisionGraphAnalyzer: Analyzer;
	private documentsManager: TextDocuments<T>; // probalby will be extended 

	constructor(documentsManager: TextDocuments<T>){
		this.policyAnalyzer = new PolicySpaceAnalyzer();
		this.decisionGraphAnalyzer = new DecisionGraphAnalyzer();
		this.documentsManager = documentsManager;
		//TODO we need to get the entire folder files
	}

	public solve(params:any, requestName: string, fileUri: string): any {	
		let policySpaceHandler: {[id: string]: (paramas:allParamsTypes ) => allSolutionTypes} = {
			'onReferences':this.policyAnalyzer.getAllRefernces,
			'onDefinition': this.policyAnalyzer.getDefinition,
			'onRenameRequest': this.policyAnalyzer.doRename,
			'onFoldingRanges': this.policyAnalyzer.getFoldingRange,
			'onCompletion': this.policyAnalyzer.autoCompleteRequest,
			'onCompletionResolve': this.policyAnalyzer.resolveAutoCompleteItem,
			default: this.errorFindingFunction
		}

		let decisionGrpahHandler: {[id: string]: (paramas:allParamsTypes ) => allSolutionTypes} = {
			'onReferences':this.decisionGraphAnalyzer.getAllRefernces,
			'onDefinition': this.decisionGraphAnalyzer.getDefinition,
			'onRenameRequest': this.decisionGraphAnalyzer.doRename,
			'onFoldingRanges': this.decisionGraphAnalyzer.getFoldingRange,
			'onCompletion': this.decisionGraphAnalyzer.autoCompleteRequest,
			'onCompletionResolve': this.decisionGraphAnalyzer.resolveAutoCompleteItem,
			default: this.errorFindingFunction
		}

		let relevantHandler: {[id: number]: {[id: string]: (paramas:allParamsTypes ) => allSolutionTypes}} = {
			[langugeIds.policyspace]: policySpaceHandler,
			[langugeIds.decisionGraph]: decisionGrpahHandler
		}

		let langugeId:number = this.findLangugeIdFromUri(fileUri);
		return relevantHandler[langugeId][requestName](params);
	}

	private findLangugeIdFromUri(uri: string): number {
		let allDocuments: T []= this.documentsManager.all();
		let langId: string = allDocuments.find (curr => curr.uri === uri).languageId
		return langugeIds[langId];
	}

	private errorFindingFunction (params: string): void {
		//TODO 
	}

	onDidChangeContent(change: TextDocumentChangeEvent<T>): void {
		//TODO
	}

	onDidChangeWatchedFiles(change:DidChangeWatchedFilesParams): void {
		//TODO
	}
}