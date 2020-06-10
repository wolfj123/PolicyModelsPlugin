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
// 	getWordFinishPositionFromLine,
// 	openFolder,} from './helper';

// var testCounter: number = 0
// var testFixtureFolderPath: string = 'completion/'
// let defaultPosition: vscode.Position = new vscode.Position(0,0)
// export type CompletionResolve = vscode.CompletionList;

// describe('Completion E2E test Policy Space', () => {
// 	const docUri = getDocUri(testFixtureFolderPath + 'ps.pspace');

// 	// it('Setup', async () => {
// 	// 	openFolder(getDocUri(testFixtureFolderPath));
// 	// })

// 	it('Big Test' + testCounter.toString(), async () => {
// 		// await activate(docUri);
// 		// let position : vscode.Position = getWordFinishPositionFromLine("Big", 1);
// 		let position : vscode.Position = new vscode.Position(1,3)
// 		let completionWordList = ["BigHuman", "BigHumanDataType", "BigHarm", "BigEncryption"]
// 		await testCompletion(docUri, position, completionWordList);
// 	});
// 	testCounter++;

// 	// it('BigH Test' + testCounter.toString(), async () => {
// 	// 	// await activate(docUri);
// 	// 	//let position : vscode.Position = getWordFinishPositionFromLine("BigH", 1);
// 	// 	let position : vscode.Position = new vscode.Position(1,4)
		
// 	// 	let completionWordList = ["BigHuman", "BigHumanDataType", "BigHarm"]
// 	// 	await testCompletion(docUri, position, completionWordList);
// 	// });
// 	// testCounter++;
// });


// // describe('Completion test Decision Graph', () => {
// // 	const docUri = getDocUri(testFixtureFolderPath + 'dg.dg');

// // 	it(' a Test' + testCounter.toString(), async () => {
// // 		// await activate(docUri);
// // 		// let position : vscode.Position = getWordFinishPositionFromLine(" a", 1);
// // 		let position : vscode.Position = new vscode.Position(1,13)

// // 		let completionWordList = ["ask", "answers"]
// // 		await testCompletion(docUri, position, completionWordList);
// // 	});
// // 	testCounter++;
// // });

// // describe('Completion test Value Inference', () => {
// // 	const docUri = getDocUri(testFixtureFolderPath + 'vi.vi');

// // 	it('BigHarm= Test' + testCounter.toString(), async () => {
// // 		// await activate(docUri);
// // 		let position : vscode.Position = getWordFinishPositionFromLine("BigHarm=", 2);
		
// // 		let completionWordList = ["bnone", "bminor", "bmedium", "bmajor"]
// // 		await testCompletion(docUri, position, completionWordList);
// // 	});
// // 	testCounter++;
// // });

// async function testCompletion(
// 	docUri: vscode.Uri,
// 	position : vscode.Position,
// 	expectedCompletionList: string[], 
// ) {
// 	// await activate(docUri);

// 	// Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
// 	const actualCompletionList = (await vscode.commands.executeCommand(
// 		'vscode.executeCompletionItemProvider',
// 		docUri,
// 		position,
// 	)) as CompletionResolve;

// 	var complitionLabels = []
// 	actualCompletionList.items.forEach((actualCompletion, i) => {
// 		if(actualCompletion.kind == 12)
// 			complitionLabels.push(actualCompletion.label)
// 	});

// 	assert.equal(complitionLabels.length, expectedCompletionList.length);

// 	expectedCompletionList.forEach((expectedItem, _) => {
// 		assert(complitionLabels.includes(expectedItem))
// 	});
// }
