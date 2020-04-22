// import * as vscode from 'vscode';
// import * as assert from 'assert';
// import { getDocUri, activate } from './helper';
// import { start } from 'repl';

// describe('Folding range test1', () => {
// 	const docUri = getDocUri('simple\\burrito-with-call.dg');

// 	it('Test folding range in txt simple decision graph', async () => {
// 		// let folding: vscode.FoldingRange= {start: '0', end: '0', kind: vscode.FoldingRangeKind.Comment}
		
// 		let folding: vscode.FoldingRange[] = [{start:0, end:1}]
// 		let range: vscode.Range = new vscode.Range(new vscode.Position(0,0), new vscode.Position(1,1))
// 		await testFoldingRange(docUri, range, folding);
// 	});
// });

// async function testFoldingRange(
// 	docUri: vscode.Uri,
// 	range: vscode.Range,
// 	expectedFoldingRangeList: vscode.FoldingRange[]
// ) {
// 	await activate(docUri);

// 	// Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
// 	const actualFoldingRangeList = (await vscode.commands.executeCommand(
// 		'vscode.executeFormatRangeProvider',
// 		docUri,
// 		range,
// 	)) as vscode.FoldingRange[];

// 	assert.equal(actualFoldingRangeList.length, expectedFoldingRangeList.length);

// 	// expectedFoldingRangeList.forEach((expectedItem, i) => {
// 	// 	const actualItem = actualCompletionList.items[i];
// 	// 	assert.equal(actualItem.label, expectedItem.label);
// 	// 	assert.equal(actualItem.kind, expectedItem.kind);
// 	// });
// }
