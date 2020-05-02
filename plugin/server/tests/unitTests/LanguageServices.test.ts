//https://stackoverflow.com/questions/22465431/how-can-i-dynamically-generate-test-cases-in-javascript-node

//https://samwize.com/2014/02/08/a-guide-to-mochas-describe-it-and-setup-hooks/


import * as TestTarget from "../../src/LanguageServices";
import * as TestData from "./testFixture/LanguageServicesTestFixtureData";
import * as Parser from 'web-tree-sitter';
import { isNullOrUndefined, inspect } from "util";
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
import { PMTextDocument } from "../../src/Documents";
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

function createPMTextDoc(uri : string, newText : string, oldRange : Range, newRange : Range) : PMTextDocument {
	let result : PMTextDocument = {
		uri : uri,
		languageId : null,
		version : null,
		getText : function(){return newText},
		positionAt: null,
		offsetAt: null,
		lineCount: null,
		isEqual: null,
		update: null,
		lastChanges: [{
			oldRange: oldRange,
			newRange: newRange
		}]
	}
	return result
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

async function getTree(uri : string) : Promise<Parser.Tree> {					
	let text = getTextFromUri(uri)
	return getParser(text, uri).then((parser) => {
		return parser.parse(text)
	})	
}

//for some reason it doesnt work
function runMochaTestCases(title : string,  testCases, testFunction) {
	describe('getDeclarations', function() {
		testCases.forEach((testCase, index) => {
			it(testCase.title , function(done) {
				testFunction(testCase).then(run => done()).catch(err => done(err))
			});
		})
	})
}

//old interface
function createTextDocFromUrl(uri : string) : TextDocWithChanges {
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

function createPMTextDocFromUrl(uri : string) : PMTextDocument {
	let text : string = getTextFromUri(uri)	
	return {
			uri: uri,
			languageId: null,
			version : null,
			getText : function() {return text},
			positionAt : null,
			offsetAt : null,
			isEqual : null,
			lineCount : null,
			update : null,
			lastChanges : []
		
	}
}

class LanguageServices_UnitTests {
	testTargetClass = TestTarget.LanguageServices

	static runTests() {
		let self = new LanguageServices_UnitTests()
		describe(self.testTargetClass.name + " unit tests", function() {
			self.getDeclarations()
			self.getReferences()
			self.getRangeOfDoc()
			self.createPolicyModelEntity()
			self.getFoldingRanges()
			//self.getCompletion()
		})
	}

	async create(filenames : string[]) : Promise<TestTarget.LanguageServices> {
		//let text : string = getTextFromUri(filename)
		let docs : PMTextDocument[]
		docs = filenames.map(createPMTextDocFromUrl)
		return await TestTarget.LanguageServices.init(docs,process.cwd());
	}

	//Test
	getDeclarations() {
		let self = this
		const testCases = 
		[
			{
				title: 'sanity node',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 2, line: 4},end: {character: 2, line: 4}}, uri: 'dg1_ws_1.dg'}
				},
				output: [
					{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg1_ws_1.dg'},
					{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg2_ws_1.dg'},
					{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg3_ws_1.dg'},
				]
			},
			{
				title: 'sanity pspace',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 1, line: 10},end: {character: 1, line: 10}}, uri: 'ps_ws_1.pspace'}
				},
				output: [
					{range: {start: {character: 0, line: 10},end: {character: 14, line: 10}}, uri: 'ps_ws_1.pspace'}
				]
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filenames : string[] = input.fileNames
			const location : Location = input.location
			let instance = await self.create(filenames)
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
	getReferences() {
		let self = this
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
					{range: {start: {character: 45, line: 5},end: {character: 47, line: 5}}, uri: 'dg2_ws_1.dg'},
					{range: {start: {character: 45, line: 5},end: {character: 47, line: 5}}, uri: 'dg3_ws_1.dg'}, //TODO: this is a bug
				]
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filenames : string[] = input.fileNames
			const location : Location = input.location
			let instance = await self.create(filenames)
			const result = instance.getReferences(location)
			expect(output).to.deep.equalInAnyOrder(result)
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
	getRangeOfDoc() {
		let self = this
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
			let instance = await self.create(filenames)
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
	createPolicyModelEntity() {
		let self = this
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
			let instance = await self.create(filenames)
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
	getFoldingRanges() {
		let self = this
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
			},
			{
				title: 'pspace sanity',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: 'ps_ws_1.pspace'
				},
				output: [
					{range:{end:{character:26, line:3},start:{character:0,line:0}},uri:"ps_ws_1.pspace"},
					{range:{end:{character:26,line:8},start:{character:0,line:5}},uri:"ps_ws_1.pspace"},
					{range:{end:{character:32,line:13},start:{character:0,line:10}},uri:"ps_ws_1.pspace"},
					{range:{end:{character:91,line:15},start:{character:0,line:15}},uri:"ps_ws_1.pspace"},
				]
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filenames : string[] = input.fileNames
			const location : string = input.location
			let instance = await self.create(filenames)
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
	getCompletion() {
		//TODO:
		throw new Error("Method not implemented.");
	}
}

class LanguageServicesWithCache_UnitTests extends LanguageServices_UnitTests {
	testTargetClass = TestTarget.LanguageServicesWithCache

	static runTests() {
		let self = new LanguageServicesWithCache_UnitTests()
		describe(self.testTargetClass.name + " unit tests", function() {
			self.getDeclarations()
			self.getReferences()
			self.getRangeOfDoc()
			self.createPolicyModelEntity()
			self.getFoldingRanges()
			//self.getCompletion()
		})
	}

	async create(filenames : string[]) : Promise<TestTarget.LanguageServicesWithCache> {
		let docs : PMTextDocument[]
		docs = filenames.map(createPMTextDocFromUrl)
		return await TestTarget.LanguageServicesWithCache.init(docs,process.cwd());
	}
}



class LanguageServicesFacade_UnitTests {
	testTargetClass = TestTarget.LanguageServicesFacade

	static runTests() {
		let self = new LanguageServicesFacade_UnitTests()
		describe(self.testTargetClass.name + " unit tests", function() {
			self.addDocs()
			self.updateDoc()
			self.removeDoc()
			self.onDefinition()
			self.onReferences()
			self.onPrepareRename()
			self.onRenameRequest()
			self.onFoldingRanges()
			//self.onCompletion()
			//self.onCompletionResolve()
		})
	}

	async create(filenames : string[]) : Promise<TestTarget.LanguageServicesFacade> {
		let docs : PMTextDocument[]
		docs = filenames.map(createPMTextDocFromUrl)
		return await TestTarget.LanguageServicesFacade.init(docs,process.cwd());
	}

	addDocs() {
		let self = this
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
			let instance = await self.create(init)
			instance.addDocs(add.map(createPMTextDocFromUrl))
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

	updateDoc() {
		let self = this
		const testCases = 
		[
			{
				title: 'sanity',
				input: {
					init: ['ps1.pspace'],
					update: {
						url : 'ps1.pspace',
						text : `new_name [atomic_slot_desc.]: one of` +
								`	slotval1 [desc],` +
								`	slotval2 [desc],` +
								`	slot1val3 [desc].`,
						oldRange: {start: {character: 0, line: 0},end: {character: 8, line: 0}},
						newRange : {start: {character: 0, line: 0},end: {character: 8, line: 0}},
					}
				},
				output: {name: 'new_name' , type : TestTarget.PolicyModelEntityType.Slot}
			}
		]

		async function test(testCase) : Promise<void> {
			const init : string[] = testCase.input.init
			let update : PMTextDocument = createPMTextDoc(testCase.input.update.url, testCase.input.update.text, testCase.input.update.oldRange, testCase.input.update.newRange)
			const output = testCase.output
			let instance = await self.create(init)
			instance.updateDoc(update)
			let result = instance.services.createPolicyModelEntity({range:{start: {character: 1, line: 0},end: {character: 1, line: 0}}, uri: 'ps1.pspace'})
			assert.equal(result.getName(), output.name)
			assert.equal(result.getType(), output.type)
		}

		describe('updateDoc', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	removeDoc() {
		let self = this
		const testCases = 
		[
			{
				title: 'sanity',
				input: {
					init: ['ps_ws_1.pspace', 'dg1_ws_1.dg'],
					remove: 'dg1_ws_1.dg'
				},
				output: ['ps_ws_1.pspace']
			}
		]

		async function test(testCase) : Promise<void> {
			const init : string[] = testCase.input.init
			const remove : string = testCase.input.remove
			const output = testCase.output
			let instance = await self.create(init)
			instance.removeDoc(remove)
			const result = Array.from(instance.services.fileManagers.keys())
			expect(output).to.deep.equalInAnyOrder(result)
		}

		describe('removeDoc', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	onDefinition() {
		let self = this
		const testCases = 
		[
			{
				title: 'node sanity',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					param: {textDocument: {uri: 'dg1_ws_1.dg'}, position: {character: 2, line: 4} }
				},
				output: [
					{targetRange: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, targetUri: 'dg1_ws_1.dg', targetSelectionRange: {start: {character: 0, line: 1},end: {character: 0, line: 12}}},
					{targetRange: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, targetUri: 'dg2_ws_1.dg', targetSelectionRange: {start: {character: 0, line: 1},end: {character: 0, line: 11}}},
					{targetRange: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, targetUri: 'dg3_ws_1.dg', targetSelectionRange: {start: {character: 0, line: 1},end: {character: 0, line: 11}}},
				]
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filenames : string[] = input.fileNames
			const param : DeclarationParams = input.param
			let instance = await self.create(filenames)
			const result = instance.onDefinition(param)
			assert.deepEqual(result, output)
		}

		describe('onDefinition', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	// these functions are called when the request is first made from the server
	onReferences() {
		let self = this
		const testCases = 
		[
			{
				title: 'node sanity',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					param: {textDocument: {uri: 'dg1_ws_1.dg'}, position: {character: 2, line: 4} }
				},
				output: [
					{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg1_ws_1.dg'},
					{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg2_ws_1.dg'},
					{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg3_ws_1.dg'},
					{range: {start: {character: 45, line: 5},end: {character: 47, line: 5}}, uri: 'dg2_ws_1.dg'},
					{range: {start: {character: 45, line: 5},end: {character: 47, line: 5}}, uri: 'dg3_ws_1.dg'}, //TODO: this is a bug
				]
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filenames : string[] = input.fileNames
			const param : ReferenceParams = input.param
			let instance = await self.create(filenames)
			const result = instance.onReferences(param)
			assert.deepEqual(result, output)
		}

		describe('onReferences', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	onPrepareRename() {
		let self = this
		const testCases = 
		[
			{
				title: 'node sanity',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					param: {textDocument: {uri: 'dg1_ws_1.dg'}, position: {character: 2, line: 4} }
				},
				output: {start: {character: 2, line: 4}, end: {character: 4, line: 4}},
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filenames : string[] = input.fileNames
			const param : RenameParams = input.param
			let instance = await self.create(filenames)
			const result = instance.onPrepareRename(param)
			assert.deepEqual(result, output)
		}

		describe('onPrepareRename', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}

	onRenameRequest() {
		let self = this
		const testCases = 
		[
			{
				title: 'node sanity',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					param: {textDocument: {uri: 'dg1_ws_1.dg'}, position: {character: 2, line: 4} }
				},
				output: [
					{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg1_ws_1.dg'},
					{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg2_ws_1.dg'},
					{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg3_ws_1.dg'},
					{range: {start: {character: 45, line: 5},end: {character: 47, line: 5}}, uri: 'dg2_ws_1.dg'},
					{range: {start: {character: 45, line: 5},end: {character: 47, line: 5}}, uri: 'dg3_ws_1.dg'}, //TODO: this is a bug?
				]
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filenames : string[] = input.fileNames
			const param : RenameParams = input.param
			let instance = await self.create(filenames)
			const result = instance.onRenameRequest(param)
			assert.deepEqual(result, output)
		}

		describe('onRenameRequest', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}
	
	onFoldingRanges() {
		let self = this
		const testCases = 
		[
			{
				title: 'node sanity',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					param: {textDocument: {uri: 'dg1_ws_1.dg'}}
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
			const output = testCase.output
			const filenames : string[] = testCase.input.fileNames
			const param : FoldingRangeParams = testCase.input.param
			let instance = await self.create(filenames)
			const result = instance.onFoldingRanges(param)
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

	onCompletion() {
		//TODO:
		throw new Error("Method not implemented.");
	}

	onCompletionResolve() {
		//TODO:
		throw new Error("Method not implemented.");
	}
}

class DecisionGraphServices_UnitTests {
	testTargetClass = TestTarget.DecisionGraphServices

	static runTests() {
		let self = new DecisionGraphServices_UnitTests()
		describe(self.testTargetClass.name + " unit tests", function() {
			self.getAllEntitiesInDoc()
		})
	}

	getAllEntitiesInDoc() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: 'dg2.dg',
				output: [
					{"category": 0, "name": "import_node", "type": 0, }, 
					{"category": 1, "name": "findme", "type": 0, }, 
					{"category": 0, "name": "ask_node", "type": 0, }, 
					{"category": 0, "name": "text_sub_node", "type": 0, }, 
					{"category": 0, "name": "answer_sub_node", "type": 0, }, 
					{"category": 0, "name": "answers_sub_node", "type": 0, },
					{"category": 1, "name": "yo", "type": 0, }, 
					{"category": 0, "name": "call_node", "type": 0, }, 
					{"category": 2, "name": "findme", "type": 0, }, 		
				]
			}
		]

		async function test(testCase) : Promise<void> {
			return getTree(testCase.input).then(tree => {
				let uri : DocumentUri = testCase.input
				const output = testCase.output
				const result = TestTarget.DecisionGraphServices.getAllEntitiesInDoc(tree, uri).map(e => {
					return {
						name: e.getName(),
						type: e.getType(),
						category: e.getCategory()
					}
				})
				expect(output).to.deep.equalInAnyOrder(result)
			})
		}

		describe('getAllEntitiesInDoc', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}
}



DecisionGraphServices_UnitTests.runTests()
LanguageServices_UnitTests.runTests()
LanguageServicesFacade_UnitTests.runTests()
LanguageServicesWithCache_UnitTests.runTests()


