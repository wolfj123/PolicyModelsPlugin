/*
Test Documention: https://code.visualstudio.com/api/references/commands
Relevant Comman: vscode.executeCompletionItemProvider
Expected Output: TODO
*/


import * as vscode from 'vscode';
import * as assert from 'assert';
import { 
	getDocUri, 
	activate, 
	getWordPositionFromLine} from './helper';
import { print } from 'util';

var testCounter: number = 0
var testFixtureFolderPath: String = 'InferrerExample\\'
let defaultPosition: vscode.Position = new vscode.Position(0,0)
export type RenameResolve = vscode.WorkspaceEdit;

describe('Rename test Sanity', () => {
	const docUri = getDocUri(testFixtureFolderPath + 'policy-space.pspace');

	it('Setup', async () => {
		await activate(docUri);
	})

	it('Sanity Test' + testCounter.toString(), async () => {
		let renameWorkSpace = builtRenamenExpectedResultObject(1, docUri, [])
		let position : vscode.Position = getWordPositionFromLine("HumanDataType", 1);

		await testDefinition(docUri, position, renameWorkSpace, "HumanDT");
	});
	testCounter++;
});



async function testDefinition(
	docUri: vscode.Uri,
	position : vscode.Position,
	expectedRenameWorkspce,
	newName: string
) {

	// Executing the command `vscode.executeDocumentRenameProvider` to simulate triggering completion
	const actualRenameWorkspce = (await vscode.commands.executeCommand(
		'vscode.executeDocumentRenameProvider',
		docUri,
		position,
		newName,
	)) as RenameResolve;

	assert.equal(actualRenameWorkspce.size, expectedRenameWorkspce.size)
	assert.equal(actualRenameWorkspce.entries().length, expectedRenameWorkspce.entries.length)

	expectedRenameWorkspce.entries.forEach((expectedItem, i) => {
		const actualItem = actualRenameWorkspce.entries()[i];
		assert.equal(actualItem[0], expectedItem.uri);
		assert.equal(actualItem[1].length, expectedItem.edits.length);
		actualItem[1].forEach((edit, j) => {
			assert.equal(edit.range, expectedItem.edits[j].range);
			assert.equal(edit.newText, expectedItem.edits[j].newText);
		});
	});

}


const builtRenamenExpectedResultObject = 
(size: number, uri: vscode.Uri, edits: vscode.TextEdit[]) => {
	return {size: size, entries: [{uri: uri, edits: edits}]}
}