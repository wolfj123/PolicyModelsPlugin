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

export enum langugeIds {
	policyspace =  0,
	decisionGraph =  1,
	valueInference = 2
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