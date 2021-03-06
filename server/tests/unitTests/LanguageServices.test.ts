//https://stackoverflow.com/questions/22465431/how-can-i-dynamically-generate-test-cases-in-javascript-node

//https://samwize.com/2014/02/08/a-guide-to-mochas-describe-it-and-setup-hooks/


import * as TestTarget from "../../src/LanguageServices";
import * as Utils from '../../src/Utils';
import {
	DecisionGraphKeywords,
	PolicySpaceKeywords,
	ValueInferenceKeywords,
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
	docChange2Edit,
	Uri2FilePath
} from '../../src/Utils';
import * as assert from 'assert';
import * as mocha from 'mocha'; 
import { PMTextDocument } from "../../src/Documents";
import { URI } from 'vscode-uri';
import * as path from 'path';

const deepEqualInAnyOrder = require('deep-equal-in-any-order');
const chai = require('chai');
const expect = chai.expect;
chai.use(deepEqualInAnyOrder);


function getTextFromUri(uri : string) : string | null {
	let dataEntry = TestData.data.find(e => e.uri === uri)
	if(isNullOrUndefined(dataEntry)) {return null}
	return dataEntry.text
}

const dir = "e:"
function normalizeFileName(filename : string) : string {
	//return dir.concat(path.sep.concat(filename))
	return Utils.Uri2FilePath(filename)
}

function createPMTextDoc(uri : string, newText : string, oldRange : Range, newRange : Range) : PMTextDocument {
	let result : PMTextDocument = {
		uri : normalizeFileName(uri),
		path: normalizeFileName(uri),
		//path: URI.parse(uri).fsPath,
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


function createPMTextDocFromUrl(uri : string) : PMTextDocument {
	let text : string = getTextFromUri(uri)	
	return {
			uri: normalizeFileName(uri),
			path: normalizeFileName(uri),
			//path: URI.parse(uri).fsPath,
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
// function createTextDocFromUrl(uri : string) : TextDocWithChanges {
// 	let text : string = getTextFromUri(uri)	
// 	return {
// 		textDocument : {
// 			uri: uri,
// 			languageId: null,
// 			version : null,
// 			getText : function() {return text},
// 			positionAt : null,
// 			offsetAt : null,
// 			lineCount : null
// 		},
// 		changes : [{text : text}]
// 	}
// }




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
			//self.onFoldingRanges() //NO LONGER SUPPORTED
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
			const output = testCase.output.map(normalizeFileName)
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
				output: {name: 'new_name' , type : PolicyModelEntityType.Slot}
			}
		]

		async function test(testCase) : Promise<void> {
			const init : string[] = testCase.input.init
			let update : PMTextDocument = createPMTextDoc(testCase.input.update.url, testCase.input.update.text, testCase.input.update.oldRange, testCase.input.update.newRange)
			const output = testCase.output
			let instance = await self.create(init)
			instance.updateDoc(update)
			let result = instance.services.createPolicyModelEntity({range:{start: {character: 1, line: 0},end: {character: 1, line: 0}}, uri: normalizeFileName('ps1.pspace')})
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
			const remove : string = normalizeFileName(testCase.input.remove)
			const output = testCase.output.map(normalizeFileName)
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
				title: 'sanity dg->node',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					param: {textDocument: {uri: 'dg1_ws_1.dg'}, position: {character: 2, line: 4} }
				},
				output: [
					{targetRange: {start: {character: 0, line: 1},end: {character: 0, line: 12}}, targetUri: 'dg1_ws_1.dg', 
					targetSelectionRange: {start: {character: 2, line: 4},end: {character: 4, line: 4}}},
				]
			}
			,{
				title: 'sanity pspace->slot',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					param: {textDocument: {uri: 'ps_ws_1.pspace'}, position: {character: 0, line: 0} }
				},
				output: [
					{targetRange: {start: {character: 0, line: 0},end: {character: 0, line: 16}}, targetUri: 'ps_ws_1.pspace', 
					targetSelectionRange: {start: {character: 0, line: 0},end: {character: 12, line: 0}}},
				]
			},
			{
				title: 'sanity dg->slot',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					param: {textDocument: {uri: 'dg1_ws_1.dg'}, position: {character: 16, line: 8} }
				},
				output: [
					{targetRange: {start: {character: 0, line: 0},end: {character: 0, line: 16}}, targetUri: 'ps_ws_1.pspace', 
					targetSelectionRange: {start: {character: 0, line: 0},end: {character: 12, line: 0}}},
				]
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			let output = testCase.output
			output.forEach(element => {
				//element.targetUri = Utils.FilePath2Uri(element.targetUri)
				element.targetUri = normalizeFileName(element.targetUri)
			});
			const filenames : string[] = input.fileNames
			let param : DeclarationParams = input.param
			param.textDocument.uri = normalizeFileName(param.textDocument.uri)
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
					//{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg2_ws_1.dg'},
					// {range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg3_ws_1.dg'},
					{range: {start: {character: 45, line: 5},end: {character: 47, line: 5}}, uri: 'dg2_ws_1.dg'},
					// {range: {start: {character: 45, line: 5},end: {character: 47, line: 5}}, uri: 'dg3_ws_1.dg'}, //TODO: this is a bug
				]
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			let output = testCase.output
			output.forEach(element => {
				//element.uri = Utils.FilePath2Uri(element.uri)
				element.uri = normalizeFileName(element.uri)
			});
			const filenames : string[] = input.fileNames
			let param : ReferenceParams = input.param
			param.textDocument.uri = normalizeFileName(param.textDocument.uri)
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
			let output = testCase.output
			const filenames : string[] = input.fileNames
			let param : RenameParams = input.param
			param.textDocument.uri = normalizeFileName(param.textDocument.uri)
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
					//{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg2_ws_1.dg'},
					// {range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg3_ws_1.dg'},
					{range: {start: {character: 45, line: 5},end: {character: 47, line: 5}}, uri: 'dg2_ws_1.dg'},
					// {range: {start: {character: 45, line: 5},end: {character: 47, line: 5}}, uri: 'dg3_ws_1.dg'}, //TODO: this is a bug
				]
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			let output = testCase.output
			output.forEach(element => {
				//element.uri = Utils.FilePath2Uri(element.uri)
				element.uri = normalizeFileName(element.uri)
			});
			const filenames : string[] = input.fileNames
			let param : RenameParams = input.param
			param.textDocument.uri = normalizeFileName(param.textDocument.uri)
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
			let output = testCase.output
			output.forEach(element => {
				//element.uri = Utils.FilePath2Uri(element.uri)
				element.uri = normalizeFileName(element.uri)
			});
			const filenames : string[] = testCase.input.fileNames
			const param : FoldingRangeParams = testCase.input.param
			param.textDocument.uri = normalizeFileName(param.textDocument.uri)
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


class LanguageServices_UnitTests {
	testTargetClass = TestTarget.LanguageServices

	static runTests() {
		let self = new LanguageServices_UnitTests()
		describe(self.testTargetClass.name + " unit tests", function() {
			self.getDeclarations()
			self.getReferences()
			self.getRangeOfDoc()
			self.createPolicyModelEntity()
			//self.getFoldingRanges() //NO LONGER SUPPORTED
		})
	}

	async create(filenames : string[]) : Promise<TestTarget.LanguageServices> {
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
				title: 'dg->node def',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 2, line: 4},end: {character: 2, line: 4}}, uri: 'dg1_ws_1.dg'} // >n1<
				},
				output: [
					{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg1_ws_1.dg'},
				]
			},			
			{
				title: 'dg->slot def',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 15, line: 8},end: {character: 15, line: 8}}, uri: 'dg1_ws_1.dg'} // atomic_slot1
				},
				output: [
					{range: {start: {character: 0, line: 0},end: {character: 12, line: 0}}, uri: 'ps_ws_1.pspace'}
				]
			},			
			{
				title: 'dg->slotvalue def',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 30, line: 8},end: {character: 30, line: 8}}, uri: 'dg1_ws_1.dg'} // atomic_slot1_val1
				},
				output: [
					{range: {start: {character: 1, line: 1},end: {character: 18, line: 1}}, uri: 'ps_ws_1.pspace'}
				]
			}
			,{
				title: 'pspace->slot def',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 1, line: 10},end: {character: 1, line: 10}}, uri: 'ps_ws_1.pspace'} // aggregate_slot
				},
				output: [
					{range: {start: {character: 0, line: 10},end: {character: 14, line: 10}}, uri: 'ps_ws_1.pspace'}
				]
			}
			,{
				title: 'pspace->slotvalue def',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 1, line: 1},end: {character: 1, line: 1}}, uri: 'ps_ws_1.pspace'} // atomic_slot1_val1
				},
				output: [
					{range: {start: {character: 1, line: 1},end: {character: 18, line: 1}}, uri: 'ps_ws_1.pspace'}
				]
			}
			,{
				title: 'vi->slot def',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 1, line: 1},end: {character: 1, line: 1}}, uri: 'vi_ws_1.vi'} // atomic_slot1
				},
				output: [
					{range: {start: {character: 0, line: 0},end: {character: 12, line: 0}}, uri: 'ps_ws_1.pspace'}
				]
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			let output = testCase.output
			output.forEach(element => {
				element.uri = normalizeFileName(element.uri)
			});
			const filenames : string[] = input.fileNames
			let location : Location = input.location
			location.uri = normalizeFileName(location.uri)
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
				title: 'dg->node ref',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 2, line: 4},end: {character: 2, line: 4}}, uri: 'dg1_ws_1.dg'}
				},
				output: [
					{range: {start: {character: 2, line: 4},end: {character: 4, line: 4}}, uri: 'dg1_ws_1.dg'},
					{range: {start: {character: 45, line: 5},end: {character: 47, line: 5}}, uri: 'dg2_ws_1.dg'},
				]
			},
			{
				title: 'dg->slot ref',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 15, line: 8},end: {character: 15, line: 8}}, uri: 'dg1_ws_1.dg'} // atomic_slot1
				},
				output: [
					{range: {start: {character: 0, line: 0},end: {character: 12, line: 0}}, uri: 'ps_ws_1.pspace'},
					{range: {start: {character: 48, line: 15},end: {character: 60, line: 15}}, uri: 'ps_ws_1.pspace'},
					{range: {start: {character: 15, line: 8},end: {character: 27, line: 8}}, uri: 'dg1_ws_1.dg'},
					{range: {start: {character: 2, line: 5},end: {character: 14, line: 5}}, uri: 'dg2_ws_1.dg'},
					{range: {start: {character: 2, line: 5},end: {character: 14, line: 5}}, uri: 'dg3_ws_1.dg'},
					{range: {start: {character: 1, line: 1},end: {character: 13, line: 1}}, uri: 'vi_ws_1.vi'},
				]
			},
			{
				title: 'dg->slotvalue ref',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 30, line: 8},end: {character: 30, line: 8}}, uri: 'dg1_ws_1.dg'} // atomic_slot1_val1
				},
				output: [
					{range: {start: {character: 1, line: 1},end: {character: 18, line: 1}}, uri: 'ps_ws_1.pspace'},
					{range: {start: {character: 30, line: 8},end: {character: 47, line: 8}}, uri: 'dg1_ws_1.dg'},
					{range: {start: {character: 15, line: 5},end: {character: 32, line: 5}}, uri: 'dg2_ws_1.dg'},
					{range: {start: {character: 15, line: 5},end: {character: 32, line: 5}}, uri: 'dg3_ws_1.dg'},
					{range: {start: {character: 77, line: 2},end: {character: 94, line: 2}}, uri: 'vi_ws_1.vi'},
				]
			},
			{
				title: 'pspace->slot ref',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 1, line: 10},end: {character: 1, line: 10}}, uri: 'ps_ws_1.pspace'} // aggregate_slot
				},
				output: [
					{range: {start: {character: 76, line: 15},end: {character: 90, line: 15}}, uri: 'ps_ws_1.pspace'},
					{range: {start: {character: 15, line: 9},end: {character: 29, line: 9}}, uri: 'dg1_ws_1.dg'},
					{range: {start: {character: 0, line: 10},end: {character: 14, line: 10}}, uri: 'ps_ws_1.pspace'},
					{range: {start: {character: 34, line: 2},end: {character: 48, line: 2}}, uri: 'vi_ws_1.vi'},
				]
			},
			{
				title: 'pspace->slotvalue ref',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 1, line: 1},end: {character: 1, line: 1}}, uri: 'ps_ws_1.pspace'} // atomic_slot1_val1
				},
				output: [
					{range: {start: {character: 1, line: 1},end: {character: 18, line: 1}}, uri: 'ps_ws_1.pspace'},
					{range: {start: {character: 30, line: 8},end: {character: 47, line: 8}}, uri: 'dg1_ws_1.dg'},
					{range: {start: {character: 15, line: 5},end: {character: 32, line: 5}}, uri: 'dg2_ws_1.dg'},
					{range: {start: {character: 15, line: 5},end: {character: 32, line: 5}}, uri: 'dg3_ws_1.dg'},
					{range: {start: {character: 77, line: 2},end: {character: 94, line: 2}}, uri: 'vi_ws_1.vi'},
				]
			},
			{
				title: 'vi->slot ref',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 1, line: 1},end: {character: 1, line: 1}}, uri: 'vi_ws_1.vi'} // atomic_slot1
				},
				output: [
					{range: {start: {character: 0, line: 0},end: {character: 12, line: 0}}, uri: 'ps_ws_1.pspace'},
					{range: {start: {character: 48, line: 15},end: {character: 60, line: 15}}, uri: 'ps_ws_1.pspace'},
					{range: {start: {character: 15, line: 8},end: {character: 27, line: 8}}, uri: 'dg1_ws_1.dg'},
					{range: {start: {character: 2, line: 5},end: {character: 14, line: 5}}, uri: 'dg2_ws_1.dg'},
					{range: {start: {character: 2, line: 5},end: {character: 14, line: 5}}, uri: 'dg3_ws_1.dg'},
					{range: {start: {character: 1, line: 1},end: {character: 13, line: 1}}, uri: 'vi_ws_1.vi'},
				]
			},
			{
				title: 'vi->slotvalue ref',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 79, line: 2},end: {character: 79, line: 2}}, uri: 'vi_ws_1.vi'} // atomic_slot1_val1
				},
				output: [
					{range: {start: {character: 1, line: 1},end: {character: 18, line: 1}}, uri: 'ps_ws_1.pspace'},
					{range: {start: {character: 30, line: 8},end: {character: 47, line: 8}}, uri: 'dg1_ws_1.dg'},
					{range: {start: {character: 15, line: 5},end: {character: 32, line: 5}}, uri: 'dg2_ws_1.dg'},
					{range: {start: {character: 15, line: 5},end: {character: 32, line: 5}}, uri: 'dg3_ws_1.dg'},
					{range: {start: {character: 77, line: 2},end: {character: 94, line: 2}}, uri: 'vi_ws_1.vi'},
				]
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			let output = testCase.output
			output.forEach(element => {
				element.uri = normalizeFileName(element.uri)
			});
			const filenames : string[] = input.fileNames
			let location : Location = input.location
			location.uri = normalizeFileName(location.uri)
			let instance = await self.create(filenames)
			const result = instance.getReferences(location)
			expect(result).to.deep.equalInAnyOrder(output)
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
			let input = testCase.input
			let output = testCase.output
			let filenames : string[] = input.fileNames //.map(absoluteFileName)
			let filename : string = normalizeFileName(input.location)
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
				output: {name : 'n1', type : PolicyModelEntityType.DGNode}
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filenames : string[] = input.fileNames
			let location : Location = input.location
			location.uri = normalizeFileName(location.uri)
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
				title: 'dg sanity',
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
			let output = testCase.output
			output.forEach(e=> e.uri = normalizeFileName(e.uri))
			const filenames : string[] = input.fileNames
			const location : string = normalizeFileName(input.location)
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
			//self.getFoldingRanges() //NO LONGER SUPPORTED
			self.getCompletion()
		})
	}

	async create(filenames : string[]) : Promise<TestTarget.LanguageServicesWithCache> {
		let docs : PMTextDocument[]
		docs = filenames.map(createPMTextDocFromUrl)
		return await TestTarget.LanguageServicesWithCache.init(docs,process.cwd());
	} 

	//Test
	getCompletion() {
		let self = this
		const testCases = 
		[
			{
				title: 'dg->autocomplete',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 0, line: 0},end: {character: 0, line: 0}}, uri: 'dg1_ws_1.dg'}
				},
				keywords: DecisionGraphKeywords,
				output: [
					{label: 'n1', kind: 6},
					{label: 'n2', kind: 6},
					{label: 'n3', kind: 6},
					{label: 'n_end', kind: 6},

					{label: 'dg2>n1', kind: 6},
					//{label: 'dg2>n2', kind: 6},
					{label: 'dg2>n_end', kind: 6},

					{label: 'dg3>n1', kind: 6},
					//{label: 'dg3>n2', kind: 6},
					{label: 'dg3>n_end', kind: 6},

					{label: 'n4', kind: 6},
					// {label: 'atomic_slot1', kind: 13},
					// {label: 'compound_slot', kind: 13},
					// {label: 'aggregate_slot', kind: 13},

					{label: 'atomic_slot1', kind: 13},
					{label: 'atomic_slot2', kind: 13},
					{label: 'aggregate_slot', kind: 13},
					{label: 'compound_slot', kind: 13},

					{label: 'atomic_slot1_val1', kind: 12},
					{label: 'atomic_slot1_val2', kind: 12},
					{label: 'atomic_slot1_val3', kind: 12},
					
					{label: 'atomic_slot2_val1', kind: 12},
					{label: 'atomic_slot2_val2', kind: 12},
					{label: 'atomic_slot2_val3', kind: 12},

					{label: 'aggregate_slot_slotval1', kind: 12},
					{label: 'aggregate_slot_slotval2', kind: 12},
					{label: 'aggregate_slot_slotval3', kind: 12},
				]
			},
			{
				title: 'pspace->autocomplete',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 0, line: 0},end: {character: 0, line: 0}}, uri: 'ps_ws_1.pspace'}
				},
				keywords: PolicySpaceKeywords,
				output: [
					{label: 'atomic_slot1', kind: 13},
					{label: 'atomic_slot2', kind: 13},
					{label: 'aggregate_slot', kind: 13},
					{label: 'compound_slot', kind: 13},

					{label: 'atomic_slot1_val1', kind: 12},
					{label: 'atomic_slot1_val2', kind: 12},
					{label: 'atomic_slot1_val3', kind: 12},
					
					{label: 'atomic_slot2_val1', kind: 12},
					{label: 'atomic_slot2_val2', kind: 12},
					{label: 'atomic_slot2_val3', kind: 12},

					{label: 'aggregate_slot_slotval1', kind: 12},
					{label: 'aggregate_slot_slotval2', kind: 12},
					{label: 'aggregate_slot_slotval3', kind: 12},
				]
			},
			{
				title: 'vi->autocomplete',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 0, line: 0},end: {character: 0, line: 0}}, uri: 'vi_ws_1.vi'}
				},
				keywords: ValueInferenceKeywords,
				output: [
					{label: 'atomic_slot1', kind: 13},
					{label: 'atomic_slot2', kind: 13},
					{label: 'aggregate_slot', kind: 13},
					{label: 'compound_slot', kind: 13},

					{label: 'atomic_slot1_val1', kind: 12},
					{label: 'atomic_slot1_val2', kind: 12},
					{label: 'atomic_slot1_val3', kind: 12},
					
					{label: 'atomic_slot2_val1', kind: 12},
					{label: 'atomic_slot2_val2', kind: 12},
					{label: 'atomic_slot2_val3', kind: 12},

					{label: 'aggregate_slot_slotval1', kind: 12},
					{label: 'aggregate_slot_slotval2', kind: 12},
					{label: 'aggregate_slot_slotval3', kind: 12},
				]
			}
		]

		async function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filenames : string[] = input.fileNames
			let location : Location = input.location
			location.uri = normalizeFileName(location.uri)
			let outputWithKeywords = output.concat(testCase.keywords)
			let instance = await self.create(filenames)
			const result = instance.getCompletion(location)
			expect(outputWithKeywords).to.deep.equalInAnyOrder(result.items)
		}

		describe('getCompletion', function() {
			testCases.forEach((testCase, index) => {
				it(testCase.title , function(done) {
					test(testCase).then(run => done()).catch(err => done(err))
				});
			})
		})
	}
}




class DecisionGraphServices_UnitTests {
	testTargetClass = DecisionGraphServices

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
					{"category": PolicyModelEntityCategory.Special, "name": "dg", "type": PolicyModelEntityType.ImportGraph, }, 
					{"category": PolicyModelEntityCategory.Declaration, "name": "findme", "type": PolicyModelEntityType.DGNode, }, 
					{"category": PolicyModelEntityCategory.Reference, "name": "findme", "type": PolicyModelEntityType.DGNode, }, 
					{"category": PolicyModelEntityCategory.Declaration, "name": "yo", "type": PolicyModelEntityType.DGNode, }, 

					// -- old folding range results
					// {"category": 0, "name": "call_node", "type": 0, }, 
					// {"category": 0, "name": "import_node", "type": 0, }, 
					// {"category": 0, "name": "ask_node", "type": 0, }, 
					// {"category": 0, "name": "text_sub_node", "type": 0, }, 
					// {"category": 0, "name": "answer_sub_node", "type": 0, }, 
					// {"category": 0, "name": "answers_sub_node", "type": 0, },	
				]
			}
		]

		async function test(testCase) : Promise<void> {
			return getTree(testCase.input).then(tree => {
				let uri : DocumentUri = testCase.input
				const output = testCase.output
				const result = DecisionGraphServices.getAllEntitiesInDoc(tree, uri).entities.map(e => {
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


