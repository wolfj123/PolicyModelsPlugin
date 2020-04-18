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
import { TextDocWithChanges } from '../../src/DocumentChangesManager';

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



class LanguageServices_UnitTests {
	static testTargetClass = TestTarget.LanguageServices

	static runTests() {
		describe(LanguageServices_UnitTests.testTargetClass.name + " unit tests", function() {
			LanguageServices_UnitTests.getDeclarations()
		})
	}

	static create(filenames : string[]) : TestTarget.LanguageServices {
		//let text : string = getTextFromUri(filename)
		let docs : TextDocWithChanges[]
		docs = filenames.map(fn => {
			let text : string = getTextFromUri(fn)	
			return {
				textDocument : {
					uri: fn,
					languageId: null,
					version : null,
					getText : null,
					positionAt : null,
					offsetAt : null,
					lineCount : null
				},
				changes : [{text : text}]
			}
		})
		return new TestTarget.LanguageServices(docs)
	}

	//Test
	static getDeclarations() {
		const testCases = 
		[
			{
				title: 'sanity',
				input: {
					fileNames: ['ps_ws_1.pspace', 'dg1_ws_1.dg', 'dg2_ws_1.dg', 'dg3_ws_1.dg', 'vi_ws_1.vi'],
					location: {range: {start: {character: 2,line: 4},end: {character: 2,line: 4}},uri: 'dg1_ws_1.dg'}
				},
				output: []
			}
		]

		function test(testCase) : Promise<void> {
			const input = testCase.input
			const output = testCase.output
			const filenames : string[] = input.fileNames
			const location : Location = input.nodeName
			//let instancePromise : Promise<TestTarget.LanguageServices> = LanguageServices_UnitTests.create(filenames)
			//return instancePromise.then(instance =>{
			let promise : Promise<void> = new Promise(nul => {
				let instance = LanguageServices_UnitTests.create(filenames)
					const result = instance.getDeclarations(location)
					assert.deepEqual(result, output)
				})
			return promise
			//})
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
	static getReferences() {

	}

	//Test
	static getRangeOfDoc() {

	}

	//Test
	static createPolicyModelEntity() {

	}

	//Test
	static getFoldingRanges() {

	}

	//Test
	static getCompletion() {
		//TODO:
		throw new Error("Method not implemented.");
	}
}



LanguageServices_UnitTests.runTests()
