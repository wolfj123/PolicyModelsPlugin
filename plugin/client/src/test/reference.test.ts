// /*
// Test Documention: https://code.visualstudio.com/api/references/commands
// Relevant Comman: vscode.executeReferenceProvider
// Expected Output: Array of
// export interface Location {
//     uri: DocumentUri; //file of result
//     range: Range; //result
// }
// */

// import * as path from 'path';
// import * as vscode from 'vscode';
// import * as assert from 'assert';
// import { 
// 	getDocUri, 
// 	activate, 
// 	getWordPositionFromLine, 
// 	getWordRangeFromLineInEditor, 
// 	getAllWordLocationsFromFilesInDir,
// 	// getAllFilesInFolder,
// 	defaultRange,
// 	getDocPath,
// 	readAllCodeFilesInDirectory} from './helper';

// var testCounter: number = 0
// var testFixtureFolderPath: string = 'InferrerExample\\'
// let defaultPosition: vscode.Position = new vscode.Position(0,0)
// export type ReferenseResolve = vscode.Location[];

// describe('Referense test Sanity', () => {
// 	const docUri = getDocUri(testFixtureFolderPath + 'policy-space.pspace');

// 	// it('Setup', async () => {
// 	// 	await activate(docUri);
// 	// })

// 	it('Sanity Test' + testCounter.toString(), async () => {
// 		let range: vscode.Range = new vscode.Range(new vscode.Position(0,0), new vscode.Position(0,0))
// 		let definition: vscode.Location[] = [{uri:docUri, range:range}];

// 		let pathi = getDocPath("InferrerExample")
// 		let files = readAllCodeFilesInDirectory(pathi)

// 		let testSelectionRange: vscode.Range[]

// 		// await testReferense(docUri, defaultPosition, definition);
// 	});
// 	testCounter++;
// });


// describe('Referense test Policy Space', () => {

// 	const docUri = getDocUri(testFixtureFolderPath + 'policy-space.pspace');

// 	it('Setup', async () => {
// 		await activate(docUri);
// 	})

// 	it('Human (4) Test' + testCounter.toString(), async () => {
// 		let position : vscode.Position = getWordPositionFromLine("Human", 0);
// 		let resultRanges: {} = 
// 			await getAllWordLocationsFromFilesInDir("Human", getDocPath("InferrerExample"), testFixtureFolderPath)
		
// 		let referenceResult: vscode.Location[] = await builtReferenceExpectedResultObject(resultRanges)
// 		await testReferense(docUri, position, referenceResult);
// 	});
// 	testCounter++;
// /*
// 	// the word from the decision graph is wrong
// 	it('major (3) Test' + testCounter.toString(), async () => {
// 		let position : vscode.Position = getWordPositionFromLine("major", 2);
// 		let resultRanges: {} = 
// 			await getAllWordLocationsFromFilesInDir("major", getDocPath("InferrerExample"), testFixtureFolderPath)
		
// 		let referenceResult: vscode.Location[] = await builtReferenceExpectedResultObject(resultRanges)
// 		await testReferense(docUri, position, referenceResult);
// 	});
// 	testCounter++;
// */

// });


// describe('Referense test Decision Graph', () => {

// 	const docUri = getDocUri(testFixtureFolderPath + 'decision-graph.dg');

// 	it('Setup', async () => {
// 		await activate(docUri);
// 	})

// 	it('HumanDataType (9) Test' + testCounter.toString(), async () => {
// 		let position : vscode.Position = getWordPositionFromLine("HumanDataType", 0);
// 		let resultRanges: {} = 
// 			await getAllWordLocationsFromFilesInDir("HumanDataType", getDocPath("InferrerExample"), testFixtureFolderPath)
		
// 		let referenceResult: vscode.Location[] = await builtReferenceExpectedResultObject(resultRanges)
// 		await testReferense(docUri, position, referenceResult);
// 	});
// 	testCounter++;

// });

// /*
// describe('Referense test Value Inference', () => {
// 	const docUri = getDocUri(testFixtureFolderPath + 'valueInference.vi');

// 	it('Setup', async () => {
// 		await activate(docUri);
// 	})

// 	it('serverSide (2) Test' + testCounter.toString(), async () => {
// 		let position : vscode.Position = getWordPositionFromLine("serverSide", 2);
// 		let resultRanges: {} = 
// 			await getAllWordLocationsFromFilesInDir("serverSide", getDocPath("InferrerExample"), testFixtureFolderPath)
		
// 		let referenceResult: vscode.Location[] = await builtReferenceExpectedResultObject(resultRanges)
// 		await testReferense(docUri, position, referenceResult);
// 	});
// 	testCounter++;

// 	it('medium (3) Test' + testCounter.toString(), async () => {
// 		let position : vscode.Position = getWordPositionFromLine("medium", 2);
// 		let resultRanges: {} = 
// 			await getAllWordLocationsFromFilesInDir("medium", getDocPath("InferrerExample"), testFixtureFolderPath)
		
// 		let referenceResult: vscode.Location[] = await builtReferenceExpectedResultObject(resultRanges)
// 		await testReferense(docUri, position, referenceResult);
// 	});
// 	testCounter++;
// });

// */
// async function testReferense(
// 	docUri: vscode.Uri,
// 	position : vscode.Position,
// 	expectedReferenseList: vscode.Location[]
// ) {

// 	// Executing the command `vscode.executeReferenceProvider` to simulate triggering reference
// 	const actualReferenseList = (await vscode.commands.executeCommand(
// 		'vscode.executeReferenceProvider',
// 		docUri,
// 		position,
// 	)) as ReferenseResolve;
	
// 	//console.log(expectedReferenseList)
// 	assert.equal(actualReferenseList.length, expectedReferenseList.length);

// 	expectedReferenseList.forEach((expectedItem, i) => {
// 		const actualItem = actualReferenseList[i];
// 		assert.equal(actualItem.uri, expectedItem.uri);
// 		assert.equal(actualItem.range, expectedItem.range);
// 	});
// }

// const builtLocation = (docUri: vscode.Uri, resultRange: vscode.Range) : vscode.Location => {
// 	return {uri: docUri, range: resultRange};
// }

// async function builtReferenceExpectedResultObject(resultRanges: {}){
// 	let referenceResult: vscode.Location[] = [];
// 	for (let uriString in resultRanges) {
// 		let uriAndRanges = resultRanges[uriString];
// 		uriAndRanges["ranges"].forEach(range => {
// 			let uri = uriAndRanges["uri"];
// 			if (range!==undefined && !range.isEqual(defaultRange))
// 				referenceResult.push(builtLocation(uri, range));
// 		});
// 	}
// 	return referenceResult
// }