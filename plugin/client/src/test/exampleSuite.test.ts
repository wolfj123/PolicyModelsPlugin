import * as vscode from 'vscode';
import * as assert from 'assert';
import * as mocha from 'mocha';
import { getDocUri, activate, openFileForEditing, sleep, appendTextToEndOfFile  } from './helper';

mocha.suite('Extension Test Suite', () => {

	// mocha.before(()=>{
	// 	console.log("1");
	// });

	// mocha.beforeEach(()=>{
	// 	console.log("2");
	// });

	// mocha.after(()=>{
	// 	console.log("3");
	// });

	// mocha.afterEach(()=>{
	// 	console.log("4");
	// });

	describe('Should do completion', () => {
		it('Completes code in txt file', async () => {
			const docUri = getDocUri('completion.pspace');
			vscode.window.showInformationMessage('pop up window');
			var editor = await openFileForEditing('diagnostics.pspace');
			if (editor === undefined){
				assert.fail("can't open file - editor is undefined")
			}
			await appendTextToEndOfFile(editor,'<*');
			let lineCount:number = editor.document.lineCount;
			// await editor.edit(e=>{
			// 	e.insert(new vscode.Position(lineCount,0),"<*");
			// });
			var newTxt: string = editor.document.getText();
			assert.equal(newTxt, "ANY browsers, ANY OS.<*");
		});
	});

	// describe('open for file', () => {
	// 	it('open plugin for file', async () => {
	// 		console.log(
	// 			(await vscode.commands.getCommands()).filter)
	// 		vscode.commands.executeCommand('')
	// 		//var editor = await openFileForEditing("dg-consider_when\\questionnaire.dg");
	// 		sleep(1000);
	// 	});
	// });
	
});