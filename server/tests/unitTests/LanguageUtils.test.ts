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

function getTextFromUri(uri : string) : string {
	let dataEntry = TestData.data.find(e => e.uri === uri)
	if(isNullOrUndefined(dataEntry)) {return null}
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
			getTests: function() : any[] {
				let result = []
				this.methods.forEach(method => {
					const getTree = function(testCase) : Promise<Parser.Tree> {
						const input = testCase.input						
						const uri : string = input[0]
						let text = getTextFromUri(uri)
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
					title : "getAllDefinitionsOfNodeInDocument",
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
							tests.push({test: test , method: this})
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
					title : "getAllReferencesOfNodeInDocument",
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
							tests.push({test: test , method: this})
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
				,{
					method: TestTarget.DecisionGraphServices.getAllReferencesOfSlotInDocument,
					title : "getAllReferencesOfSlotInDocument",
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
							tests.push({test: test , method: this})
						})
						return tests
					},
					cases:
					[
						{
							input: ['dg1.dg', 'Mid1'],
							output: [
								{
								  end: {
									character: 14,
									line: 14
								  },
								  start: {
									character: 10,
									line: 14
								  }
								},
								{
								  end: {
									character: 19,
									line: 15
								  },
								  start: {
									character: 15,
									line: 15
								  }
								}
							  ]
						}
					]
				},
				{
					method: TestTarget.DecisionGraphServices.getAllReferencesOfSlotValueInDocument,
					title : "getAllReferencesOfSlotValueInDocument",
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
							tests.push({test: test , method: this})
						})
						return tests
					},
					cases:
					[
						{
							input: ['dg1.dg', 'b1a'],
							output: [
								{
								  end: {
									character: 26,
									line: 14
								  },
								  start: {
									character: 23,
									line: 14
								  }
								},
								{
								  end: {
									character: 10,
									line: 16
								  },
								  start: {
									character: 7,
									line: 16
								  }
								}
							]
						}
					]
				},
				{
					method: TestTarget.DecisionGraphServices.getAllNodesInDocument,
					title : "getAllNodesInDocument",
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
							tests.push({test: test , method: this})
						})
						return tests
					},
					cases:
					[
						{
							input: ['dg2.dg'],
							output: [
								{
								  end: {
									character: 22,
									line: 0
								  },
								  start: {
									character: 0,
									line: 0
								  }
								},
								{
								  end: {
									character: 33,
									line: 4
								  },
								  start: {
									character: 0,
									line: 1
								  }
								},
								{
								  end: {
									character: 47,
									line: 2
								  },
								  start: {
									character: 0,
									line: 2
								  }
								},
								{
								  end: {
									character: 32,
									line: 4
								  },
								  start: {
									character: 0,
									line: 3
								  }
								},
								{
									end: {
									  character: 31,
									  line: 4
									},
									start: {
									  character: 1,
									  line: 4
									}
								},
								{
									end: {
									  character: 30,
									  line: 4
									},
									start: {
									  character: 7,
									  line: 4
									}
								}
							]
						}
					]
				}
			
			]
		},		
		{
			class: TestTarget.PolicySpaceServices,
			getTests: function() : any[] {
				let result = []
				this.methods.forEach(method => {
					const getTree = function(testCase) : Promise<Parser.Tree> {
						const input = testCase.input						
						const uri : string = input[0]
						let text = getTextFromUri(uri)
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
					method: TestTarget.PolicySpaceServices.getAllDefinitionsOfSlotInDocument,
					title : "getAllDefinitionsOfSlotInDocument",
					getTests: function(arg) {
						let tests = []
						this.cases.forEach(testCase => {
							const treePromise : Promise<Parser.Tree> = arg(testCase)
							let test = function(){
								treePromise.then((tree) => {
									const input = testCase.input						
									const output = testCase.output
									const name : string = input[1]
									let result : Range[] = TestTarget.PolicySpaceServices.getAllDefinitionsOfSlotInDocument(name, tree)
									assert.deepEqual(result, output)
								})
							}
							tests.push({test: test , method: this})
						})
						return tests
					},
					cases:
					[
						{
							input: ["ps1.pspace", "atomic_slot2"],
							output: [
								{
								  end: {
									character: 32,
									line: 5
								  },
								  start: {
									character: 0,
									line: 5
								  }
								}
							  ]
						}
					]
				},
				{
					method: TestTarget.PolicySpaceServices.getAllDefinitionsOfSlotValueInDocument,
					title : "getAllDefinitionsOfSlotValueInDocument",
					getTests: function(arg) {
						let tests = []
						this.cases.forEach(testCase => {
							const treePromise : Promise<Parser.Tree> = arg(testCase)
							let test = function(){
								treePromise.then((tree) => {
									const input = testCase.input						
									const output = testCase.output
									const name : string = input[1]
									let result : Range[] = TestTarget.PolicySpaceServices.getAllDefinitionsOfSlotInDocument(name, tree)
									assert.deepEqual(result, output)
								})
							}
							tests.push({test: test , method: this})
						})
						return tests
					},
					cases:
					[
						{
							input: ["ps1.pspace", "slotval1"], 
							output: [
								{
								  end: {
									character: 17,
									line: 3
								  },
								  start: {
									character: 0,
									line: 0
								  }
								},
								{
								  end: {
									character: 17,
									line: 8
								  },
								  start: {
									character: 0,
									line: 5
								  }
								},
								{
								  end: {
									character: 17,
									line: 13
								  },
								  start: {
									character: 0,
									line: 10
								  }
								},
								{
								  end: {
									character: 90,
									line: 15
								  },
								  start: {
									character: 0,
									line: 15
								  }
								}
							  ]
						}
					]
				}
				,{
					method: TestTarget.PolicySpaceServices.getAllSlotsInDocument,
					title : "getAllSlotsInDocument",
					getTests: function(arg) {
						let tests = []
						this.cases.forEach(testCase => {
							const treePromise : Promise<Parser.Tree> = arg(testCase)
							let test = function(){
								treePromise.then((tree) => {
									const input = testCase.input						
									const output = testCase.output
									let result : Range[] = TestTarget.PolicySpaceServices.getAllSlotsInDocument(tree)
									assert.deepEqual(result, output)
								})
							}
							tests.push({test: test , method: this})
						})
						return tests
					},
					cases:
					[
						{
							input: ["ps1.pspace"], 
							output: [
								{
								  end: {
									character: 17,
									line: 3
								  },
								  start: {
									character: 0,
									line: 0
								  }
								},
								{
								  end: {
									character: 17,
									line: 8
								  },
								  start: {
									character: 0,
									line: 5
								  }
								},
								{
								  end: {
									character: 17,
									line: 13
								  },
								  start: {
									character: 0,
									line: 10
								  }
								},
								{
								  end: {
									character: 90,
									line: 15
								  },
								  start: {
									character: 0,
									line: 15
								  }
								}
							  ]
						}
					]
				}

			]
		},		
		{
			class: TestTarget.ValueInferenceServices,
			getTests: function() : any[]{
				return []
			},
			methods:
			[
				{
					method: TestTarget.ValueInferenceServices.getAllReferencesOfSlotInDocument,
					getTests: function(arg) {
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
					getTests: function(arg) {
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
					getTests: function(arg) {
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
					getTests: function(arg) {
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



const stopOnError = true
function runTestCasesWithMocha(TestGenerator) {
	TestGenerator.classes.forEach(function(c) {
		let errors : Error[] = []
		const classMethodTests = c.getTests()
		// @ts-ignore
		classMethodTests.forEach(methodTests =>{
			describe(c.class.name + ' suite', function() {
				methodTests.forEach(test => {
					it(test.method.title, function(done) {
						if(stopOnError) {
							test.test()
							done();
						}
						else {
							try {
								test.test()
							} catch (error) {
								errors.push(error)
							}
							done();
						}
					});
				})
			})
		})
	
		if(!stopOnError) {
			errors.forEach(err => {
				console.log((err as Error).message)
			})
			if(errors.length){
				throw errors[0]
			}
		}
	});
}

runTestCasesWithMocha(staticLanguageLibTestCases)
