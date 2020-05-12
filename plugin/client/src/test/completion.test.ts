/*
Test Documention: https://code.visualstudio.com/api/references/commands
Relevant Comman: vscode.executeCompletionItemProvider
Expected Output: Array of
export class CompletionList {
	isIncomplete?: boolean;
	items: CompletionItem[];
	constructor(items?: CompletionItem[], isIncomplete?: boolean);
}
*/


import * as vscode from 'vscode';
import * as assert from 'assert';
import { 
	getDocUri, 
	activate, 
	getWordFinishPositionFromLine} from './helper';

var testCounter: number = 0
var testFixtureFolderPath: String = 'completion/'
let defaultPosition: vscode.Position = new vscode.Position(0,0)
export type CompletionResolve = vscode.CompletionList;

describe('Completion test Policy Space', () => {
	const docUri = getDocUri(testFixtureFolderPath + 'ps.pspace');

	it('BigHu Test' + testCounter.toString(), async () => {
		await activate(docUri);
		let position : vscode.Position = getWordFinishPositionFromLine("BigHu", 1);
		
		let completionWordList = ["BigHuman", "BigHumanDataType"]
		await testDefinition(docUri, position, completionWordList);
	});
	testCounter++;

	it('BigH Test' + testCounter.toString(), async () => {
		await activate(docUri);
		let position : vscode.Position = getWordFinishPositionFromLine("BigH", 1);
		
		let completionWordList = ["BigHuman", "BigHumanDataType", "BigHarm"]
		await testDefinition(docUri, position, completionWordList);
	});
	testCounter++;
});


describe('Completion test Decision Graph', () => {
	const docUri = getDocUri(testFixtureFolderPath + 'dg.dg');

	it(' a Test' + testCounter.toString(), async () => {
		await activate(docUri);
		let position : vscode.Position = getWordFinishPositionFromLine(" a", 1);
		
		let completionWordList = ["ask", "answers"]
		await testDefinition(docUri, position, completionWordList);
	});
	testCounter++;
});

describe('Completion test Value Inference', () => {
	const docUri = getDocUri(testFixtureFolderPath + 'vi.vi');

	it('BigHarm= Test' + testCounter.toString(), async () => {
		await activate(docUri);
		let position : vscode.Position = getWordFinishPositionFromLine("BigHarm=", 2);
		
		let completionWordList = ["bnone", "bminor", "bmedium", "bmajor"]
		await testDefinition(docUri, position, completionWordList);
	});
	testCounter++;
});

async function testDefinition(
	docUri: vscode.Uri,
	position : vscode.Position,
	expectedCompletionList: string[]
) {

	// Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
	const actualCompletionList = (await vscode.commands.executeCommand(
		'vscode.executeCompletionItemProvider',
		docUri,
		position,
	)) as CompletionResolve;

	// assert.equal(actualCompletionList.items.length, expectedCompletionList.length);
	// actualCompletionList.items.forEach((actualItem, i) => {
	// 	assert(expectedCompletionList.includes(actualItem.label));
	// });
}
