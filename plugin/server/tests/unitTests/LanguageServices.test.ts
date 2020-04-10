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

