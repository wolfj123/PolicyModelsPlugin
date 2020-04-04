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
} from 'vscode-languageserver';
import * as Parser from 'web-tree-sitter'

export enum languagesIds {
	policyspace =  0,
	decisiongraph =  1,
	valueinference = 2
}
export declare type allParamsTypes = ReferenceParams | DeclarationParams | RenameParams | TextDocumentPositionParams | 
							  CompletionItem | FoldingRangeParams | string;
export declare type allSolutionTypes = Location[] | WorkspaceEdit | CompletionList | CompletionItem | FoldingRange[] |
								LocationLink[] | Range;

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

export function newLocation(uri : DocumentUri, pos1 : Position, pos2 : Position) : Location {
	let range = newRange(pos1, pos2)
	return 	{
		uri: uri,
		range: range
	}
}

export function getFileExtension(filename : string) : string {
	let re = /(?:\.([^.]+))?$/;
	return re.exec(filename)[1];   
}
