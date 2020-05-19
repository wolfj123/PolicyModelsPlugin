//https://stackoverflow.com/questions/22465431/how-can-i-dynamically-generate-test-cases-in-javascript-node

//https://samwize.com/2014/02/08/a-guide-to-mochas-describe-it-and-setup-hooks/

import * as assert from 'assert';
import * as mocha from 'mocha';
import * as TestTarget from "../../src/LanguageServices";
import * as TestData from "./testFixture/LanguageServicesTestFixtureData";
import * as Parser from 'web-tree-sitter';
import { isNullOrUndefined } from "util";
import {
	ReferenceParams,
	DocumentUri,
	Location,
	Range,
	Position,
	TextDocument,
	DeclarationParams,
	RenameParams,
	LocationLink,
	CompletionItem,
	TextDocumentPositionParams,
	FoldingRangeParams,
	FoldingRange,
	FoldingRangeKind,
	WorkspaceEdit,
	TextDocumentEdit,
	CompletionList,
	CompletionItemKind,
	TextDocuments,
	TextDocumentIdentifier,
	TextDocumentChangeEvent,
	DidChangeWatchedFilesParams,
} from 'vscode-languageserver';
import { 
	getFileExtension, 
	point2Position, 
	position2Point, 
	newRange, 
	newLocation, 
	flatten, 
	docChange2Edit
} from '../../src/Utils';
import {
	PolicyModelsLanguage,
	parsersInfo,
	getLanguageByExtension,
	PolicyModelEntityType,
	PolicyModelEntityCategory,
	PolicyModelEntity,
	DecisionGraphServices,
	PolicySpaceServices,
	ValueInferenceServices
} from '../../src/LanguageUtils'



function getTextFromUri(uri : string) : string | null {
	let dataEntry = TestData.data.find(e => e.uri === uri)
	if(isNullOrUndefined(dataEntry)) {return null}
	return dataEntry.text
}

function getParserWasmPathByExtension(extension : string) : string | null {
	const correspondingInfo = parsersInfo.filter(info => info.fileExtentsions.indexOf(extension) != -1)
	if(!(correspondingInfo) || correspondingInfo.length == 0) return null
	return correspondingInfo[0].wasm
}

async function getParser(text : string, uri : string) : Promise<Parser> {
	await Parser.init()
	const extension : string = getFileExtension(uri)
	const parser = new Parser()
	//let path = "../parsers/"
	let path = "./parsers/"
	const wasm = path.concat(getParserWasmPathByExtension(extension))
	const lang = await Parser.Language.load(wasm)
	parser.setLanguage(lang)
	return Promise.resolve(parser)
}

function getTree(uri) : Promise<Parser.Tree> {					
	let text = getTextFromUri(uri)
	return getParser(text, uri).then((parser) => {
		return parser.parse(text)
	})	
}


class DecisionGraphFileManager_UnitTests {
	static testTargetClass = TestTarget.DecisionGraphFileManager

	static runTests() {
		describe(DecisionGraphFileManager_UnitTests.testTargetClass.name + " unit tests", function() {
			DecisionGraphFileManager_UnitTests.getAllDefinitionsDGNode()
			DecisionGraphFileManager_UnitTests.getAllDefinitionsSlot()
			DecisionGraphFileManager_UnitTests.getAllDefinitionsSlotValue()
			DecisionGraphFileManager_UnitTests.getAllReferencesDGNode()
			DecisionGraphFileManager_UnitTests.getAllReferencesSlot()
			DecisionGraphFileManager_UnitTests.getAllReferencesSlotValue()
			DecisionGraphFileManager_UnitTests.getFoldingRanges()
			//DecisionGraphFileManager_UnitTests.getAutoComplete()
			//DecisionGraphFileManager_UnitTests.createPolicyModelEntity()
		})
	}

	static create(filename : string) : Promise<TestTarget.DecisionGraphFileManager>{
		return getTree(filename).then(tree => {
			let text : string = getTextFromUri(filename)
			return new TestTarget.DecisionGraphFileManager(tree, filename)
		})
	}

	//Test
	static createPolicyModelEntity() {
		//TODO:
		throw new Error("Method not implemented.");
	}

	//Test
	static getAllDefinitionsDGNode() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'dg1.dg', nodeName: 'findme'},
				output: 
					[
						{range: {start: {character: 2,line: 3},end: {character: 8,line: 3}},uri: 'dg1.dg'}
					]
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			let instancePromise : Promise<TestTarget.DecisionGraphFileManager> = DecisionGraphFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllDefinitionsDGNode(nodeName, filename)
				assert.deepEqual(result, output)
			})
		}
		//describe(DecisionGraphFileManager_UnitTests.testTargetClass.name, function() {
			describe('getAllDefinitionsDGNode', function() {
				testCases.forEach((testCase, index) => {
					it(testCase.title , function(done) {
						test(testCase).then(run => done()).catch(err => done(err))
					});
				})
			})
		//})
	}

	//Test
	static getAllDefinitionsSlot(){
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'dg1.dg', nodeName: 'Bottom1'},
				output: []
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			let instancePromise : Promise<TestTarget.DecisionGraphFileManager> = DecisionGraphFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllDefinitionsSlot(nodeName)
				assert.deepEqual(result, output)
			})
		}

		describe('getAllDefinitionsSlot', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getAllDefinitionsSlotValue(){
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'dg1.dg', nodeName: 'b1a'},
				output: []
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			let instancePromise : Promise<TestTarget.DecisionGraphFileManager> = DecisionGraphFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllDefinitionsSlotValue(nodeName)
				assert.deepEqual(result, output)
			})
		}

		describe('getAllDefinitionsSlotValue', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getAllReferencesDGNode() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'dg1.dg', nodeName: 'findme', source : undefined},
				output: [{range: {end: {character: 13,line: 10},start: {character: 7,line: 10}},uri: 'dg1.dg'}]
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			const source : string = input.source
			let instancePromise : Promise<TestTarget.DecisionGraphFileManager> = DecisionGraphFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllReferencesDGNode(nodeName, filename, source)
				assert.deepEqual(result, output)
			})
		}

		describe('getAllReferencesDGNode', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getAllReferencesSlot() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'dg1.dg', nodeName: 'Mid1'},
				output: [
					{range: {end: {character: 14,line: 15},start: {character: 10,line: 15}},uri: 'dg1.dg'},
					{range: {end: {character: 19,line: 16},start: {character: 15,line: 16}},uri: 'dg1.dg'}
				]
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			let instancePromise : Promise<TestTarget.DecisionGraphFileManager> = DecisionGraphFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllReferencesSlot(nodeName, undefined)
				assert.deepEqual(result, output)
			})
		}

		describe('getAllReferencesSlot', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getAllReferencesSlotValue() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'dg1.dg', nodeName: 'b1a'},
				output: [
					{range: {end: {character: 26,line: 15},start: {character: 23,line: 15}},uri: 'dg1.dg'},
					{range: {end: {character: 10,line: 17},start: {character: 7,line: 17}},uri: 'dg1.dg'}
				]
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			let instancePromise : Promise<TestTarget.DecisionGraphFileManager> = DecisionGraphFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllReferencesSlotValue(nodeName, undefined)
				assert.deepEqual(result, output)
			})
		}

		describe('getAllReferencesSlotValue', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getFoldingRanges() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'dg2.dg'},
				output: [
					{range: {end: {character: 22,line: 0},start: {character: 0,line: 0}},uri: 'dg2.dg'},
					{range: {end: {character: 33,line: 4},start: {character: 0,line: 1}},uri: 'dg2.dg'},
					{range: {end: {character: 47,line: 2},start: {character: 0,line: 2}},uri: 'dg2.dg'},
					{range: {end: {character: 32,line: 4},start: {character: 0,line: 3}},uri: 'dg2.dg'},
					{range: {end: {character: 31,line: 4},start: {character: 1,line: 4}},uri: 'dg2.dg'},
					{range: {end: {character: 30,line: 4},start: {character: 7,line: 4}},uri: 'dg2.dg'},
				]
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			let instancePromise : Promise<TestTarget.DecisionGraphFileManager> = DecisionGraphFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getFoldingRanges()
				assert.deepEqual(result, output)
			})
		}

		describe('getFoldingRanges', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getAutoComplete() {
		//TODO:
		throw new Error("Method not implemented.");
	}
}

class PolicySpaceFileManager_UnitTests {
	static testTargetClass = TestTarget.PolicySpaceFileManager

	static runTests() {
		describe(PolicySpaceFileManager_UnitTests.testTargetClass.name + " unit tests", function() {
			PolicySpaceFileManager_UnitTests.getAllDefinitionsDGNode()
			PolicySpaceFileManager_UnitTests.getAllDefinitionsSlot()
			PolicySpaceFileManager_UnitTests.getAllDefinitionsSlotValue()
			PolicySpaceFileManager_UnitTests.getAllReferencesDGNode()
			PolicySpaceFileManager_UnitTests.getAllReferencesSlot()
			PolicySpaceFileManager_UnitTests.getAllReferencesSlotValue()
			PolicySpaceFileManager_UnitTests.getFoldingRanges()
			//PolicySpaceFileManager_UnitTests.getAutoComplete()
			//PolicySpaceFileManager_UnitTests.createPolicyModelEntity()
		})
	}

	static create(filename : string) : Promise<TestTarget.PolicySpaceFileManager>{
		return getTree(filename).then(tree => {
			let text : string = getTextFromUri(filename)
			return new TestTarget.PolicySpaceFileManager(tree, filename)
		})
	}

	//Test
	static createPolicyModelEntity() {
		//TODO:
		throw new Error("Method not implemented.");
	}

	//Test
	static getAllDefinitionsDGNode() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'ps1.pspace', nodeName: 'atomic_slot1'},
				output: []
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			let instancePromise : Promise<TestTarget.PolicySpaceFileManager> = PolicySpaceFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllDefinitionsDGNode(nodeName, filename)
				assert.deepEqual(result, output)
			})
		}

		describe('getAllDefinitionsDGNode', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getAllDefinitionsSlot(){
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'ps1.pspace', nodeName: 'atomic_slot1'},
				output: [{range: {end: {character: 12,line: 0},start: {character: 0,line: 0}},uri: 'ps1.pspace'}]
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			let instancePromise : Promise<TestTarget.PolicySpaceFileManager> = PolicySpaceFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllDefinitionsSlot(nodeName)
				assert.deepEqual(result, output)
			})
		}

		describe('getAllDefinitionsSlot', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getAllDefinitionsSlotValue(){
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'ps1.pspace', nodeName: 'slotval1'},
				output: [
					{range: {end: {character: 9,line: 1},start: {character: 1,line: 1}},uri: 'ps1.pspace'},
					{range: {end: {character: 9,line: 6},start: {character: 1,line: 6}},uri: 'ps1.pspace'},
					{range: {end: {character: 9,line: 11},start: {character: 1,line: 11}},uri: 'ps1.pspace'},
				]
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			let instancePromise : Promise<TestTarget.PolicySpaceFileManager> = PolicySpaceFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllDefinitionsSlotValue(nodeName)
				assert.deepEqual(result, output)
			})
		}

		describe('getAllDefinitionsSlotValue', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getAllReferencesDGNode() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'ps1.pspace', nodeName: 'atomic_slot1'},
				output: []
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			const source : string = input.source
			let instancePromise : Promise<TestTarget.PolicySpaceFileManager> = PolicySpaceFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllReferencesDGNode(nodeName, filename, source)
				assert.deepEqual(result, output)
			})
		}

		describe('getAllReferencesDGNode', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getAllReferencesSlot() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'ps1.pspace', nodeName: 'atomic_slot1'},
				output: [
					{range: {end: {character: 60,line: 15},start: {character: 48,line: 15}},uri: 'ps1.pspace'},
				]
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			let instancePromise : Promise<TestTarget.PolicySpaceFileManager> = PolicySpaceFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllReferencesSlot(nodeName, undefined)
				assert.deepEqual(result, output)
			})
		}

		describe('getAllReferencesSlot', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getAllReferencesSlotValue() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'ps1.pspace', nodeName: 'slotval1'},
				output: [
					{range: {end: {character: 9,line: 1},start: {character: 1,line: 1}},uri: 'ps1.pspace'},
					{range: {end: {character: 9,line: 6},start: {character: 1,line: 6}},uri: 'ps1.pspace'},
					{range: {end: {character: 9,line: 11},start: {character: 1,line: 11}},uri: 'ps1.pspace'},
				]
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			let instancePromise : Promise<TestTarget.PolicySpaceFileManager> = PolicySpaceFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllReferencesSlotValue(nodeName, undefined)
				assert.deepEqual(result, output)
			})
		}

		describe('getAllReferencesSlotValue', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getFoldingRanges() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'ps1.pspace'},
				output: [
					{range: {end: {character: 17,line: 3},start: {character: 0,line: 0}},uri: 'ps1.pspace'},
					{range: {end: {character: 17,line: 8},start: {character: 0,line: 5}},uri: 'ps1.pspace'},
					{range: {end: {character: 17,line: 13},start: {character: 0,line: 10}},uri: 'ps1.pspace'},
					{range: {end: {character: 91,line: 15},start: {character: 0,line: 15}},uri: 'ps1.pspace'},
				]
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			let instancePromise : Promise<TestTarget.PolicySpaceFileManager> = PolicySpaceFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getFoldingRanges()
				assert.deepEqual(result, output)
			})
		}

		describe('getFoldingRanges', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getAutoComplete() {
		//TODO:
		throw new Error("Method not implemented.");
	}
}

class ValueInferenceFileManager_UnitTests {
	static testTargetClass = TestTarget.ValueInferenceFileManager

	static runTests() {
		describe(ValueInferenceFileManager_UnitTests.testTargetClass.name + " unit tests", function() {
			ValueInferenceFileManager_UnitTests.getAllDefinitionsDGNode()
			ValueInferenceFileManager_UnitTests.getAllDefinitionsSlot()
			ValueInferenceFileManager_UnitTests.getAllDefinitionsSlotValue()
			ValueInferenceFileManager_UnitTests.getAllReferencesDGNode()
			ValueInferenceFileManager_UnitTests.getAllReferencesSlot()
			ValueInferenceFileManager_UnitTests.getAllReferencesSlotValue()
			ValueInferenceFileManager_UnitTests.getFoldingRanges()
			//ValueInferenceFileManager_UnitTests.getAutoComplete()
			//ValueInferenceFileManager_UnitTests.createPolicyModelEntity()
		})
	}

	static create(filename : string) : Promise<TestTarget.ValueInferenceFileManager>{
		return getTree(filename).then(tree => {
			let text : string = getTextFromUri(filename)
			return new TestTarget.ValueInferenceFileManager(tree, filename)
		})
	}

	//Test
	static createPolicyModelEntity() {
		//TODO:
		throw new Error("Method not implemented.");
	}

	//Test
	static getAllDefinitionsDGNode() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'vi1.vi', nodeName: 'Encrypt'},
				output: []
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			let instancePromise : Promise<TestTarget.ValueInferenceFileManager> = ValueInferenceFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllDefinitionsDGNode(nodeName, filename)
				assert.deepEqual(result, output)
			})
		}

		describe('getAllDefinitionsDGNode', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getAllDefinitionsSlot(){
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'vi1.vi', nodeName: 'Encrypt'},
				output: []
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			let instancePromise : Promise<TestTarget.ValueInferenceFileManager> = ValueInferenceFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllDefinitionsSlot(nodeName)
				assert.deepEqual(result, output)
			})
		}

		describe('getAllDefinitionsSlot', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getAllDefinitionsSlotValue(){
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'vi1.vi', nodeName: 'Blue'},
				output: []
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			let instancePromise : Promise<TestTarget.ValueInferenceFileManager> = ValueInferenceFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllDefinitionsSlotValue(nodeName)
				assert.deepEqual(result, output)
			})
		}

		describe('getAllDefinitionsSlotValue', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getAllReferencesDGNode() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'vi1.vi', nodeName: 'Encrypt'},
				output: []
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			const source : string = input.source
			let instancePromise : Promise<TestTarget.ValueInferenceFileManager> = ValueInferenceFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllReferencesDGNode(nodeName, filename, source)
				assert.deepEqual(result, output)
			})
		}

		describe('getAllReferencesDGNode', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getAllReferencesSlot() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'vi1.vi', nodeName: 'Encrypt'},
				output: [
					{range: {end: {character: 10,line: 1},start: {character: 3,line: 1}},uri: 'vi1.vi'},
					{range: {end: {character: 10,line: 2},start: {character: 3,line: 2}},uri: 'vi1.vi'},
					{range: {end: {character: 10,line: 3},start: {character: 3,line: 3}},uri: 'vi1.vi'},
					{range: {end: {character: 10,line: 4},start: {character: 3,line: 4}},uri: 'vi1.vi'},
					{range: {end: {character: 10,line: 5},start: {character: 3,line: 5}},uri: 'vi1.vi'},
				]
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			let instancePromise : Promise<TestTarget.ValueInferenceFileManager> = ValueInferenceFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllReferencesSlot(nodeName, undefined)
				assert.deepEqual(result, output)
			})
		}

		describe('getAllReferencesSlot', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getAllReferencesSlotValue() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'vi1.vi', nodeName: 'Blue'},
				output: [
					{range: {end: {character: 41,line: 1},start: {character: 37,line: 1}},uri: 'vi1.vi'},
				]
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			let instancePromise : Promise<TestTarget.ValueInferenceFileManager> = ValueInferenceFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllReferencesSlotValue(nodeName, undefined)
				assert.deepEqual(result, output)
			})
		}

		describe('getAllReferencesSlotValue', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getFoldingRanges() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: {fileName: 'ps1.pspace'},
				output: [
					// {range: {end: {character: 17,line: 3},start: {character: 0,line: 0}},uri: 'ps1.pspace'},
					// {range: {end: {character: 17,line: 8},start: {character: 0,line: 5}},uri: 'ps1.pspace'},
					// {range: {end: {character: 17,line: 13},start: {character: 0,line: 10}},uri: 'ps1.pspace'},
					// {range: {end: {character: 91,line: 15},start: {character: 0,line: 15}},uri: 'ps1.pspace'},
				]
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			let instancePromise : Promise<TestTarget.ValueInferenceFileManager> = ValueInferenceFileManager_UnitTests.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getFoldingRanges()
				assert.deepEqual(result, output)
			})
		}

		describe('getFoldingRanges', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getAutoComplete() {
		//TODO:
		throw new Error("Method not implemented.");
	}
}


// DecisionGraphFileManager_UnitTests.runTests()
// PolicySpaceFileManager_UnitTests.runTests()
// ValueInferenceFileManager_UnitTests.runTests()
