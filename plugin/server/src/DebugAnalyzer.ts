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
		TextDocumentChangeEvent,
		FoldingRangeParams,
		FoldingRange,
		FoldingRangeKind,
		WorkspaceEdit,
		TextDocumentEdit,
		CompletionList,
		CompletionItemKind
	} from 'vscode-languageserver';

import { TextEdit } from 'vscode-languageserver-textdocument';

declare type wordBasedParams = ReferenceParams | DeclarationParams | RenameParams;
declare type allParamsTypes = wordBasedParams | TextDocumentPositionParams | FoldingRangeParams | TextDocumentPositionParams| CompletionItem;

declare type wordBasedSolutions = Location [] | LocationLink []| WorkspaceEdit;
declare type allSolutionsTypes = wordBasedSolutions | CompletionList | FoldingRange [] | CompletionItem;

declare type wordSpecificSolver = (word: string, params:wordBasedParams) => wordBasedSolutions;
declare type wordGeneralSolverType = (params: allParamsTypes, funcName: string) => allSolutionsTypes;
declare type generalSolverType = wordGeneralSolverType;


function solveOnRefernce (word:string, _params:wordBasedParams ) : Location[]{
	let params: ReferenceParams = _params as ReferenceParams;

	let pos1:Position = Position.create(2,4);
	let pos2:Position = Position.create(2,15);
	return [
		{
			uri: params.textDocument.uri,
			range: {start:pos1,end:pos2}
		}
	];
}

function solveOnDefiniton (word:string, _params:wordBasedParams ) : LocationLink[] {
	let params = _params as ReferenceParams;
	
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

function solveOnRename(word:string, _params:wordBasedParams): WorkspaceEdit{
	let params: RenameParams = _params as RenameParams;

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

function findWordFromPositionInFile (lineNumber: number, charPosition: number): string {
	//return currDoc.getWordAt(lineNumber,charPosition);
	return "Encryption";
}

function wordBasedGeneralSolver(_params: allParamsTypes, funcName: string): wordBasedSolutions {
	let wordSolvers: {[id: string]: wordSpecificSolver} =
	{
		'onReferences':solveOnRefernce,
		'onDefinition':solveOnDefiniton,
		'onRenameRequest':solveOnRename
	}

	let params = _params as wordBasedParams;

	let word: string = findWordFromPositionInFile (params.position.line, params.position.character);

	return wordSolvers[funcName](word,params);
}

function solveOnFoldingRange(_params: allParamsTypes) : FoldingRange[]{
	let params: FoldingRangeParams = _params as FoldingRangeParams;
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

function solveOnCompletion (_params: allParamsTypes): CompletionList {
	let params: TextDocumentPositionParams = _params as TextDocumentPositionParams;

	let compItmes:CompletionItem[] = [
		{
		  label: 'PolicyModels',
		  kind: CompletionItemKind.Text,
		  data: 1
		},
		{
		  label: 'DecisionGraph',
		  kind: CompletionItemKind.Text,
		  data: 2
		},
		{
		  label: 'PolicySpace',
		  kind: CompletionItemKind.Text,
		  data: 3
		}
	  ];

	return {
		isIncomplete: false,
		items: compItmes
	};
}

function onCompletionResolve (_params: allParamsTypes) : CompletionItem {
	let params: CompletionItem = _params as CompletionItem;

	
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

export function updateDoc (change: TextDocumentChangeEvent<TextDocument>){
	//currDoc = new currnetFileState(change.document.uri, change.document.getText())
	//docState = new docState(change.document.uri,change.document.)
}

// DONT USE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
export function solve(params:allParamsTypes , funcName: string): allSolutionsTypes{
	let allSolvers: {[id: string]: generalSolverType} =
	
	{
		'onReferences':wordBasedGeneralSolver,
		'onDefinition': wordBasedGeneralSolver,
		'onRenameRequest': wordBasedGeneralSolver,
		'onFoldingRanges': solveOnFoldingRange,
		'onCompletion': solveOnCompletion,
		'onCompletionResolve': onCompletionResolve,

		default:
			//TODO amsel add error
			(a,b)=>{
				console.error("aa");
				return null;
			}
	};

	return allSolvers[funcName](params,funcName);
}

