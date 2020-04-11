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

function getTextFromUri(uri : string, data) : string {
	let dataEntry = data.find(e => e.uri === uri)
	//if(isNullOrUndefined(dataEntry)) { console.log(uri)}
	return dataEntry.text
}

function getLanguageByExtension(extension : string) : TestTarget.PolicyModelsLanguage {
	const correspondingInfo = parsersInfo.filter(info => info.fileExtentsions.indexOf(extension) != -1)
	if(!(correspondingInfo) || correspondingInfo.length == 0) return null
	return correspondingInfo[0].language
}

function getParserWasmPathByExtension(extension : string) : string {
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

const staticLanguageLibTestCases = 
{
	classes : 
	[
		{
			class: TestTarget.DecisionGraphServices,
			getTests: function() {
				let result = []
				this.methods.forEach(method => {
					const getTree = function(testCase) : Promise<Parser.Tree> {
						const input = testCase.input						
						const uri : string = input[0]
						let text = getTextFromUri(uri, TestData.decisinGraphDocs)
						return getParser(text, uri).then((parser) => {
							return parser.parse(text)
						})	
					}
					result.push(method.getTests(getTree))
				});
				return result 
			},
			methods:
			[
				{
					method: TestTarget.DecisionGraphServices.getAllDefinitionsOfNodeInDocument,
					getTests: function(arg) {
						let tests = []
						this.cases.forEach(testCase => {
							const treePromise : Promise<Parser.Tree> = arg(testCase)
							let test = function(){
								treePromise.then((tree) => {
									const input = testCase.input						
									const output = testCase.output
									const name : string = input[1]
									let result : Range[] = TestTarget.DecisionGraphServices.getAllDefinitionsOfNodeInDocument(name, tree)
									assert.deepEqual(result, output)
								})
							}
							tests.push(test)
						})
						return tests
					},
					cases:
					[
						{
							input: [ 'dg1.dg','q-order'],
							output: [{end: {character: 9,line: 3},start: {character: 2,line: 3}}] //Range[]
						}
					]
				},
				{
					method: TestTarget.DecisionGraphServices.getAllReferencesOfNodeInDocument,
					getTests: function(arg) {
						let tests = []
						this.cases.forEach(testCase => {
							const treePromise : Promise<Parser.Tree> = arg(testCase)
							let test = function(){
								treePromise.then((tree) => {
									const input = testCase.input						
									const output = testCase.output
									const name : string = input[1]
									let result : Range[] = TestTarget.DecisionGraphServices.getAllReferencesOfNodeInDocument(name, tree)
									assert.deepEqual(result, output)
								})
							}
							tests.push(test)
						})
						return tests
					},
					cases:
					[
						{
							input: ['dg2.dg', 'findme'], 
							output: [{end: {character: 29,line: 4},start: {character: 20,line: 4}}] 
						}
					]
				}

			]}]}
				/*
				,{
					method: TestTarget.DecisionGraphServices.getAllReferencesOfSlotInDocument,
					getTests: function(arg) {
						let tests = []
						this.cases.forEach(testCase => {
							const treePromise : Promise<Parser.Tree> = arg(testCase)
							let test = function(){
								treePromise.then((tree) => {
									const input = testCase.input						
									const output = testCase.output
									const name : string = input[1]
									let result : Range[] = TestTarget.DecisionGraphServices.getAllReferencesOfSlotInDocument(name, tree)
									assert.deepEqual(result, output)
								})
							}
							tests.push(test)
						})
						return tests
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				},
				{
					method: TestTarget.DecisionGraphServices.getAllReferencesOfSlotValueInDocument,
					getTests: function(arg) {
						let tests = []
						this.cases.forEach(testCase => {
							const treePromise : Promise<Parser.Tree> = arg(testCase)
							let test = function(){
								treePromise.then((tree) => {
									const input = testCase.input						
									const output = testCase.output
									const name : string = input[1]
									let result : Range[] = TestTarget.DecisionGraphServices.getAllReferencesOfSlotValueInDocument(name, tree)
									assert.deepEqual(result, output)
								})
							}
							tests.push(test)
						})
						return tests
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				},
				{
					method: TestTarget.DecisionGraphServices.getAllNodesInDocument,
					getTests: function(arg) {
						let tests = []
						this.cases.forEach(testCase => {
							const treePromise : Promise<Parser.Tree> = arg(testCase)
							let test = function(){
								treePromise.then((tree) => {
									const input = testCase.input						
									const output = testCase.output
									const name : string = input[1]
									let result : Range[] = TestTarget.DecisionGraphServices.getAllNodesInDocument(tree)
									assert.deepEqual(result, output)
								})
							}
							tests.push(test)
						})
						return tests
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
			
			]
		},		
		{
			class: TestTarget.PolicySpaceServices,
			run: function() {
				this.methods.forEach(method => {
					method.run()
				});
			},
			methods:
			[
				{
					method: TestTarget.PolicySpaceServices.getAllDefinitionsOfSlotInDocument,
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				},
				{
					method: TestTarget.PolicySpaceServices.getAllDefinitionsOfSlotValueInDocument,
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				},
				{
					method: TestTarget.PolicySpaceServices.getAllSlotsInDocument,
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
			]
		},		
		{
			class: TestTarget.ValueInferenceServices,
			run: function() {
				this.methods.forEach(method => {
					method.run()
				});
			},
			methods:
			[
				{
					method: TestTarget.ValueInferenceServices.getAllReferencesOfSlotInDocument,
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				},
				{
					method: TestTarget.ValueInferenceServices.getAllReferencesOfSlotValueInDocument,
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				},
				{
					method: TestTarget.ValueInferenceServices.getAllValueInferencesInDocument,
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				},
				{
					method: TestTarget.ValueInferenceServices.getAllInferencePairsInDocument,
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
			]
		}
	]
}
*/

const FileManagerTestCases = {
	classes : 
	[
		{
			class: TestTarget.FileManagerFactory,
			run: function() {
				//TODO:
			},
			methods: 
			[
				{
					method: TestTarget.FileManagerFactory.create,
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
			]
		}
		,{
			class: TestTarget.DecisionGraphFileManager,
			run: function() {
				//TODO:
			},
			methods:
			[
				{
					method: "getAllDefinitions",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllReferences",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "createPolicyModelEntity",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllDefinitionsDGNode",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllDefinitionsSlot",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllDefinitionsSlotValue",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllReferencesDGNode",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllReferencesSlot",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllReferencesSlotValue",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getFoldingRanges",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAutoComplete",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
			]
		}
		,{
			class: TestTarget.PolicySpaceFileManager,
			run: function() {
				//TODO:
			},
			methods:
			[
				{
					method: "createPolicyModelEntity",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllDefinitionsDGNode",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllDefinitionsSlot",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllDefinitionsSlotValue",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllReferencesDGNode",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllReferencesSlot",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllReferencesSlotValue",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getFoldingRanges",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAutoComplete",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
			]
		}
		,{
			class: TestTarget.ValueInferenceFileManager,
			run: function() {
				//TODO:
			},
			methods:
			[
				{
					method: "createPolicyModelEntity",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllDefinitionsDGNode",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllDefinitionsSlot",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllDefinitionsSlotValue",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllReferencesDGNode",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllReferencesSlot",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAllReferencesSlotValue",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getFoldingRanges",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getAutoComplete",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
			]
		}
	]
}


const LanguageServicesTestCases = {
	classes : [
		{
			class: TestTarget.LanguageServices,
			run: function() {
				//TODO:
			},
			methods: 
			[
				{
					method: "addDocs",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "updateDoc",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "removeDoc",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "initParsers",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getLanguageByExtension",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getParserByExtension",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "populateMaps",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getFileManagerByLocation",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getDeclarations",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getReferences",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getFoldingRanges",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
				,{
					method: "getCompletion",
					run: function(arg) {
						//TODO:
					},
					cases:
					[
						{
							input: [], //TODO:
							output: [] //TODO:
						}
					]
				}
			]
		}
	]
}




staticLanguageLibTestCases.classes.forEach(function(c) {
	const classMethodTests = c.getTests()
	// @ts-ignore
	classMethodTests.forEach(methodTests =>{
		describe(c.class.name + ' suite', function() {
			methodTests.forEach(test => {
				it('', function(done) {
					test()
					done();
				});
			})
		})
	})
});


// FileManagerTestCases.classes.forEach(function(c) {
// 	describe(c.class.name + ' suite', function() {
// 		it('', function(done) {
// 		c.run()
// 		done();
// 		});
// 	});
// });

  
// LanguageServicesTestCases.classes.forEach(function(c) {
// 	describe(c.class.name + ' suite', function() {
// 		it('', function(done) {
// 		c.run()
// 		done();
// 		});
// 	});
// });
