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


class TestRun {
	className : string
	methodName : string
	run : () => void
	enabled : boolean = true
}


abstract class TestClass {
	abstract runTests()
}

class DecisionGraphFileManager_Test extends TestClass {
	testTargetClass = TestTarget.DecisionGraphFileManager

	runTests() {
		throw new Error("Method not implemented.");
	}

	static createPolicyModelEntity() {
		
	}
	static getAllDefinitionsDGNode() {

	}
	static getAllDefinitionsSlot(){
	}

	static getAllDefinitionsSlotValue(){
	}

	static getAllReferencesDGNode() {
	}

	static getAllReferencesSlot() {
	}

	static getAllReferencesSlotValue() {
	}

	static getFoldingRanges() {
	}

	static getAutoComplete() {

	}
}

class PolicySpaceFileManager_Test extends TestClass {
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

class ValueInferenceFileManager_Test extends TestClass {
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

