import * as vscode from 'vscode';
import * as assert from 'assert';
import * as mocha from 'mocha';
import { getDocUri, activate, openFileForEditing, sleep, appendTextToEndOfFile  } from './helper';

mocha.suite('Extension Test Suite', () => {

	mocha.before(()=>{
		console.log("1");
	});

	mocha.beforeEach(()=>{
		console.log("2");
	});

	mocha.after(()=>{
		console.log("3");
	});

	mocha.afterEach(()=>{
		console.log("4");
	});

	describe('Should do completion', () => {
		const docUri = getDocUri('completion.pspace');

		it('Completes code in txt file', async () => {
			vscode.window.showInformationMessage('3');
			var editor = await openFileForEditing('diagnostics.pspace');
			await appendTextToEndOfFile(editor,'<*');
			sleep(1000);
			
			assert.equal(1,0);
		});
	});
});