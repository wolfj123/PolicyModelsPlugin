import * as mocha from 'mocha';
import { expect, assert } from 'chai';
import * as path from 'path';
import {SolverInt, PMSolver} from '../../src/Solver'
import { URI } from 'vscode-uri';
import { RenameParams, WorkspaceEdit } from 'vscode-languageserver';
import { initLogger } from '../../src/Logger';

describe('Solver Test Suite', ()=>{

	let testFolder: string;
	let testFolderSuffix: string = "/server/tests/sample directory";
	let solver: SolverInt;
	let codeFolder: string;

	const uriCreator = (fileName:string): string =>{
		return URI.file(path.join(codeFolder,fileName)).toString()
	}

	before(async ()=> {
		let cwd:string = process.cwd()
		initLogger(cwd);
		testFolder = cwd + testFolderSuffix;
		solver = new PMSolver();
		await solver.initParser(cwd);
		codeFolder =path.join(testFolder,"InferrerExample");
		await solver.onOpenFolder(URI.file(codeFolder).toString());
	});


	it('test rename from pspace file', ()=> {

		
		let inputParams: RenameParams = {
			textDocument: {uri: uriCreator("policy-space.pspace")},
			position: { line:2, character:36},
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
					uri:uriCreator("decision-graph.dg"),
					version:null
				}
			},
			{
				edits:[{
					range:{start:{line:2,character:34},end:{line:2,character:39} },
					newText:"majorMajor"
				}],
				textDocument:{
					 uri:uriCreator("policy-space.pspace"),
					version:null
				}
			},
			{
				edits:[{
					range:{ start:{line:3,character:9},end:{line:3,character:14}},
					newText:"majorMajor"
				}],
				textDocument:{
					uri:uriCreator("valueInference.vi"),
					version:null
				}
			}]
		}

		let ans = solver.onRenameRequest(inputParams);

		expect(ans).deep.equals(expectedAns);
	});

	
	it('test rename from VI file', ()=> {
		let inputParams: RenameParams = {
			textDocument: { uri:uriCreator("valueInference.vi")},
			position:{line:3,character:6},
			newName:"Harm2"
		}

		let expectedAns: WorkspaceEdit ={
			documentChanges: [
			{ 
				edits: [
					{
						range:{start:{line:0,character:26},end:{line:0,character:30}},
						newText:"Harm2"
					},
					{
						range:{start:{line:23,character:27},end:{line:23,character:31}},
						newText:"Harm2"
					},
					{
						range:{start:{line:24,character:21},end:{line:24,character:25}},
						newText:"Harm2"
					},
					{
						range:{start:{line:25,character:17},end:{line:25,character:21}},
						newText:"Harm2"
					}
				],
				textDocument:{
					uri:uriCreator("decision-graph.dg"),
					version:null
				}
			},
			{
				edits:
				[
					{ 
						range:{ start:{ line:0, character:34}, end:{ line:0, character:38}},
						 newText:"Harm2"
					}
				],
				textDocument: { 
					uri:uriCreator("policy-space.pspace"), 
					version:null
				}
			},
			{ 
				edits:
				[
					{ 
						range:{ start:{ line:1, character:4}, end:{ line:1, character:8}}, 
						newText:"Harm2"
					},
					{
						range:{ start:{ line:2, character:4}, end:{ line:2, character:8}}, 
						newText:"Harm2"
					},
					{
						range:{ start:{ line:3, character:4}, end:{ line:3, character:8}}, 
						newText:"Harm2"
					}
				], 
				textDocument:{
					 uri:uriCreator("valueInference.vi"), 
					 version:null
				}
			}
			]
		}

		let ans = solver.onRenameRequest(inputParams);

		expect(ans).deep.equals(expectedAns);

	});
	

	it('test rename from DG file', ()=> {
		let inputParams: RenameParams = {
			textDocument: { uri:uriCreator("decision-graph.dg")},
			position:{line:1,character:6},
			newName:"humanoid"
		}

		let expectedAns: WorkspaceEdit ={
			documentChanges:
			[
				{ 
					edits: [
						{
							range:{start:{line:1,character:2},end:{line:1,character:7}},
							newText:"humanoid"
						}
					],
					textDocument:{
						uri:uriCreator("decision-graph.dg"),
						version:null
					}
				}
			]
		};

		let ans = solver.onRenameRequest(inputParams);

		expect(ans).deep.equals(expectedAns, 'node change name only 1 refrence');

		inputParams = {
			textDocument: { uri:uriCreator("decision-graph.dg")},
			position:{line:11,character:41},
			newName:"identifiable2"
		}

		expectedAns = {
			documentChanges:[
				{
					 edits:[
						 { 
							 range:{ start:{ line:11, character:36}, end:{ line:11, character:48}},
							 newText:"identifiable2"
							}
						], 
						textDocument:{
							uri:uriCreator("decision-graph.dg"), 
							version:null
						}
				},
				{
					 edits:[
						 {
							range:{ start:{ line:1, character:52}, end:{ line:1, character:64}}, 
							newText:"identifiable2"
						}
					], 
					textDocument:{
						uri:uriCreator("policy-space.pspace"), 
						version:null
					}
				}
			]
		};

		ans = solver.onRenameRequest(inputParams);
		expect(ans).deep.equals(expectedAns, 'ps value change name');


	});


});