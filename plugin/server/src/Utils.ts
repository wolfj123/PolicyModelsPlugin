import {
	ReferenceParams,
	DocumentUri,
	Location,
	Range,
	Position,
	DeclarationParams,
	RenameParams,
	LocationLink,
	CompletionItem,
	TextDocumentPositionParams,
	FoldingRangeParams,
	FoldingRange,
	WorkspaceEdit,
	CompletionList,
	TextDocumentContentChangeEvent,
} from 'vscode-languageserver';
import * as Parser from 'web-tree-sitter'
import { changeInfo } from './Documents';
export enum languagesIds {
	policyspace =  0,
	decisiongraph =  1,
	valueinference = 2
}

const psExt:string = "ps";
const pspaceExt:string = "pspace";
const dgExt:string = "dg";
const viExt:string = "vi";

const allFileExtensions: string [] = [psExt, pspaceExt, dgExt, viExt];

export function flatten (arr: any [][]): any [] {
	let ans: any[] = [];
	arr.forEach(x=> x.forEach(y=> ans.push(y))   );
	return ans;
}

export function point2Position(p : Parser.Point) : Position {
	return Position.create(p.row, p.column)
}

export function position2Point(p : Position) : Parser.Point {
	return {row: p.line, column: p.character}
}

export function newRange(pos1 : Position, pos2 : Position) : Range {
	return {start: pos1,end: pos2}
}

export function newLocation(uri : DocumentUri, range : Range) : Location {
	//let range = newRange(pos1, pos2)
	return 	{
		uri: uri,
		range: range
	}
}

export function position2Location(p : Position, uri : DocumentUri) : Location {
	let range : Range = newRange(p, p)
	return newLocation(uri, range)
}

export function getFileExtension(filename : string) : string {
	let re = /(?:\.([^.]+))?$/;
	return re.exec(filename)[1];   
}


/*
export interface changeInfo{
	oldRange: Range,
	newRange: Range
}
*/
export function changeInfo2Edit(change : changeInfo) {
	const result =  
	{
		startIndex: change.oldRange.start.character,
		oldEndIndex: change.oldRange.end.character, 
		newEndIndex: change.newRange.end.character,
		startPosition: {row: change.oldRange.start.line, column: change.oldRange.start.character},
		oldEndPosition: {row: change.oldRange.end.line, column: change.oldRange.end.character}, 
		newEndPosition: {row: change.newRange.end.line, column: change.newRange.end.character} 
	}
	return result
}

//old interface
export function docChange2Edit(change : TextDocumentContentChangeEvent) : Parser.Edit {
	if ("range" in change) {
		const range : Range = change.range
		//if(isNullOrUndefined(range)) return null
		const newEndPosition = getEndRowAndColumnOfString(change.text)
		const result =  
		{
			startIndex: range.start.character,
			oldEndIndex: range.end.character, 
			newEndIndex: newEndPosition.column, //TODO: 
			startPosition: {row: range.start.line, column: range.start.character},
			oldEndPosition: {row: range.end.line, column: range.end.character}, 
			newEndPosition: {row: newEndPosition.row, column: newEndPosition.column} //TODO: 
		}
		return result
	}
	return null
}

function getEndRowAndColumnOfString(str : string) : {row: number, column: number} {
	TODO:
	throw new Error("Method not implemented.");
}
