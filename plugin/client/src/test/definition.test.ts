// /*
// Test Documention: https://code.visualstudio.com/api/references/commands
// Relevant Comman: vscode.executeDefinitionProvider
// Expected Output: Array of
// export interface LocationLink {
// 	originSelectionRange?: Range; //origin
// 	targetUri: Uri; //file of result
// 	targetRange: Range; //scope of result
// 	targetSelectionRange?: Range; //result
// }
// */

// //TODO: make test not case sensitive



// import * as vscode from 'vscode';
// import * as assert from 'assert';
// import { 
// 	getDocUri, 
// 	activate, 
// 	getWordPositionFromLine, 
// 	getWordRangeFromLineInEditor, 
// 	getWordRangeFromLineInFile} from './helper';

// var testCounter: number = 0
// var testFixtureFolderPath: String = 'InferrerExample/'
// let defaultPosition: vscode.Position = new vscode.Position(0,0)
// export type DefinitionResolve = vscode.Location[];



// describe('Definition test Sanity', () => {
// 	const docUri = getDocUri(testFixtureFolderPath + 'policy-space.pspace');

// 	it('Sanity Test' + testCounter.toString(), async () => {
// 		let range: vscode.Range = new vscode.Range(new vscode.Position(0,0), new vscode.Position(0,0))
// 		let definition: vscode.LocationLink[] = [{targetUri:docUri, targetRange:range}];;

// 		//await testDefinition(docUri, defaultPosition, definition);
// 	});
// 	testCounter++;
// });


// describe('Definition test Policy Space', () => {

// 	const docUri = getDocUri(testFixtureFolderPath + 'policy-space.pspace');

// 	it('Setup', async () => {
// 		await activate(docUri);
// 	})

// 	it('HumanDataType Test' + testCounter.toString(), async () => {
// 		let testSelectionRange: vscode.Range = getWordRangeFromLineInEditor("HumanDataType", 0);
// 		let position : vscode.Position = getWordPositionFromLine("HumanDataType", 0);
// 		let resultRange: vscode.Range = getWordRangeFromLineInEditor("HumanDataType", 1);

// 		let definitionResult: vscode.LocationLink[] = 
// 			builtDefinitionExpectedResultObject(testSelectionRange, docUri, resultRange);
// 		await testDefinition(docUri, position, definitionResult);

// 	});
// 	testCounter++;

// 	it('Harm Test' + testCounter.toString(), async () => {
// 		let testSelectionRange: vscode.Range = getWordRangeFromLineInEditor("Harm", 0);
// 		let position : vscode.Position = getWordPositionFromLine("Harm", 0);
// 		let resultRange: vscode.Range = getWordRangeFromLineInEditor("Harm", 2);

// 		let definitionResult: vscode.LocationLink[] = 
// 			builtDefinitionExpectedResultObject(testSelectionRange, docUri, resultRange);
// 		await testDefinition(docUri, position, definitionResult);
// 	});
// 	testCounter++;

// 	it('Encryption Test' + testCounter.toString(), async () => {
// 		let testSelectionRange: vscode.Range = getWordRangeFromLineInEditor("Encryption", 0);
// 		let position : vscode.Position = getWordPositionFromLine("Encryption", 0);
// 		let resultRange: vscode.Range = getWordRangeFromLineInEditor("Encryption", 3);


// 		let definitionResult: vscode.LocationLink[] = 
// 			builtDefinitionExpectedResultObject(testSelectionRange, docUri, resultRange);
// 		await testDefinition(docUri, position, definitionResult);
// 	});
// 	testCounter++;


// });


// describe('Definition test Decision Graph', () => {

// 	const docUriSource = getDocUri(testFixtureFolderPath + 'decision-graph.dg');
// 	const docUriTarget= getDocUri(testFixtureFolderPath + 'policy-space.pspace');

// 	it('HumanDataType Test' + testCounter.toString(), async () => {
// 		await activate(docUriSource);
// 		let testSelectionRange: vscode.Range = getWordRangeFromLineInEditor("HumanDataType", 0);
// 		let position : vscode.Position = getWordPositionFromLine("HumanDataType", 0);

// 		let resultRange: vscode.Range = await getWordRangeFromLineInFile("HumanDataType", 1, docUriTarget);

// 		let definitionResult: vscode.LocationLink[] = 
// 			builtDefinitionExpectedResultObject(testSelectionRange, docUriTarget, resultRange);
// 		await testDefinition(docUriSource, position, definitionResult);

// 	});
// 	testCounter++;

// 	it('Harm Test' + testCounter.toString(), async () => {
// 		await activate(docUriSource);
// 		let testSelectionRange: vscode.Range = getWordRangeFromLineInEditor("Harm", 23);
// 		let position : vscode.Position = getWordPositionFromLine("Harm", 23);
// 		let resultRange: vscode.Range = await getWordRangeFromLineInFile("Harm", 2, docUriTarget);

// 		let definitionResult: vscode.LocationLink[] = 
// 			builtDefinitionExpectedResultObject(testSelectionRange, docUriTarget, resultRange);
// 		await testDefinition(docUriSource, position, definitionResult);
// 	});
// 	testCounter++;

// 	it('major Test' + testCounter.toString(), async () => {
// 		await activate(docUriSource);
// 		let testSelectionRange: vscode.Range = getWordRangeFromLineInEditor("major", 25);
// 		let position : vscode.Position = getWordPositionFromLine("major", 25, 2);
// 		let resultRange: vscode.Range = await getWordRangeFromLineInFile("major", 2, docUriTarget);

// 		let definitionResult: vscode.LocationLink[] = 
// 			builtDefinitionExpectedResultObject(testSelectionRange, docUriTarget, resultRange);
// 		await testDefinition(docUriSource, position, definitionResult);
// 	});
// 	testCounter++;

// });


// describe('Definition test Value Inference', () => {
// 	const docUriSource = getDocUri(testFixtureFolderPath + 'valueInference.vi');
// 	const docUriTarget= getDocUri(testFixtureFolderPath + 'policy-space.pspace');


// 	it('clear Test' + testCounter.toString(), async () => {
// 		await activate(docUriSource);
// 		let testSelectionRange: vscode.Range = getWordRangeFromLineInEditor("clear", 1);
// 		let position : vscode.Position = getWordPositionFromLine("clear", 1);
// 		let resultRange: vscode.Range = await getWordRangeFromLineInFile("clear", 3, docUriTarget);

// 		let definitionResult: vscode.LocationLink[] = 
// 			builtDefinitionExpectedResultObject(testSelectionRange, docUriTarget, resultRange);
// 		await testDefinition(docUriSource, position, definitionResult);
// 	});
// 	testCounter++;

// 	it('HumanDataType Test' + testCounter.toString(), async () => {
// 		await activate(docUriSource);
// 		let testSelectionRange: vscode.Range = getWordRangeFromLineInEditor("HumanDataType", 2);
// 		let position : vscode.Position = getWordPositionFromLine("HumanDataType", 2);
// 		let resultRange: vscode.Range = await getWordRangeFromLineInFile("HumanDataType", 1, docUriTarget);

// 		let definitionResult: vscode.LocationLink[] = 
// 			builtDefinitionExpectedResultObject(testSelectionRange, docUriTarget, resultRange);
// 		await testDefinition(docUriSource, position, definitionResult);
// 	});
// 	testCounter++;

// 	it('Encryption Test' + testCounter.toString(), async () => {
// 		await activate(docUriSource);
// 		let testSelectionRange: vscode.Range = getWordRangeFromLineInEditor("Encryption", 0);
// 		let position : vscode.Position = getWordPositionFromLine("Encryption", 0);
// 		let resultRange: vscode.Range = await getWordRangeFromLineInFile("Encryption", 3, docUriTarget);

// 		let definitionResult: vscode.LocationLink[] = 
// 			builtDefinitionExpectedResultObject(testSelectionRange, docUriTarget, resultRange);
// 		await testDefinition(docUriSource, position, definitionResult);
// 	});
// 	testCounter++;

// });




// async function testDefinition(
// 	docUri: vscode.Uri,
// 	position : vscode.Position,
// 	expectedDefinitionList: vscode.LocationLink[]
// ) {

// 	// Executing the command `vscode.executeDefinitionProvider` to simulate triggering definition
// 	const actualDefinitionList = (await vscode.commands.executeCommand(
// 		'vscode.executeDefinitionProvider',
// 		docUri,
// 		position,
// 	)) as DefinitionResolve;

// 	assert.equal(actualDefinitionList.length, expectedDefinitionList.length);

// 	expectedDefinitionList.forEach((expectedItem, i) => {
// 		const actualItem = actualDefinitionList[i];
// 		if(actualItem.uri !== undefined && expectedItem.targetUri !== undefined)
// 			assert.equal(actualItem.uri.path, expectedItem.targetUri.path);
// 		if(actualItem.range !== undefined && expectedItem.targetSelectionRange !== undefined)
// 			assert(actualItem.range.isEqual(expectedItem.targetSelectionRange));
// 	});
// }


// const builtDefinitionExpectedResultObject = 
// (testSelectionRange: vscode.Range, docUri: vscode.Uri, resultRange: vscode.Range) => {
// 	return [
// 		{originSelectionRange: testSelectionRange, targetUri: docUri, targetRange: resultRange, targetSelectionRange: resultRange}
// 	];
// }