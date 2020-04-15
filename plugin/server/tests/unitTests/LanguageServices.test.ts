//https://stackoverflow.com/questions/22465431/how-can-i-dynamically-generate-test-cases-in-javascript-node

//https://samwize.com/2014/02/08/a-guide-to-mochas-describe-it-and-setup-hooks/

import * as assert from 'assert';
import * as mocha from 'mocha';
var expect = require('chai').expect;
//import expect from 'chai';
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

//TODO: this is duplicate code - need to move it to some library
const parsersInfo = 	//TODO: maybe extract this info from package.json
[ 
	{ 
		fileExtentsions : ['dg'],
		language : TestTarget.PolicyModelsLanguage.DecisionGraph,
		wasm : 'tree-sitter-decisiongraph.wasm',
	},
	{ 
		fileExtentsions : ['pspace', 'ps', 'ts'],
		language : TestTarget.PolicyModelsLanguage.PolicySpace,
		wasm : 'tree-sitter-policyspace.wasm',
	},
	{ 
		fileExtentsions :  ['vi'],
		language : TestTarget.PolicyModelsLanguage.ValueInference,
		wasm : 'tree-sitter-valueinference.wasm',
	}
]

function getTextFromUri(uri : string) : string | null {
	let dataEntry = TestData.data.find(e => e.uri === uri)
	if(isNullOrUndefined(dataEntry)) {return null}
	return dataEntry.text
}

function getLanguageByExtension(extension : string) : TestTarget.PolicyModelsLanguage | null {
	const correspondingInfo = parsersInfo.filter(info => info.fileExtentsions.indexOf(extension) != -1)
	if(!(correspondingInfo) || correspondingInfo.length == 0) return null
	return correspondingInfo[0].language
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

class TestRun {
	className : string
	methodName : string
	run : () => void
	enabled : boolean = true
}


class DecisionGraphFileManager_Test {
	static testTargetClass = TestTarget.DecisionGraphFileManager;
	static instance : TestTarget.DecisionGraphFileManager;

	static runTests() {
		DecisionGraphFileManager_Test.getAllDefinitionsDGNode()
		DecisionGraphFileManager_Test.getAllDefinitionsSlot()
		DecisionGraphFileManager_Test.getAllDefinitionsSlotValue()
		DecisionGraphFileManager_Test.getAllReferencesDGNode()
		DecisionGraphFileManager_Test.getAllReferencesSlot()
		// DecisionGraphFileManager_Test.getAllDefinitionsSlotValue()
		// DecisionGraphFileManager_Test.getAllDefinitionsSlotValue()
		// DecisionGraphFileManager_Test.getAllDefinitionsSlotValue()
		// DecisionGraphFileManager_Test.getAllDefinitionsSlotValue()
		// DecisionGraphFileManager_Test.getAllDefinitionsSlotValue()
	}

	static create(filename : string) : Promise<TestTarget.DecisionGraphFileManager>{
		return getTree(filename).then(tree => {
			let text : string = getTextFromUri(filename)
			return new TestTarget.DecisionGraphFileManager(tree, filename)
		})
	}

	//Test
	static createPolicyModelEntity() {
		
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
			let instancePromise : Promise<TestTarget.DecisionGraphFileManager> = DecisionGraphFileManager_Test.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllDefinitionsDGNode(nodeName)
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
				input: {fileName: 'dg1.dg', nodeName: 'Bottom1'},
				output: []
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			let instancePromise : Promise<TestTarget.DecisionGraphFileManager> = DecisionGraphFileManager_Test.create(filename)
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
			let instancePromise : Promise<TestTarget.DecisionGraphFileManager> = DecisionGraphFileManager_Test.create(filename)
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
			let instancePromise : Promise<TestTarget.DecisionGraphFileManager> = DecisionGraphFileManager_Test.create(filename)
			return instancePromise.then(instance =>{
				const result = instance.getAllReferencesDGNode(nodeName, source)
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
			let instancePromise : Promise<TestTarget.DecisionGraphFileManager> = DecisionGraphFileManager_Test.create(filename)
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

	}

	//Test
	static getFoldingRanges() {

	}

	//Test
	static getAutoComplete() {

	}
}

class PolicySpaceFileManager_Test {
	testTargetClass = TestTarget.PolicySpaceFileManager

	runTests() {
		throw new Error("Method not implemented.");
	}

	createPolicyModelEntity() {
		
	}

	getAllDefinitionsDGNode() {

	}

	getAllDefinitionsSlot(){

	}

	getAllDefinitionsSlotValue(){

	}

	getAllReferencesDGNode() {

	}

	getAllReferencesSlot() {

	}

	getAllReferencesSlotValue() {

	}

	getFoldingRanges() {

	}

	getAutoComplete() {

	}
}

class ValueInferenceFileManager_Test {
	testTargetClass = TestTarget.PolicySpaceFileManager

	runTests() {
		throw new Error("Method not implemented.");
	}

	createPolicyModelEntity() {
		
	}

	getAllDefinitionsDGNode() {

	}

	getAllDefinitionsSlot() {

	}

	getAllDefinitionsSlotValue() {

	}

	getAllReferencesDGNode() {

	}

	getAllReferencesSlot() {

	}

	getAllReferencesSlotValue() {

	}

	getFoldingRanges() {

	}

	getAutoComplete() {

	}
}

DecisionGraphFileManager_Test.runTests()