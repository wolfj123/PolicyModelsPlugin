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
				input: {fileName: 'dg1.dg', nodeName: 'q-order'},
				output: []
			}
		]

		function test(testCase) : Promise<() => void> {
			const input = testCase.input
			const output = testCase.output
			const filename : string = input.fileName
			const nodeName : string = input.nodeName
			let instancePromise : Promise<TestTarget.DecisionGraphFileManager> = DecisionGraphFileManager_Test.create(filename)
			return instancePromise.then(instance =>{
				const run = function() {
					const result = instance.getAllDefinitionsDGNode(nodeName)
					assert.deepEqual(result, output)
				}
				return run
			})
		}

		describe('getAllDefinitionsDGNode', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					// @ts-ignore
					test(testCase).then(run => {
						try {
							run()
							done()
						}
						catch(err){
							done(err)
						}
					})
					

					// try {
					// 	test(testCase)
					// 	done()
					// }
					// catch(err){
					// 	done(err)
					// }
				});
			})
		})
	}

	//Test
	static getAllDefinitionsSlot(){

	}

	//Test
	static getAllDefinitionsSlotValue(){

	}

	//Test
	static getAllReferencesDGNode() {

	}

	//Test
	static getAllReferencesSlot() {

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