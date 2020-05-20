/*
Test Documention: https://code.visualstudio.com/api/references/commands
Relevant Comman: vscode.executeReferenceProvider
Expected Output: Array of
export interface Location {
    uri: DocumentUri; //file of result
    range: Range; //result range
}
*/

import * as path from 'path';
import * as vscode from 'vscode';
import * as assert from 'assert';
import { 
	getDocUri, 
	activate, 
	getWordPositionFromLine, 
	getWordRangeFromLineInEditor,} from './helper';

var testCounter: number = 0
var testFixtureFolderPath: string = 'InferrerExample/'
export type ReferenseResolve = vscode.Location[];

const docUriPS = getDocUri(testFixtureFolderPath + 'policy-space.pspace');
const docUriDG = getDocUri(testFixtureFolderPath + 'decision-graph.dg');
const docUriVI = getDocUri(testFixtureFolderPath + 'valueInference.vi');
let locationPS : vscode.Location[];
let locationDG : vscode.Location[];
let locationVI : vscode.Location[];


describe('Renference E2E test Policy Space', () => {

	it('Human (1) Test' + testCounter.toString(), async () => {
		let wordToReference= "Human"
		await activate(docUriPS);
		let position : vscode.Position = getWordPositionFromLine(wordToReference, 0);
		locationPS = [createLocation(docUriPS, getWordRangeFromLineInEditor(wordToReference, 0))];
		
		locationDG = undefined;

		locationVI = undefined;
		
		let expectedLocations = builtReferenceExpectedResultObject(locationPS, locationDG, locationVI);

		await testReferense(docUriPS, position, expectedLocations);
	});
	testCounter++;

	it('major (3) Test' + testCounter.toString(), async () => {
		let wordToReference= "major"
		await activate(docUriPS);
		let position : vscode.Position = getWordPositionFromLine(wordToReference, 2);
		locationPS = [createLocation(docUriPS, getWordRangeFromLineInEditor(wordToReference, 2))];
		
		await activate(docUriDG);
		locationDG = [createLocation(docUriDG, getWordRangeFromLineInEditor(wordToReference, 25))];

		await activate(docUriVI);
		locationVI = [createLocation(docUriVI, getWordRangeFromLineInEditor(wordToReference, 3))];
		
		let expectedLocations = builtReferenceExpectedResultObject(locationPS, locationDG, locationVI);

		await activate(docUriPS);
		await testReferense(docUriPS, position, expectedLocations);
	});
	testCounter++;
});

describe('Referense E2E test Decision Graph', () => {

	it('HumanDataType (9) Test' + testCounter.toString(), async () => {
		let wordToReference= "HumanDataType"
		await activate(docUriDG);
		let position : vscode.Position = getWordPositionFromLine(wordToReference, 0);

		await activate(docUriPS);
		locationPS = [
			createLocation(docUriPS, getWordRangeFromLineInEditor(wordToReference, 0)),
			createLocation(docUriPS, getWordRangeFromLineInEditor(wordToReference, 1))];
		
		await activate(docUriDG);
		locationDG = [
			createLocation(docUriDG, getWordRangeFromLineInEditor(wordToReference, 0)),
			createLocation(docUriDG, getWordRangeFromLineInEditor(wordToReference, 11)),
			createLocation(docUriDG, getWordRangeFromLineInEditor(wordToReference, 12)),
			createLocation(docUriDG, getWordRangeFromLineInEditor(wordToReference, 13))];

		await activate(docUriVI);
		locationVI = [
			createLocation(docUriVI, getWordRangeFromLineInEditor(wordToReference, 1)),
			createLocation(docUriVI, getWordRangeFromLineInEditor(wordToReference, 2)),
			createLocation(docUriVI, getWordRangeFromLineInEditor(wordToReference, 3))];
		
		let expectedLocations = builtReferenceExpectedResultObject(locationPS, locationDG, locationVI);

		await activate(docUriDG);
		await testReferense(docUriDG, position, expectedLocations);
	});
	testCounter++;

}); 

describe('Referense E2E test Value Inference', () => {

	it('serverSide (2) Test' + testCounter.toString(), async () => {
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
	
	it('medium (3) Test' + testCounter.toString(), async () => {
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


async function testReferense(
	docUri: vscode.Uri,
	position : vscode.Position,
	expectedReferenseList: vscode.Location[]
) {

	// Executing the command `vscode.executeReferenceProvider` to simulate triggering reference
	const actualReferenseList = (await vscode.commands.executeCommand(
		'vscode.executeReferenceProvider',
		docUri,
		position,
	)) as ReferenseResolve;
	
	assert.equal(actualReferenseList.length, expectedReferenseList.length);
	
	actualReferenseList.forEach((location: vscode.Location) => {
		var found = false;
		for(var i = 0; i < expectedReferenseList.length; i++) {
			if(location.range.isEqual(expectedReferenseList[i].range)
				&& location.uri.path == expectedReferenseList[i].uri.path){
				found = true;
				break;
			}
		}
		if (!found) 
			assert.fail("failed, location is missing", location)
	});
}

export async function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

const createLocation = (uri: vscode.Uri, range: vscode.Range) : vscode.Location=> {
	return new vscode.Location(uri, range)
}

const builtReferenceExpectedResultObject = (
	locationPS: vscode.Location[], 
	locationDG: vscode.Location[], 
	locationVI: vscode.Location[]) : vscode.Location[]=> {

	let result: vscode.Location[] = []
	if (locationPS !== undefined)
		locationPS.forEach(l => result.push(l))
	if (locationDG !== undefined)
		locationDG.forEach(l => result.push(l))
	if (locationVI !== undefined)
		locationVI.forEach(l => result.push(l))
	return result
}
