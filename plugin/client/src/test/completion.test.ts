// /*
// Test Documention: https://code.visualstudio.com/api/references/commands
// Relevant Comman: vscode.executeCompletionItemProvider
// Expected Output: Array of
// export class CompletionList {
// 	isIncomplete?: boolean;
// 	items: CompletionItem[];
// 	constructor(items?: CompletionItem[], isIncomplete?: boolean);
// }
// */


// import * as vscode from 'vscode';
// import * as assert from 'assert';
// import { 
// 	getDocUri, 
// 	activate, 
// 	getWordPositionFromLine, 
// 	getWordRangeFromLineInEditor, 
// 	getWordRangeFromLineInFile} from './helper';

// var testCounter: number = 0
// var testFixtureFolderPath: String = 'InferrerExample\\'
// let defaultPosition: vscode.Position = new vscode.Position(0,0)
// export type CompletionResolve = vscode.CompletionList;

// describe('Completion test Sanity', () => {
// 	const docUri = getDocUri(testFixtureFolderPath + 'policy-space.pspace');

// 	it('Sanity Test' + testCounter.toString(), async () => {
// 		let completion: CompletionResolve = {items: []}

// 		await testDefinition(docUri, defaultPosition, completion);
// 	});
// 	testCounter++;
// });



// async function testDefinition(
// 	docUri: vscode.Uri,
// 	position : vscode.Position,
// 	expectedCompletionList: vscode.CompletionList
// ) {

// 	// Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
// 	const actualCompletionList = (await vscode.commands.executeCommand(
// 		'vscode.executeCompletionItemProvider',
// 		docUri,
// 		position,
// 	)) as CompletionResolve;

// 	assert.equal(actualCompletionList.items.length, expectedCompletionList.items.length);
	
// 	expectedCompletionList.items.forEach((expectedItem, i) => {
// 		const actualItem = actualCompletionList.items[i];
// 		assert.equal(actualItem.label, expectedItem.label);
// 		assert.equal(actualItem.kind, expectedItem.kind);
// 	});
// }
