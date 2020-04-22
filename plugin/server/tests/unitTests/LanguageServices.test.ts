//https://stackoverflow.com/questions/22465431/how-can-i-dynamically-generate-test-cases-in-javascript-node

//https://samwize.com/2014/02/08/a-guide-to-mochas-describe-it-and-setup-hooks/


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
import { TextDocWithChanges } from '../../src/DocumentChangesManager';

import * as assert from 'assert';
import * as mocha from 'mocha'; 
const deepEqualInAnyOrder = require('deep-equal-in-any-order');
const chai = require('chai');
const expect = chai.expect;
chai.use(deepEqualInAnyOrder);


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

// function getTree(uri) : Promise<Parser.Tree> {					
// 	let text = getTextFromUri(uri)
// 	return getParser(text, uri).then((parser) => {
// 		return parser.parse(text)
// 	})	
// }


function createTextDocFromUrl(uri : string) {
	let text : string = getTextFromUri(uri)	
	return {
		textDocument : {
			uri: uri,
			languageId: null,
			version : null,
			getText : function() {return text},
			positionAt : null,
			offsetAt : null,
			lineCount : null
		},
		changes : [{text : text}]
	}
}


class LanguageServices_UnitTests {
	static testTargetClass = TestTarget.LanguageServices

	static runTests() {
		describe(LanguageServices_UnitTests.testTargetClass.name + " unit tests", function() {
			LanguageServices_UnitTests.getDeclarations()
			LanguageServices_UnitTests.getReferences()
			LanguageServices_UnitTests.getRangeOfDoc()
			LanguageServices_UnitTests.createPolicyModelEntity()
			LanguageServices_UnitTests.getFoldingRanges()
			//LanguageServices_UnitTests.getCompletion()
		})
	}

	static async create(filenames : string[]) : Promise<TestTarget.LanguageServices> {
		//let text : string = getTextFromUri(filename)
		let docs : TextDocWithChanges[]
		docs = filenames.map(fn => {
			let text : string = getTextFromUri(fn)	
			return {
				textDocument : {
					uri: fn,
					languageId: null,
					version : null,
					getText : function() {return text},
					positionAt : null,
					offsetAt : null,
					lineCount : null
				},
				changes : [{text : text}]
			}
		})
		return await TestTarget.LanguageServices.init(docs)
	}

	//Test
	static getDeclarations() {
		const testCases = 
		[
			{
				title: 'node sanity',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 2, line: 4},end: {character: 2, line: 4}}, uri: 'dg1_ws_1.dg'}
				},
				output: [
					{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg1_ws_1.dg'},
					{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg2_ws_1.dg'},
					{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg3_ws_1.dg'},
				]
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filenames : string[] = input.fileNames
			const location : Location = input.location
			let instance = await LanguageServices_UnitTests.create(filenames)
			const result = instance.getDeclarations(location)
			assert.deepEqual(result, output)
		}

		describe('getDeclarations', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getReferences() {
		const testCases = 
		[
			{
				title: 'node sanity',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 2, line: 4},end: {character: 2, line: 4}}, uri: 'dg1_ws_1.dg'}
				},
				output: [
					{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg1_ws_1.dg'},
					{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg2_ws_1.dg'},
					{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg3_ws_1.dg'},
				]
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filenames : string[] = input.fileNames
			const location : Location = input.location
			let instance = await LanguageServices_UnitTests.create(filenames)
			const result = instance.getReferences(location)
			assert.deepEqual(result, output)
		}

		describe('getReferences', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static getRangeOfDoc() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: 'dg1_ws_1.dg'
				},
				output: {start: {character: 0, line: 1},end: {character: 0, line: 12}}
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filenames : string[] = input.fileNames
			const filename : string = input.location
			let instance = await LanguageServices_UnitTests.create(filenames)
			const result = instance.getRangeOfDoc(filename)
			assert.deepEqual(result, output)
		}

		describe('getRangeOfDoc', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	//Test
	static createPolicyModelEntity() {
		const testCases = 
		[
			{
				title: 'node sanity',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 2, line: 4},end: {character: 2, line: 4}}, uri: 'dg1_ws_1.dg'}
				},
				output: {name : 'n1', type : TestTarget.PolicyModelEntityType.DGNode}
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filenames : string[] = input.fileNames
			const location : Location = input.location
			let instance = await LanguageServices_UnitTests.create(filenames)
			const result = instance.createPolicyModelEntity(location)
			assert.deepEqual({name : result.name, type : result.type}, output)
		}

		describe('createPolicyModelEntity', function() {
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
				title: 'node sanity',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: 'dg1_ws_1.dg'
				},
				output: [
					{range: {start: {character: 0, line: 1},end: {character: 27, line: 1}}, uri: 'dg1_ws_1.dg'},
					{range: {start: {character: 0, line: 2},end: {character: 27, line: 2}}, uri: 'dg1_ws_1.dg'},
					{range: {start: {character: 0, line: 4},end: {character: 17, line: 4}}, uri: 'dg1_ws_1.dg'},
					{range: {start: {character: 0, line: 5},end: {character: 21, line: 5}}, uri: 'dg1_ws_1.dg'},
					{range: {start: {character: 0, line: 6},end: {character: 21, line: 6}}, uri: 'dg1_ws_1.dg'},
					{range: {start: {character: 0, line: 7},end: {character: 84, line: 9}}, uri: 'dg1_ws_1.dg'},
					{range: {start: {character: 0, line: 10},end: {character: 13, line: 10}}, uri: 'dg1_ws_1.dg'},
				]
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filenames : string[] = input.fileNames
			const location : string = input.location
			let instance = await LanguageServices_UnitTests.create(filenames)
			const result = instance.getFoldingRanges(location)
			assert.deepEqual(result, output)
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
	static getCompletion() {
		//TODO:
		throw new Error("Method not implemented.");
	}
}


class LanguageServicesFacade_UnitTests {
	static testTargetClass = TestTarget.LanguageServicesFacade

	static runTests() {
		describe(LanguageServicesFacade_UnitTests.testTargetClass.name + " unit tests", function() {
			LanguageServicesFacade_UnitTests.addDocs()
			LanguageServicesFacade_UnitTests.updateDoc()
			LanguageServicesFacade_UnitTests.removeDoc()
			LanguageServicesFacade_UnitTests.onDefinition()
			LanguageServicesFacade_UnitTests.onReferences()
			LanguageServicesFacade_UnitTests.onPrepareRename()
			LanguageServicesFacade_UnitTests.onRenameRequest()
			LanguageServicesFacade_UnitTests.onCompletion()
			LanguageServicesFacade_UnitTests.onCompletionResolve()
			LanguageServicesFacade_UnitTests.onFoldingRanges()
		})
	}

	static async create(filenames : string[]) : Promise<TestTarget.LanguageServicesFacade> {
		let docs : TextDocWithChanges[]
		docs = filenames.map(createTextDocFromUrl)
		return await TestTarget.LanguageServicesFacade.init(docs)
	}

	static addDocs() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: {
					init: ['ps_ws_1.pspace', 'dg1_ws_1.dg'],
					add: ['dg2_ws_1.dg', 'dg3_ws_1.dg']
				},
				output: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg']
			}
		]

		async function test(testCase) : Promise<void> {
			const init : string[] = testCase.input.init
			const add : string[] = testCase.input.add
			const output = testCase.output
			let instance = await LanguageServicesFacade_UnitTests.create(init)
			instance.addDocs(add.map(createTextDocFromUrl))
			const result = Array.from(instance.services.fileManagers.keys())
			//assert.deepEqual(result, output)
			expect(output).to.deep.equalInAnyOrder(result)
		}

		describe('addDocs', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	static updateDoc() {
		
	}

	static removeDoc() {
		
	}

	static onDefinition() {
		
	}

	// these functions are called when the request is first made from the server
	static onReferences() {
	
	}

	static onPrepareRename() {

	}

	static onRenameRequest() {

	}

	static onCompletion() {

	}

	static onCompletionResolve() {
		
	}

	static onFoldingRanges() {

	}
}



//LanguageServices_UnitTests.runTests()
LanguageServicesFacade_UnitTests.runTests()