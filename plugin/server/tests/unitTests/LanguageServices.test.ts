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
	let path = "../parsers/"
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
			run: function() {
				this.methods.forEach(method => {
					method.run()
				});
			},
			methods:
			[
				{
					method: TestTarget.DecisionGraphServices.getAllDefinitionsOfNodeInDocument,
					run: function() {
						this.cases.forEach(testCase => {
							const input = testCase.input						
							const output = testCase.output
							const uri : string = input[0]
							const name : string = input[1]
							let text = getTextFromUri(uri, TestData.decisinGraphDocs)
							
							getParser(text, uri).then((parser) => {
								let tree : Parser.Tree = parser.parse(text)
								let result : Range[] = TestTarget.DecisionGraphServices.getAllDefinitionsOfNodeInDocument(name, tree)
								assert.deepEqual(result, output)
							})						
						});		
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
					run: function() {
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
					method: TestTarget.DecisionGraphServices.getAllReferencesOfSlotInDocument,
					run: function() {
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
					method: TestTarget.DecisionGraphServices.getAllReferencesOfSlotValueInDocument,
					run: function() {
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
					method: TestTarget.DecisionGraphServices.getAllNodesInDocument,
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
			run: function() {
				//TODO:
			},
			methods: 
			[
				{
					method: TestTarget.FileManagerFactory.create,
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
	class : [
		{
			class: TestTarget.LanguageServices,
			run: function() {
				//TODO:
			},
			methods: 
			[
				{
					method: "addDocs",
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
					run: function() {
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
  describe(c + ' suite', function() {
    it('test1', function(done) {
      c.run()
      done();
    });
    // it('That thing should behave like that', function(done) {
    //   foo.should.have.length(3);
    //   done();
    // });
  });
});

