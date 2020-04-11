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
							input: ['dg1.dg', 'b1a'], //TODO:
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
							input: ['dg2.dg'], //TODO:
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
			getTests: function() : any[]{
				return []
			},
			methods:
			[
				{
					method: TestTarget.PolicySpaceServices.getAllDefinitionsOfSlotInDocument,
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
					method: TestTarget.PolicySpaceServices.getAllDefinitionsOfSlotValueInDocument,
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
					method: TestTarget.PolicySpaceServices.getAllSlotsInDocument,
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


const FileManagerTestCases = {
	classes : 
	[
		{
			class: TestTarget.FileManagerFactory,
			getTests: function() : any[]{
				return [] //TODO:
			},
			methods: 
			[
				{
					method: TestTarget.FileManagerFactory.create,
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
		,{
			class: TestTarget.DecisionGraphFileManager,
			getTests: function() : any[]{
				return [] //TODO:
			},
			methods:
			[
				{
					method: "getAllDefinitions",
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
				,{
					method: "getAllReferences",
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
				,{
					method: "createPolicyModelEntity",
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
				,{
					method: "getAllDefinitionsDGNode",
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
				,{
					method: "getAllDefinitionsSlot",
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
				,{
					method: "getAllDefinitionsSlotValue",
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
				,{
					method: "getAllReferencesDGNode",
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
				,{
					method: "getAllReferencesSlot",
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
				,{
					method: "getAllReferencesSlotValue",
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
				,{
					method: "getFoldingRanges",
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
				,{
					method: "getAutoComplete",
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
		,{
			class: TestTarget.PolicySpaceFileManager,
			getTests: function() : any[]{
				return [] //TODO:
			},
			methods:
			[
				{
					method: "createPolicyModelEntity",
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
				,{
					method: "getAllDefinitionsDGNode",
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
				,{
					method: "getAllDefinitionsSlot",
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
				,{
					method: "getAllDefinitionsSlotValue",
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
				,{
					method: "getAllReferencesDGNode",
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
				,{
					method: "getAllReferencesSlot",
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
				,{
					method: "getAllReferencesSlotValue",
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
				,{
					method: "getFoldingRanges",
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
				,{
					method: "getAutoComplete",
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
		,{
			class: TestTarget.ValueInferenceFileManager,
			getTests: function() {
				//TODO:
			},
			methods:
			[
				{
					method: "createPolicyModelEntity",
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
				,{
					method: "getAllDefinitionsDGNode",
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
				,{
					method: "getAllDefinitionsSlot",
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
				,{
					method: "getAllDefinitionsSlotValue",
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
				,{
					method: "getAllReferencesDGNode",
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
				,{
					method: "getAllReferencesSlot",
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
				,{
					method: "getAllReferencesSlotValue",
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
				,{
					method: "getFoldingRanges",
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
				,{
					method: "getAutoComplete",
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


const LanguageServicesTestCases = {
	classes : [
		{
			class: TestTarget.LanguageServices,
			getTests: function() {
				//TODO:
			},
			methods: 
			[
				{
					method: "addDocs",
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
				,{
					method: "updateDoc",
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
				,{
					method: "removeDoc",
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
				,{
					method: "initParsers",
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
				,{
					method: "getLanguageByExtension",
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
				,{
					method: "getParserByExtension",
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
				,{
					method: "populateMaps",
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
				,{
					method: "getFileManagerByLocation",
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
				,{
					method: "getDeclarations",
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
				,{
					method: "getReferences",
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
				,{
					method: "getFoldingRanges",
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
				,{
					method: "getCompletion",
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
staticLanguageLibTestCases.classes.forEach(function(c) {
	let errors : Error[] = []
	const classMethodTests = c.getTests()
	// @ts-ignore
	classMethodTests.forEach(methodTests =>{
		describe(c.class.name + ' suite', function() {
			methodTests.forEach(test => {
				it('', function(done) {
					if(stopOnError) {
						test()
						done();
					}
					else {
						try {
							test()
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
