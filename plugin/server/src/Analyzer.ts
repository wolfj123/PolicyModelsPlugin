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
import Parser = require('web-tree-sitter');
import { create } from 'domain';
import { CreateParser } from './Factory';
import { langugeIds } from './Utils';


interface CompletionItemData{
	textDocument: TextDocumentIdentifier
}

export abstract class Analyzer{

	protected textDocument:TextDocWithChanges;
	protected parser: Parser = undefined;
	protected ast: Parser.Tree = undefined;

	constructor(textDocumet: TextDocWithChanges){
		this.textDocument = textDocumet;
	}

	// needs to Hahve AST, cahing, textDoc
	abstract getAllRefernces(params:ReferenceParams):  Location[];
	abstract getDefinition(params:DeclarationParams):  LocationLink[];
	abstract doRename(params:RenameParams): WorkspaceEdit;

	abstract autoCompleteRequest(params:TextDocumentPositionParams): CompletionList;
	abstract resolveAutoCompleteItem(params:CompletionItem): CompletionItem;

	abstract getFoldingRange(params:FoldingRangeParams): FoldingRange[];

	abstract update (); // Still not sure about the signature but this will be called when there is an update in the file text
}


export class PolicySpaceAnalyzer extends Analyzer{

	constructor(textDocumet: TextDocWithChanges){
		super(textDocumet);
		this.parser = CreateParser(langugeIds.policyspace);
		if (this.parser === undefined){
			//error?
			return;
		}
		this.ast = this.parser.parse(textDocumet.textDocument.getText());
	}

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

	update (){}

}

export class DecisionGraphAnalyzer extends Analyzer{
	
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
	update (){}
	
}

export class ValueInferenceAnalyzer extends Analyzer{

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
	update (){}
	
}
