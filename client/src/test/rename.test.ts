// /*
// Test Documention: https://code.visualstudio.com/api/references/commands
// Relevant Comman: vscode.executeCompletionItemProvider
// Expected Output: TODO
// */


// import * as vscode from 'vscode';
// import * as assert from 'assert';
// import { 
// 	getDocUri, 
// 	activate, 
// 	getWordPositionFromLine,
// 	getWordRangeFromLineInEditor} from './helper';

// var testCounter: number = 0
// var testFixtureFolderPath: String = 'InferrerExample/'
// let defaultPosition: vscode.Position = new vscode.Position(0,0)
// export type RenameResolve = vscode.WorkspaceEdit;

// describe('Rename E2E tests', () => {
// 	const docUriPS = getDocUri(testFixtureFolderPath + 'policy-space.pspace');
// 	const docUriDG = getDocUri(testFixtureFolderPath + 'decision-graph.dg');
// 	const docUriVI = getDocUri(testFixtureFolderPath + 'valueInference.vi');

// 	it('Setup', async () => {
// 		await activate(docUriPS);
// 	})

// 	it('HumanDataType Test' + testCounter.toString(), async () => {
// 		let wordToRename = "HumanDataType"
// 		let newWordRename = "HumanDT"
// 		let entryPS = createEntry(docUriPS, 
// 			[getWordRangeFromLineInEditor(wordToRename, 0), 
// 			getWordRangeFromLineInEditor(wordToRename, 1)],
// 			newWordRename);
		
// 		await activate(docUriDG);

// 		let entryDG = createEntry(docUriDG, 
// 			[getWordRangeFromLineInEditor(wordToRename, 0), 
// 			getWordRangeFromLineInEditor(wordToRename, 11),
// 			getWordRangeFromLineInEditor(wordToRename, 12),
// 			getWordRangeFromLineInEditor(wordToRename, 13)],
// 			newWordRename);

// 		await activate(docUriVI);

// 		let entryVI = createEntry(docUriVI, 
// 			[getWordRangeFromLineInEditor(wordToRename, 1), 
// 			getWordRangeFromLineInEditor(wordToRename, 2),
// 			getWordRangeFromLineInEditor(wordToRename, 3)],
// 			newWordRename);
		
// 		await activate(docUriPS);

// 		let renameWorkSpace = builtRenamenExpectedResultObject([entryPS, entryDG, entryVI]);

// 		let position : vscode.Position = getWordPositionFromLine(wordToRename, 1);

// 		await testDefinition(docUriPS, position, renameWorkSpace, newWordRename);
// 	});
// 	testCounter++;
// });



// async function testDefinition(
// 	docUri: vscode.Uri,
// 	position : vscode.Position,
// 	expectedRenameWorkspce,
// 	newName: string
// ) {

// 	// Executing the command `vscode.executeDocumentRenameProvider` to simulate triggering completion
// 	const actualRenameWorkspce = (await vscode.commands.executeCommand(
// 		'vscode.executeDocumentRenameProvider',
// 		docUri,
// 		position,
// 		newName,
// 	)) as RenameResolve;

// 	assert.equal(actualRenameWorkspce.size, expectedRenameWorkspce.size)
// 	assert.equal(actualRenameWorkspce.entries().length, expectedRenameWorkspce.entries.length)

// 	expectedRenameWorkspce.entries.forEach((expectedItem, i) => {
// 		const actualItem = actualRenameWorkspce.entries()[i];
// 		assert.equal(actualItem[0].path, expectedItem.uri.path);
// 		assert.equal(actualItem[1].length, expectedItem.ranges.length);
// 		let allActualRanges = []
// 		actualItem[1].forEach((edit, j) => {
// 			allActualRanges.push(edit.range)
// 			assert.equal(edit.newText, expectedItem.newText);
// 		});
// 		allActualRanges.forEach((range: vscode.Range) => {
// 			var found = false;
// 			for(var i = 0; i < expectedItem.ranges.length; i++) {
// 				if(range.isEqual(expectedItem.ranges[i])){
// 					found = true;
// 					break;
// 				}
// 			}
// 			if (!found) assert.fail()
// 		});

// 	});

// }

// const createEntry = (uri: vscode.Uri, ranges: vscode.Range[], newText) => {
// 	return {uri: uri, ranges: ranges, newText: newText}
// }

// const builtRenamenExpectedResultObject = (entries) => {
// 	return {size: entries.length, entries: entries}
// }
