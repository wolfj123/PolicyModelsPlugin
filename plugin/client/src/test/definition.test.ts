/*
Test Documention: https://code.visualstudio.com/api/references/commands
Relevant Comman: vscode.executeDefinitionProvider
Expected Output:
export interface LocationLink {
	originSelectionRange?: Range; //origin
	targetUri: Uri; //file of result
	targetRange: Range; //result
	targetSelectionRange?: Range; //scope of result
}
*/



import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate, editor} from './helper';

var testCounter: number = 0
var testFixtureFolderPath: String = 'InferrerExample\\'
let defaultPosition: vscode.Position = new vscode.Position(0,0)


describe('Definition test Sanity', () => {
	// const docUri = getDocUri('simple\\burrito-with-call.dg');
	const docUri = getDocUri(testFixtureFolderPath + 'policy-space.pspace');

	it('Sanity Test' + testCounter.toString(), async () => {
		
		let range: vscode.Range = new vscode.Range(new vscode.Position(0,0), new vscode.Position(1,1))
		let definition: vscode.LocationLink[] = [{targetUri:docUri, targetRange:range}]
		let position: vscode.Position = new vscode.Position(0,0)
		await testDefinition(docUri, position, definition);
	});
	testCounter++;
});

describe('Definition test Policy Space', () => {

	const docUri = getDocUri(testFixtureFolderPath + 'policy-space.pspace');

	it('HumanDataType Test' + testCounter.toString(), async () => {
		let testSelectionRange: vscode.Range = getWordRangeFromLine("HumanDataType", 1);
		let resultRange: vscode.Range = getWordRangeFromLine("HumanDataType", 0);

		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUri, resultRange)
		await testDefinition(docUri, defaultPosition, definitionResult);

	});
	testCounter++;

	it('Harm Test' + testCounter.toString(), async () => {
		let testSelectionRange: vscode.Range = getWordRangeFromLine("Harm", 2);
		let resultRange: vscode.Range = getWordRangeFromLine("Harm", 0);

		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUri, resultRange)
		await testDefinition(docUri, defaultPosition, definitionResult);
	});
	testCounter++;

	it('Encryption Test' + testCounter.toString(), async () => {
		let testSelectionRange: vscode.Range = getWordRangeFromLine("Encryption", 3);
		let resultRange: vscode.Range = getWordRangeFromLine("Encryption", 0);

		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUri, resultRange)
		await testDefinition(docUri, defaultPosition, definitionResult);
	});
	testCounter++;


});


describe('Definition test Decision Graph', () => {

});

describe('Definition test Value Inference', () => {

});




async function testDefinition(
	docUri: vscode.Uri,
	position : vscode.Position,
	expectedDefinitionList: vscode.LocationLink[]
) {
	await activate(docUri);

	// Executing the command `vscode.executeDefinitionProvider` to simulate triggering definition
	const actualDefinitionList = (await vscode.commands.executeCommand(
		'vscode.executeDefinitionProvider',
		docUri,
		position,
	)) as  vscode.LocationLink[];

	assert.equal(actualDefinitionList.length, expectedDefinitionList.length);

	// expectedDefinitionList.forEach((expectedItem, i) => {
	// 	const actualItem = actualDefinitionList[i];
	// 	assert.equal(actualItem.originSelectionRange, expectedItem.originSelectionRange);
	// 	assert.equal(actualItem.targetUri, expectedItem.targetUri);
	// 	assert.equal(actualItem.targetRange, expectedItem.targetRange);
	// 	assert.equal(actualItem.targetSelectionRange, expectedItem.targetSelectionRange);
	// });
}

const getWordRangeFromLine = (word: string, line:number) => {
	var firstLine = editor.document.lineAt(line);
	var wordStartPosition: vscode.Position = 
		editor.document.positionAt(editor.document.offsetAt(firstLine.range.start) + firstLine.text.indexOf(word) + 1);
	var wordEndPosition: vscode.Position = 
		editor.document.positionAt(editor.document.offsetAt(wordStartPosition) + word.length);
	return new vscode.Range(wordStartPosition, wordEndPosition)
}

const builtDefinitionExpectedResultObject = 
(testSelectionRange: vscode.Range, docUri: vscode.Uri, resultRange: vscode.Range) => {
	return [
		{originSelectionRange: testSelectionRange, targetUri: docUri, targetRange: resultRange}
	];
}