import {
	ReferenceParams,
	Location,
	Position,
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
	TextDocumentIdentifier,
} from 'vscode-languageserver';

import { TextEdit } from 'vscode-languageserver-textdocument';
import { TextDocWithChanges } from './DocumentChangesManager';
import { flatten, languagesIds } from './Utils';

declare type moreRequests = any;

interface CompletionItemData{
	textDocument: TextDocumentIdentifier
}

export abstract class Analyzer{

	protected languageId: languagesIds = 0;
	protected textDocument:TextDocWithChanges;
	// protected parser: Parser = undefined;
	// protected ast: Parser.Tree = undefined;

	constructor(textDocumet: TextDocWithChanges){
		this.textDocument = textDocumet;
	}

	public getLanguageId (): languagesIds{
		return this.languageId;
	}

	

	// this fucntions are called when the request is first made from the server
	abstract onReferences(params:ReferenceParams):  Location[] | moreRequests;
	abstract onDefinition(params:DeclarationParams):  LocationLink[] | moreRequests;
	abstract onPrepareRename(params:RenameParams): Range | null | moreRequests;
	abstract onRenameRequest(params:RenameParams): WorkspaceEdit | moreRequests;
	abstract onCompletion(params:TextDocumentPositionParams): CompletionList | moreRequests;
	abstract onCompletionResolve(params:CompletionItem): CompletionItem | moreRequests;
	abstract onFoldingRanges(params:FoldingRangeParams): FoldingRange[] | moreRequests;

	abstract update (); // Still not sure about the signature but this will be called when there is an update in the file text

	//this functions are needed to complete the info of a request made by server to another file
	abstract referncesFromOtherFiles (params): Location [] | any;
	abstract findDefintionForOtherFile (params): LocationLink [];
	abstract doRenameFromOtherFile (params);
	abstract findCompletionsForOtherFile (params): CompletionList;
}



export class PolicySpaceAnalyzer extends Analyzer{

	constructor(textDocumet: TextDocWithChanges){
		super(textDocumet);
	}

	onReferences(params: ReferenceParams): Location[] {
		//TEST CODE TO DELELE
		let pos1:Position = Position.create(2,4);
		let pos2:Position = Position.create(2,15);
		let ans: Location[] = [
			{
				uri: params.textDocument.uri,
				range: {start:pos1,end:pos2}
			}
		];

		return ans;
	}
	onDefinition(params: DeclarationParams): LocationLink[] {
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
	onRenameRequest(params: RenameParams): WorkspaceEdit {
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

	onCompletion(params: TextDocumentPositionParams): CompletionList {
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
	onCompletionResolve(params: CompletionItem): CompletionItem {
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
	onFoldingRanges(params: FoldingRangeParams): FoldingRange[] {
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

	update (){}

	//this causes rename not to work therefore it isn't connected to server
	onPrepareRename(params:RenameParams): Range | null {
		throw new Error('Method not implemented.');
	}

	referncesFromOtherFiles(params: any) {
		throw new Error('Method not implemented.');
	}
	findDefintionForOtherFile(params: any): LocationLink[] {
		throw new Error('Method not implemented.');
	}
	doRenameFromOtherFile(params: any) {
		throw new Error('Method not implemented.');
	}
	findCompletionsForOtherFile(params: any): CompletionList {
		throw new Error('Method not implemented.');
	}

}

export class DecisionGraphAnalyzer extends Analyzer{

	referncesFromOtherFiles(params: any): Location[] {
		throw new Error('Method not implemented.');
	}
	findDefintionForOtherFile(params: any): LocationLink[] {
		throw new Error('Method not implemented.');
	}
	doRenameFromOtherFile(params: any) {
		throw new Error('Method not implemented.');
	}
	findCompletionsForOtherFile(params: any): CompletionList {
		throw new Error('Method not implemented.');
	}	
	onReferences(params: ReferenceParams): Location[] {
		throw new Error('Method not implemented.');
	}
	onDefinition(params: DeclarationParams): LocationLink[] {
		throw new Error('Method not implemented.');
	}
	onRenameRequest(params: RenameParams): WorkspaceEdit {
		throw new Error('Method not implemented.');
	}
	onCompletion(params: TextDocumentPositionParams): CompletionList {
		throw new Error('Method not implemented.');
	}
	onCompletionResolve(params: CompletionItem): CompletionItem {
		throw new Error('Method not implemented.');
	}
	onFoldingRanges(params: FoldingRangeParams): FoldingRange[] {
		throw new Error('Method not implemented.');
	}
	update (){}

	//this causes rename not to work therefore it isn't connected to server
	onPrepareRename(params:RenameParams): Range | null {
		throw new Error('Method not implemented.');
	}

	
}

export class ValueInferenceAnalyzer extends Analyzer{
	referncesFromOtherFiles(params: any): Location[] {
		throw new Error('Method not implemented.');
	}
	findDefintionForOtherFile(params: any): LocationLink[] {
		throw new Error('Method not implemented.');
	}
	doRenameFromOtherFile(params: any) {
		throw new Error('Method not implemented.');
	}
	findCompletionsForOtherFile(params: any): CompletionList {
		throw new Error('Method not implemented.');
	}
	onReferences(params: ReferenceParams): Location[] {
		throw new Error('Method not implemented.');
	}
	onDefinition(params: DeclarationParams): LocationLink[] {
		throw new Error('Method not implemented.');
	}
	onRenameRequest(params: RenameParams): WorkspaceEdit {
		throw new Error('Method not implemented.');
	}
	onCompletion(params: TextDocumentPositionParams): CompletionList {
		throw new Error('Method not implemented.');
	}
	onCompletionResolve(params: CompletionItem): CompletionItem {
		throw new Error('Method not implemented.');
	}
	onFoldingRanges(params: FoldingRangeParams): FoldingRange[] {
		throw new Error('Method not implemented.');
	}
	update (){}

	//this causes rename not to work therefore it isn't connected to server
	onPrepareRename(params:RenameParams): Range | null {
		throw new Error('Method not implemented.');
	}
	
	
}
