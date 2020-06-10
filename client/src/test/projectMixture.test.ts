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
	getWordRangeFromLineInFile,} from './helper';
import { builtDefinitionExpectedResultObject, testDefinition } from './definition.test';
import { createEntry, builtRenamenExpectedResultObject, testRename } from './rename.test';
import { createLocation, builtReferenceExpectedResultObject, testReferense } from './reference.test';

var testCounter: number = 0
var cloneTestFixtureFolderPath: String = 'InferrerExampleClone/'
export type DefinitionResolve = vscode.Location[];



describe('Project Mixture E2E test Policy Space open', () => {

	const docUri = getDocUri(cloneTestFixtureFolderPath + 'policy-space.pspace');

	it('Setup', async () => {
		await activate(docUri);
	})

	it('Definition HumanDataType same file Test' + testCounter.toString(), async () => {
		let testSelectionRange: vscode.Range = getWordRangeFromLineInEditor("HumanDataType", 0);
		let position : vscode.Position = getWordPositionFromLine("HumanDataType", 0);
		let resultRange: vscode.Range = getWordRangeFromLineInEditor("HumanDataType", 1);

		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUri, resultRange);
		await testDefinition(docUri, position, definitionResult);
	});
	testCounter++;

	it('Rename Harm same file Test' + testCounter.toString(), async () => {
		let wordToRename = "Harm"
		let newWordRename = "Harmy"
		let entryPS = createEntry(docUri, 
			[getWordRangeFromLineInEditor(wordToRename, 0),
			getWordRangeFromLineInEditor(wordToRename, 2)],
			newWordRename);
		

		let renameWorkSpace = builtRenamenExpectedResultObject([entryPS]);

		let position : vscode.Position = getWordPositionFromLine(wordToRename, 0);

		await testRename(docUri, position, renameWorkSpace, newWordRename);
	});
	testCounter++;

});



describe('Project Mixture E2E test Decision Graph', () => {

	const docUriSource = getDocUri(cloneTestFixtureFolderPath + 'decision-graph.dg');
	const docUriTarget= getDocUri(cloneTestFixtureFolderPath + 'policy-space.pspace');

	it('Definition HumanDataType other file Test' + testCounter.toString(), async () => {
		await activate(docUriSource);

		let testSelectionRange: vscode.Range = getWordRangeFromLineInEditor("HumanDataType", 0);
		let position : vscode.Position = getWordPositionFromLine("HumanDataType", 0);

		let resultRange: vscode.Range = await getWordRangeFromLineInFile("HumanDataType", 1, docUriTarget);

		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUriTarget, resultRange);
		await testDefinition(docUriSource, position, definitionResult);

	});
	testCounter++;

	it('Definition Harm other file Test' + testCounter.toString(), async () => {
		await activate(docUriSource);

		let testSelectionRange: vscode.Range = getWordRangeFromLineInEditor("Harm", 23);
		let position : vscode.Position = getWordPositionFromLine("Harm", 23);

		let resultRange: vscode.Range = await getWordRangeFromLineInFile("Harm", 2, docUriTarget);

		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUriTarget, resultRange);
		await testDefinition(docUriSource, position, definitionResult);
	});
	testCounter++;

	it('Definition major other file Test' + testCounter.toString(), async () => {
		await activate(docUriSource);

		let testSelectionRange: vscode.Range = getWordRangeFromLineInEditor("major", 25);
		let position : vscode.Position = getWordPositionFromLine("major", 25, 2);
		let resultRange: vscode.Range = await getWordRangeFromLineInFile("major", 2, docUriTarget);

		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUriTarget, resultRange);
		await testDefinition(docUriSource, position, definitionResult);
	});
	testCounter++;

	const docUriPS = getDocUri(cloneTestFixtureFolderPath + 'policy-space.pspace');
	const docUriDG = getDocUri(cloneTestFixtureFolderPath + 'decision-graph.dg');
	const docUriVI = getDocUri(cloneTestFixtureFolderPath + 'valueInference.vi');

	it('Setup', async () => {
		await activate(docUriPS);
	})

	it('Rename HumanDataType all files Test' + testCounter.toString(), async () => {
		let wordToRename = "HumanDataType"
		let newWordRename = "HumanDT"
		let entryPS = createEntry(docUriPS, 
			[getWordRangeFromLineInEditor(wordToRename, 0), 
			getWordRangeFromLineInEditor(wordToRename, 1)],
			newWordRename);
		
		await activate(docUriDG);

		let entryDG = createEntry(docUriDG, 
			[getWordRangeFromLineInEditor(wordToRename, 0), 
			getWordRangeFromLineInEditor(wordToRename, 11),
			getWordRangeFromLineInEditor(wordToRename, 12),
			getWordRangeFromLineInEditor(wordToRename, 13)],
			newWordRename);

		await activate(docUriVI);

		let entryVI = createEntry(docUriVI, 
			[getWordRangeFromLineInEditor(wordToRename, 1), 
			getWordRangeFromLineInEditor(wordToRename, 2),
			getWordRangeFromLineInEditor(wordToRename, 3)],
			newWordRename);
		
		await activate(docUriDG);

		let renameWorkSpace = builtRenamenExpectedResultObject([entryPS, entryDG, entryVI]);

		let position : vscode.Position = getWordPositionFromLine(wordToRename, 0);

		await testRename(docUriDG, position, renameWorkSpace, newWordRename);
	});
	testCounter++;

});


describe('Project Mixture E2E test Value Inference', () => {
	const docUriSource = getDocUri(cloneTestFixtureFolderPath + 'valueInference.vi');
	const docUriTarget= getDocUri(cloneTestFixtureFolderPath + 'policy-space.pspace');


	it('Definition clear other file Test' + testCounter.toString(), async () => {
		await activate(docUriSource);
		let testSelectionRange: vscode.Range = getWordRangeFromLineInEditor("clear", 1);
		let position : vscode.Position = getWordPositionFromLine("clear", 1);
		let resultRange: vscode.Range = await getWordRangeFromLineInFile("clear", 3, docUriTarget);

		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUriTarget, resultRange);
		await testDefinition(docUriSource, position, definitionResult);
	});
	testCounter++;

	it('Definition HumanDataType other file Test' + testCounter.toString(), async () => {
		await activate(docUriSource);
		let testSelectionRange: vscode.Range = getWordRangeFromLineInEditor("HumanDataType", 2);
		let position : vscode.Position = getWordPositionFromLine("HumanDataType", 2);
		let resultRange: vscode.Range = await getWordRangeFromLineInFile("HumanDataType", 1, docUriTarget);

		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUriTarget, resultRange);
		await testDefinition(docUriSource, position, definitionResult);
	});
	testCounter++;

	it('Definition Encryption other file Test' + testCounter.toString(), async () => {
		await activate(docUriSource);
		let testSelectionRange: vscode.Range = getWordRangeFromLineInEditor("Encryption", 0);
		let position : vscode.Position = getWordPositionFromLine("Encryption", 0);
		let resultRange: vscode.Range = await getWordRangeFromLineInFile("Encryption", 3, docUriTarget);

		let definitionResult: vscode.LocationLink[] = 
			builtDefinitionExpectedResultObject(testSelectionRange, docUriTarget, resultRange);
		await testDefinition(docUriSource, position, definitionResult);
	});
	testCounter++;




	const docUriPS = getDocUri(cloneTestFixtureFolderPath + 'policy-space.pspace');
	const docUriDG = getDocUri(cloneTestFixtureFolderPath + 'decision-graph.dg');
	const docUriVI = getDocUri(cloneTestFixtureFolderPath + 'valueInference.vi');
	let locationPS : vscode.Location[];
	let locationDG : vscode.Location[];
	let locationVI : vscode.Location[];
	
	it('All Reference serverSide (2) Test' + testCounter.toString(), async () => {
		let wordToReference= "serverSide"
		await activate(docUriVI);
		let position : vscode.Position = getWordPositionFromLine(wordToReference, 2);

		await activate(docUriPS);
		locationPS = [createLocation(docUriPS, getWordRangeFromLineInEditor(wordToReference, 3))];
		
		locationDG = undefined;

		await activate(docUriVI);
		locationVI = [createLocation(docUriVI, getWordRangeFromLineInEditor(wordToReference, 2))];
		
		let expectedLocations = builtReferenceExpectedResultObject(locationPS, locationDG, locationVI);

		await testReferense(docUriVI, position, expectedLocations);
	});
	testCounter++;
	
	it('All Reference medium (3) Test' + testCounter.toString(), async () => {
		let wordToReference= "medium"
		await activate(docUriVI);
		let position : vscode.Position = getWordPositionFromLine(wordToReference, 2);

		await activate(docUriPS);
		locationPS = [createLocation(docUriPS, getWordRangeFromLineInEditor(wordToReference, 2))];
		
		await activate(docUriDG);
		locationDG = [createLocation(docUriDG, getWordRangeFromLineInEditor(wordToReference, 24))];

		await activate(docUriVI);
		locationVI = [createLocation(docUriVI, getWordRangeFromLineInEditor(wordToReference, 2))];
		
		let expectedLocations = builtReferenceExpectedResultObject(locationPS, locationDG, locationVI);

		await testReferense(docUriVI, position, expectedLocations);
	});
	testCounter++;

});
