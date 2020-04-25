/*
Test Documention: https://code.visualstudio.com/api/references/commands
Relevant Comman: vscode.executeDefinitionProvider
Expected Output:
export interface LocationLink {
	originSelectionRange?: Range; //origin
	targetUri: Uri; //file of result
	targetRange: Range; //scope of result
	targetSelectionRange?: Range; //result
}
*/

/*
TODO:
1) make test not case sensitive
2) ensure all line numbers!
*/



import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate, editor} from './helper';

var testCounter: number = 0
var testFixtureFolderPath: String = 'InferrerExample\\'
let defaultPosition: vscode.Position = new vscode.Position(0,0)
export type DefinitionResolve = vscode.Location[];



describe('Definition test Sanity', () => {
	const docUri = getDocUri(testFixtureFolderPath + 'policy-space.pspace');

	it('Setup', async () => {
		await activate(docUri)
	})

	it('Sanity Test' + testCounter.toString(), async () => {
		let range: vscode.Range = new vscode.Range(new vscode.Position(0,0), new vscode.Position(0,0))
		let definition: vscode.LocationLink[] = [{targetUri:docUri, targetRange:range}]

		await testDefinition(docUri, defaultPosition, definition);
	});
	testCounter++;
});

describe('Definition test Policy Space', () => {

	const docUri = getDocUri(testFixtureFolderPath + 'policy-space.pspace');

	it('Setup', async () => {
		await activate(docUri)
	})

	it('HumanDataType Test' + testCounter.toString(), async () => {
		let testSelectionRange: vscode.Range = getWordRangeFromLine("HumanDataType", 1);
		let position : vscode.Position = getWordPositionFromLine("HumanDataType", 1);
		let resultRange: vscode.Range = getWordRangeFromLine("HumanDataType", 0);

		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUri, resultRange)
		await testDefinition(docUri, position, definitionResult);

	});
	testCounter++;

	it('Harm Test' + testCounter.toString(), async () => {
		let testSelectionRange: vscode.Range = getWordRangeFromLine("Harm", 2);
		let position : vscode.Position = getWordPositionFromLine("Harm", 2);
		let resultRange: vscode.Range = getWordRangeFromLine("Harm", 0);

		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUri, resultRange)
		await testDefinition(docUri, position, definitionResult);
	});
	testCounter++;

	it('Encryption Test' + testCounter.toString(), async () => {
		let testSelectionRange: vscode.Range = getWordRangeFromLine("Encryption", 3);
		let position : vscode.Position = getWordPositionFromLine("Encryption", 3);
		let resultRange: vscode.Range = getWordRangeFromLine("Encryption", 0);


		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUri, resultRange)
		await testDefinition(docUri, position, definitionResult);
	});
	testCounter++;


});


describe('Definition test Decision Graph', () => {

	const docUriSource = getDocUri(testFixtureFolderPath + 'decision-graph.dg');
	const docUriTarget= getDocUri(testFixtureFolderPath + 'policy-space.pspace');

	it('Setup', async () => {
		await activate(docUriSource)
	})

	it('HumanDataType Test' + testCounter.toString(), async () => {
		let testSelectionRange: vscode.Range = getWordRangeFromLine("HumanDataType", 0);
		let position : vscode.Position = getWordPositionFromLine("HumanDataType", 1);
		let resultRange: vscode.Range = getWordRangeFromLine("HumanDataType", 1);

		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUriTarget, resultRange)
		await testDefinition(docUriSource, position, definitionResult);

	});
	testCounter++;

	it('Harm Test' + testCounter.toString(), async () => {
		let testSelectionRange: vscode.Range = getWordRangeFromLine("Harm", 24);
		let position : vscode.Position = getWordPositionFromLine("Harm", 24);
		let resultRange: vscode.Range = getWordRangeFromLine("Harm", 2);

		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUriTarget, resultRange)
		await testDefinition(docUriSource, position, definitionResult);
	});
	testCounter++;

	it('Encryption Test' + testCounter.toString(), async () => {
		let testSelectionRange: vscode.Range = getWordRangeFromLine("major", 26);
		let position : vscode.Position = getWordPositionFromLine("major", 26);
		let resultRange: vscode.Range = getWordRangeFromLine("major", 3);


		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUriTarget, resultRange)
		await testDefinition(docUriSource, position, definitionResult);
	});
	testCounter++;

});

describe('Definition test Value Inference', () => {
	const docUriSource = getDocUri(testFixtureFolderPath + 'valueInference.vi');
	const docUriTarget= getDocUri(testFixtureFolderPath + 'policy-space.pspace');

	it('Setup', async () => {
		await activate(docUriSource)
	})

	it('clear Test' + testCounter.toString(), async () => {
		let testSelectionRange: vscode.Range = getWordRangeFromLine("clear", 1);
		let position : vscode.Position = getWordPositionFromLine("clear", 1);
		let resultRange: vscode.Range = getWordRangeFromLine("clear", 3);

		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUriTarget, resultRange)
		await testDefinition(docUriSource, position, definitionResult);
	});
	testCounter++;

	it('HumanDataType Test' + testCounter.toString(), async () => {
		let testSelectionRange: vscode.Range = getWordRangeFromLine("HumanDataType", 2);
		let position : vscode.Position = getWordPositionFromLine("HumanDataType", 2);
		let resultRange: vscode.Range = getWordRangeFromLine("HumanDataType", 1);

		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUriTarget, resultRange)
		await testDefinition(docUriSource, position, definitionResult);
	});
	testCounter++;

	it('Encryption Test' + testCounter.toString(), async () => {
		let testSelectionRange: vscode.Range = getWordRangeFromLine("Encryption", 0);
		let position : vscode.Position = getWordPositionFromLine("Encryption", 0);
		let resultRange: vscode.Range = getWordRangeFromLine("Encryption", 3);

		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUriTarget, resultRange)
		await testDefinition(docUriSource, position, definitionResult);
	});
	testCounter++;

});




async function testDefinition(
	docUri: vscode.Uri,
	position : vscode.Position,
	expectedDefinitionList: vscode.LocationLink[]
) {

	// Executing the command `vscode.executeDefinitionProvider` to simulate triggering definition
	const actualDefinitionList = (await vscode.commands.executeCommand(
		'vscode.executeDefinitionProvider',
		docUri,
		position,
	)) as DefinitionResolve;

	assert.equal(actualDefinitionList.length, expectedDefinitionList.length);

	expectedDefinitionList.forEach((expectedItem, i) => {
		const actualItem = actualDefinitionList[i];
		assert.equal(actualItem.uri, expectedItem.targetUri);
		assert.equal(actualItem.range, expectedItem.targetSelectionRange);
	});
}

const getWordRangeFromLine = (word: string, line:number) : vscode.Range => {
	var firstLine = editor.document.lineAt(line);
	var wordStartPosition: vscode.Position = 
		editor.document.positionAt(editor.document.offsetAt(firstLine.range.start) + firstLine.text.indexOf(word) + 1);
	var wordEndPosition: vscode.Position = 
		editor.document.positionAt(editor.document.offsetAt(wordStartPosition) + word.length);
	return new vscode.Range(wordStartPosition, wordEndPosition)
}

const getWordPositionFromLine = (word: string, line:number) : vscode.Position => {
	var firstLine = editor.document.lineAt(line);
	return editor.document.positionAt(editor.document.offsetAt(firstLine.range.start) + firstLine.text.indexOf(word) + 1);

}

const builtDefinitionExpectedResultObject = 
(testSelectionRange: vscode.Range, docUri: vscode.Uri, resultRange: vscode.Range) => {
	return [
		{originSelectionRange: testSelectionRange, targetUri: docUri, targetRange: resultRange, targetSelectionRange: resultRange}
	];
}