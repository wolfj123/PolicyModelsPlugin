import * as mocha from 'mocha';
import { expect, assert } from 'chai';
import * as path from 'path';
import {SolverInt, PMSolver} from '../../src/Solver'
import { URI } from 'vscode-uri';
import { RenameParams, WorkspaceEdit } from 'vscode-languageserver';
import { initLogger } from '../../src/Logger';

mocha.suite('Solver Test Suite', ()=>{

	let testFolder: string;
	let testFolderSuffix: string = "/server/tests/sample directory";
	let solver: SolverInt;
	let codeFolder: string;

	mocha.before(async ()=> {
		let cwd:string = process.cwd()
		initLogger(cwd);
		testFolder = cwd + testFolderSuffix;
		solver = new PMSolver();
		await solver.initParser(cwd);
		codeFolder =path.join(testFolder,"InferrerExample");
		await solver.onOpenFolder(codeFolder);
	});


	mocha.test('test rename from pspace file', ()=> {
		let inputParams: RenameParams = {
			textDocument: {uri: URI.file(path.join(codeFolder,"policy-space.pspace")).toString()},
			position: {"line":2,"character":36},
			newName:"majorMajor"
		}

		let expectedAns: WorkspaceEdit = {
			documentChanges:
			[{ 
				edits:
				[{
					range:{start:{line:25,character:22},end:{line:25,character:27}},
					newText:"majorMajor"
				}],
				textDocument:{
					uri:"file:///c%3A/Ariel/Final%20Project/Project/PolicyModelsPlugin/plugin/client/testFixture/InferrerExample/decision-graph.dg",
					version:null
				}
			},
			{
				edits:[{
					range:{start:{line:2,character:34},end:{line:2,character:39} },
					newText:"majorMajor"
				}],
				textDocument:{
					"uri":"file:///c%3A/Ariel/Final%20Project/Project/PolicyModelsPlugin/plugin/client/testFixture/InferrerExample/policy-space.pspace",
					version:null
				}
			},
			{
				edits:[{
					range:{"start":{line:3,character:9},end:{line:3,character:14}},
					newText:"majorMajor"
				}],
				textDocument:{
					uri:"file:///c%3A/Ariel/Final%20Project/Project/PolicyModelsPlugin/plugin/client/testFixture/InferrerExample/valueInference.vi",
					version:null
				}
			}]
		}

		let ans = solver.onRenameRequest(inputParams);

		expect(ans).deep.equals(expectedAns);
	})


});