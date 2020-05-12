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
var testFixtureFolderPath: String = 'complition/'
let defaultPosition: vscode.Position = new vscode.Position(0,0)
export type CompletionResolve = vscode.CompletionList;

describe('Complition test Policy Space', () => {
	const docUri = getDocUri(testFixtureFolderPath + 'ps.pspace');

	it('Hu Test' + testCounter.toString(), async () => {
		await activate(docUri);
		let position : vscode.Position = getWordFinishPositionFromLine("Hu", 1);
		
		let complitionWordList = ["Human", "HumanDataType"]
		await testDefinition(docUri, position, complitionWordList);
	});
	testCounter++;

	it('H Test' + testCounter.toString(), async () => {
		await activate(docUri);
		let position : vscode.Position = getWordFinishPositionFromLine("H", 1);
		
		let complitionWordList = ["Human", "HumanDataType", "Harm"]
		await testDefinition(docUri, position, complitionWordList);
	});
	testCounter++;
});


describe('Complition test Decision Graph', () => {
	const docUri = getDocUri(testFixtureFolderPath + 'dg.dg');

	it('a Test' + testCounter.toString(), async () => {
		await activate(docUri);
		let position : vscode.Position = getWordFinishPositionFromLine("a", 1);
		
		let complitionWordList = ["ask", "answers"]
		await testDefinition(docUri, position, complitionWordList);
	});
	testCounter++;
});

describe('Complition test Value Inference', () => {
	const docUri = getDocUri(testFixtureFolderPath + 'vi.vi');

	it('Harm= Test' + testCounter.toString(), async () => {
		await activate(docUri);
		let position : vscode.Position = getWordFinishPositionFromLine("Harm=", 2);
		
		let complitionWordList = ["none", "minor", "medium", "major"]
		await testDefinition(docUri, position, complitionWordList);
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
