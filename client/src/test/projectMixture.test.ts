/*
Project Mixture Test

This tests file test mixuting of 2 project on the same vscode.
Lets say, if one project is open in the editor, 
and a file from another project is opened in the same aditor as well, 
this tests make sure there isn't any mixture between them.

Our main project open in the vscode is InferrerExample,
The mixture project is InferrerExampleClone.


*/


import * as vscode from 'vscode';
import * as assert from 'assert';
import { 
	getDocUri, 
	activate, 
	getWordPositionFromLine, 
	getWordRangeFromLineInEditor, 
	getWordRangeFromLineInFile,
	sleep} from './helper';
import { builtDefinitionExpectedResultObject, testDefinition } from './definition.test';

var testCounter: number = 0
var cloneTestFixtureFolderPath: String = 'InferrerExampleClone/'
let defaultPosition: vscode.Position = new vscode.Position(0,0)
export type DefinitionResolve = vscode.Location[];



describe('Project Mixture E2E test Policy Space open', () => {

	const docUri = getDocUri(cloneTestFixtureFolderPath + 'policy-space.pspace');

	it('Setup', async () => {
		await activate(docUri);
	})

	it('Definition same file Test' + testCounter.toString(), async () => {
		let testSelectionRange: vscode.Range = getWordRangeFromLineInEditor("HumanDataType", 0);
		let position : vscode.Position = getWordPositionFromLine("HumanDataType", 0);
		let resultRange: vscode.Range = getWordRangeFromLineInEditor("HumanDataType", 1);

		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUri, resultRange);
		await testDefinition(docUri, position, definitionResult);
	});
	testCounter++;


});