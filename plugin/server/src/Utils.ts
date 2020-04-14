import {
	ReferenceParams,
	Location,
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

export declare type allParamsTypes = ReferenceParams | DeclarationParams | RenameParams | TextDocumentPositionParams | 
							  CompletionItem | FoldingRangeParams | string;
export declare type allSolutionTypes = Location[] | WorkspaceEdit | CompletionList | CompletionItem | FoldingRange[] |
								LocationLink[] | Range;

export function flatten (arr: any [][]): any [] {
	let ans: any[] = [];
	arr.forEach(x=> x.forEach(y=> ans.push(y))   );
	return ans;
}