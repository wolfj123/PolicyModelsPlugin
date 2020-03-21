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
		FoldingRangeKind
	} from 'vscode-languageserver';



declare type wordBasedParams = ReferenceParams | DeclarationParams | RenameParams;
declare type allParamsTypes = wordBasedParams | TextDocumentPositionParams | FoldingRangeParams;

declare type wordBasedSolutions = Location [] | LocationLink [];
declare type allSolutionsTypes = wordBasedSolutions | CompletionItem [] | FoldingRange [];

declare type wordSpecificSolver = (word: string, params:wordBasedParams) => wordBasedSolutions;
declare type wordGeneralSolverType = (params: allParamsTypes, funcName: string) => allSolutionsTypes;
declare type generalSolverType = wordGeneralSolverType;


let currDoc: currnetFileState = undefined;

function solveOnRefernce (word:string, _params:wordBasedParams ) : Location[]{
	let params: ReferenceParams = _params as ReferenceParams;

	// TODO Implement shira
	let pos1:Position = Position.create(2,4);
	let pos2:Position = Position.create(2,15);
	return [
		{
			uri: params.textDocument.uri,
			range: {start:pos1,end:pos2}
		}
	];
}

function solveOnDefiniton (word:string, _params:wordBasedParams ) : LocationLink[]{
	let params = _params as ReferenceParams;
	// TODO Implement shira
	
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

function findWordFromPositionInFile (fileName: string, lineNumber: number, charPosition: number): string {
	//return currDoc.getWordAt(lineNumber,charPosition);
	return "Encryption";
}

function wordBasedGeneralSolver(_params: allParamsTypes, funcName: string): wordBasedSolutions {
	let wordSolvers: {[id: string]: wordSpecificSolver} =
	{
		"onReferences":solveOnRefernce,
		"onDefinition":solveOnDefiniton,
	}

	let params = _params as wordBasedParams;

	let word: string = findWordFromPositionInFile (params.textDocument.uri, params.position.line, params.position.character);

	return wordSolvers[funcName](word,params);
}

function solveOnFoldingRange(_params: allParamsTypes) : FoldingRange[]{
	let params: FoldingRangeParams = _params as FoldingRangeParams;

	// TODO Implement shira

	return [
		{
			startLine:1,
			startCharacter:0,
			endLine:2,
			endCharacter:20,
			kind:FoldingRangeKind.Region
		}
	];
	return null;

}


export function updateDoc (change: TextDocumentChangeEvent<TextDocument>){
	currDoc = new currnetFileState(change.document.uri, change.document.getText())
	//docState = new docState(change.document.uri,change.document.)
}

export function solve(params:allParamsTypes , funcName: string): allSolutionsTypes{
	let allSolvers: {[id: string]: generalSolverType} =
	
	{
		"onReferences":wordBasedGeneralSolver,
		"onDefiniton": wordBasedGeneralSolver,
		'onFoldingRanges': solveOnFoldingRange,

		default:
			(a,b)=>{
				console.error("aa");
				return null;
			}
	};

	return allSolvers[funcName](params,funcName);
}

