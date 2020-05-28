import * as path from 'path';
import {SolverInt, PMSolver} from '../../src/Solver'
import { URI } from 'vscode-uri';
import { RenameParams, WorkspaceEdit, TextDocumentPositionParams, Position, Range, DidChangeTextDocumentParams, CompletionList, CompletionItem, CompletionItemKind, CompletionItemTag, TextDocumentItem } from 'vscode-languageserver';
import { initLogger } from '../../src/Logger';
import { languagesIds } from '../../src/Utils';
import * as FS from 'fs';

const deepEqualInAnyOrder = require('deep-equal-in-any-order');
const chai = require('chai');
const expect = chai.expect;
chai.use(deepEqualInAnyOrder);

describe('Auto complete Tests', ()=>{

	let testFolder: string;
	let testFolderSuffix: string = "/server/tests/sample directory";
	let solver: SolverInt;


	const uriCreator = (fileName:string,folder:string ): string =>{
		return URI.file(path.join(folder,fileName)).toString()
	}

	const createAutoCompleteParams = (fileName:string, folder: string): TextDocumentPositionParams =>{
		let ans: TextDocumentPositionParams = {
			position: Position.create(0,0),
			textDocument: {uri: uriCreator(fileName,folder)}
		}

		return ans;
	}

	const psCompletionConstants: CompletionItem [] =
	[
		{ label:"TODO" , kind: 14},
		{ label:"one of" , kind: 14},
		{ label:"some of" , kind: 14},
		{ label:"consists of" , kind: 14},
	]

	const viCompletionConstans: CompletionItem [] = [
		{label: "comply", kind: 14},
		{label: "support", kind: 14}
	]

	const dgCompletionConstans: CompletionItem [] = [
		{label: "#import", kind: 14},
		{label: "answers", kind: 14},
		{label: "ask", kind: 14},
		{label: "call", kind: 14},
		{label: "consider", kind: 14},
		{label: "else", kind: 14},
		{label: "end", kind: 14},
		{label: "options", kind: 14},
		{label: "reject", kind: 14},
		{label: "section", kind: 14},
		{label: "set", kind: 14},
		{label: "slot", kind: 14},
		{label: "term", kind: 14},
		{label: "text", kind: 14},
		{label: "title", kind: 14},
		{label: "todo", kind: 14},
		{label: "when", kind: 14},
	]

	const createCompletionExpectedResult = (slots:string [], slotValues: string [], constants: CompletionItem [], dgNodes?: string[]): CompletionList =>{
		let itemsAns: CompletionItem [] = [];
		slots.forEach(currSlot=>{
			itemsAns.push({ label: currSlot , kind: CompletionItemKind.Enum});
		});

		slotValues.forEach(currValue=>{
			itemsAns.push({ label: currValue , kind: CompletionItemKind.Value});
		});

		if (dgNodes !== undefined){
			dgNodes.forEach(currNode=>{
				itemsAns.push({ label: currNode , kind: CompletionItemKind.Variable});
			});
		}

		constants.forEach(curr=>{
			itemsAns.push(curr);
		});

		return {
			isIncomplete: false,
			items: itemsAns
		}
	}


	before(async ()=> {
		let cwd:string = process.cwd()
		initLogger(cwd);
		testFolder = cwd + testFolderSuffix;
		
		// codeFolder =path.join(testFolder,"InferrerExample");
		// await solver.onOpenFolder(URI.file(codeFolder).toString());
	});

	let codeFolder:string;

	beforeEach (async () => {
		let cwd:string = process.cwd()
		solver = new PMSolver(cwd);
		codeFolder = path.join(testFolder,"InferrerExample");
		await solver.onOpenFolder(URI.file(codeFolder).toString());
	});

	async function testInferrerExample(addedPSSlots?: string [], addedPSValues?: string[]) {
		

		const emptyPSFile: string = "emptyText.ps";
		const fullPSFile: string = "policy-space.pspace";
		const viFile: string = "valueInference.vi";
		const dgFile: string = "decision-graph.dg";
		

		let emptytAns: CompletionList  = solver.onCompletion(createAutoCompleteParams(emptyPSFile,codeFolder));
		let fullPSAns: CompletionList  = solver.onCompletion(createAutoCompleteParams(fullPSFile,codeFolder));
		let viAns: CompletionList  = solver.onCompletion(createAutoCompleteParams(viFile,codeFolder));
		let dgAns: CompletionList  = solver.onCompletion(createAutoCompleteParams(dgFile,codeFolder));

		let psSlots:string [] = ["Human", "HumanDataType", "Harm", "Encryption" ];
		let psSlotValues: string [] = ["aggregated", "identifiable","anonymized", "none", "minor", "medium", "major",
		"clear", "serverSide", "doubleEncrypt"];
		let dgNodes: string [] = ["human","human-type","harm"];

		if (addedPSSlots !== undefined){
			psSlots = psSlots.concat(addedPSSlots);
		}

		if (addedPSValues !== undefined){
			psSlotValues = psSlotValues.concat(addedPSValues);
		}


		let psExpectedAns: CompletionList = createCompletionExpectedResult(psSlots,psSlotValues, psCompletionConstants);
		let viExpectedAns: CompletionList = createCompletionExpectedResult(psSlots,psSlotValues, viCompletionConstans);
		let dgExpectedAns: CompletionList = createCompletionExpectedResult(psSlots,psSlotValues, dgCompletionConstans,dgNodes);

		expect(emptytAns).to.equalInAnyOrder(fullPSAns,"two PS files should have same results");

		expect(fullPSAns).to.equalInAnyOrder(psExpectedAns,
			`PS file completion results in correct, expected: ${JSON.stringify(psExpectedAns)}\nactual:\n${JSON.stringify(fullPSAns)}`);

		expect(emptytAns).to.equalInAnyOrder(psExpectedAns,
			`PS file completion results in correct, expected: ${JSON.stringify(psExpectedAns)}\nactual:\n${JSON.stringify(emptytAns)}`);

		expect(viAns).to.equalInAnyOrder(viExpectedAns,
			`VI file completion results in correct, expected: ${JSON.stringify(viExpectedAns)}\nactual:\n${JSON.stringify(viAns)}`);

		expect(dgAns).to.equalInAnyOrder(dgExpectedAns,
			`DG file completion results in correct, expected:\n${JSON.stringify(dgExpectedAns)}\nactual:\n${JSON.stringify(dgAns)}`);
	}

	it ("autocomplete folder InferrerExample",async ()=> {
		await testInferrerExample();
	});

	it ("autocomplete for File",async ()=> {
		// open 2 files
		let recFolder: string = path.join(testFolder,"a\\Recursive-Sections");
		let recDGFile = "decision-graph.dg"
		let recPSFile: string  = "policy-space.pspace"
		let playFolder: string =  path.join(testFolder,"a\\a\\Find-Runs-playground");
		let playVIFile: string = "valueInference.vi"

		let recPSSlots: string [] = ["DataTags","A","B"];
		let recDGNodes: string [] = ["pRabbitHole","s1","s11","s12","s121","s1211"]

		await solver.onDidOpenTextDocument(TextDocumentItem.create(
			uriCreator(recDGFile,recFolder),languagesIds.decisiongraph.toString(),1, 
			FS.readFileSync(path.join(recFolder,recDGFile).toString(),'utf-8'))
		);

		let recDGExpectedAnsWithoutPS: CompletionList = createCompletionExpectedResult([],[],dgCompletionConstans,recDGNodes);
		let recDGAnsWithoutPS: CompletionList = solver.onCompletion(createAutoCompleteParams(recDGFile,recFolder));

		expect(recDGAnsWithoutPS).to.equalInAnyOrder(recDGExpectedAnsWithoutPS,
			`DG file completion results in correct, expected:\n${JSON.stringify(recDGExpectedAnsWithoutPS)}\nactual:\n${JSON.stringify(recDGAnsWithoutPS)}`);


		await solver.onDidOpenTextDocument(TextDocumentItem.create(
			uriCreator(recPSFile,recFolder),languagesIds.policyspace.toString(),1, 
			FS.readFileSync(path.join(recFolder,recPSFile).toString(),'utf-8'))
		);

		await solver.onDidOpenTextDocument(TextDocumentItem.create(
			uriCreator(playVIFile,playFolder),languagesIds.valueinference.toString(),1, 
			FS.readFileSync(path.join(playFolder,playVIFile).toString(),'utf-8'))
		);
		
		await testInferrerExample();		

		let recPSExpectedAns: CompletionList = createCompletionExpectedResult(recPSSlots,[],psCompletionConstants);
		let recDGExpectedAnswithPS: CompletionList = createCompletionExpectedResult(recPSSlots,[],dgCompletionConstans,recDGNodes);
		let playVIExpectedAns: CompletionList = createCompletionExpectedResult([],[],viCompletionConstans);

		let recPSAllOpenActualAns: CompletionList = solver.onCompletion(createAutoCompleteParams(recPSFile,recFolder));
		let recDGAllOpenActualAns: CompletionList = solver.onCompletion(createAutoCompleteParams(recDGFile,recFolder));
		let playVIAllOpenActualAns: CompletionList = solver.onCompletion(createAutoCompleteParams(playVIFile,playFolder));
		let nonExistingFileRequest: CompletionList = solver.onCompletion(createAutoCompleteParams(playVIFile,recFolder));

		await solver.onDidCloseTextDocument({uri: uriCreator(playVIFile,playFolder)});

		let viAnsAfterRemove: CompletionList = solver.onCompletion(createAutoCompleteParams(playVIFile,playFolder));

		expect(recPSAllOpenActualAns).to.equalInAnyOrder(recPSExpectedAns,
			`DG file completion results in correct, expected:\n${JSON.stringify(recPSExpectedAns)}\nactual:\n${JSON.stringify(recDGAnsWithoutPS)}`);
		
		expect(recDGAllOpenActualAns).to.equalInAnyOrder(recDGExpectedAnswithPS,
			`DG file completion results in correct, expected:\n${JSON.stringify(recDGExpectedAnswithPS)}\nactual:\n${JSON.stringify(recDGAllOpenActualAns)}`);

		expect(playVIAllOpenActualAns).to.equalInAnyOrder(playVIExpectedAns,
			`DG file completion results in correct, expected:\n${JSON.stringify(playVIExpectedAns)}\nactual:\n${JSON.stringify(playVIAllOpenActualAns)}`);

		expect(nonExistingFileRequest).equal(null,"completion on non existing file returned value");
		expect(viAnsAfterRemove).equal(null, "after removing a file the completion should be emoty")
	});

	it ("autocomplete adding text",async ()=> {

		const emptyPSFile: string = "emptyText.ps";
		const fullPSFile: string = "policy-space.pspace";
		const viFile: string = "valueInference.vi";
		const dgFile: string = "decision-graph.dg";

		let changeParams: DidChangeTextDocumentParams = {
			textDocument:{
				uri:uriCreator(emptyPSFile,codeFolder),
				version:2
			},
			contentChanges:
			[
				{
					text:`<* C:  consists of A, B. *>
					DataTags: consists of A, B. 
					A: one of bla, blabla.
					B: TODO.`,
					range: {start:{line:0,character:0}, end:{line:0,character:0}}
				}
			]
		}

		await solver.onDidChangeTextDocument(changeParams);

		await testInferrerExample(["DataTags","A","B"],["bla","blabla"])
	});

});

describe('Solver Test Renaming', ()=>{

	let testFolder: string;
	let testFolderSuffix: string = "/server/tests/sample directory";
	let solver: SolverInt;
	let codeFolder: string;

	const uriCreator = (fileName:string): string =>{
		return URI.file(path.join(codeFolder,fileName)).toString()
	}


	before(async ()=> {
		let cwd:string = process.cwd()
		testFolder = cwd + testFolderSuffix;
		solver = new PMSolver(cwd);
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
			textDocument: { uri: uriCreator("valueInference.vi")},
			position:{line:3,character:6},
			newName:"Harm2"
		}

		let expectedAns: WorkspaceEdit ={
			documentChanges: [
				{
					edits:
					[
						{
							range: {start: {line:2, character:0}, end: {line: 2, character: 4}},
							newText: "Harm2"
						},
						{ 
							range:{ start:{ line:0, character:34}, end:{ line:0, character:38}},
							 newText: "Harm2"
						},
	
					],
					textDocument: { 
						uri:uriCreator("policy-space.pspace"), 
						version:null
					}
				},
				{ 
					edits: [
						{
							range: { start: {line:0,character:26},end:{line:0,character:30}},
							newText:"Harm2"
						},
						{
							range: {start:{line:23,character:27},end:{line:23,character:31}},
							newText:"Harm2"
						},
						{
							range: {start:{line:24,character:21},end:{line:24,character:25}},
							newText:"Harm2"
						},
						{
							range: {start:{line:25,character:17},end:{line:25,character:21}},
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
