import { TextDocWithChanges } from './DocumentChangesManager';
import { Analyzer, PolicySpaceAnalyzer, DecisionGraphAnalyzer, ValueInferenceAnalyzer } from './Analyzer';
import { languagesIds } from './Utils';

export function CreateAnalyzer(textDoc: TextDocWithChanges): Analyzer {	

	let analyzer: Analyzer;
	switch(languagesIds[textDoc.textDocument.languageId]){
		case languagesIds.policyspace:
			analyzer = new PolicySpaceAnalyzer(textDoc);
			break;	
		case languagesIds.decisiongraph:
			analyzer = new DecisionGraphAnalyzer(textDoc);
			break;
		case languagesIds.valueinference:
			analyzer = new ValueInferenceAnalyzer(textDoc);
		default:
			analyzer = undefined;
	}

	if (analyzer === undefined){
		//TODO throw error / log
		return null;
	}

	return analyzer;
}



//import Parser = require('web-tree-sitter');
/*
import Parser = require('web-tree-sitter');

let parserLangs: {[id: number]: Parser.Language}  = {};

Parser.init().then(()=>{
	console.log("finsih init parser");
	Parser.Language.load('parsers/tree-sitter-policyspace.wasm').then ((res) => {
		parserLangs[langugeIds.policyspace] = res;
		console.log(`fin loading ps lang`);
	});
	// Parser.Language.load('parsers/tree-sitter-decisiongraph.wasm').then ((res) => {
	// 	parserLangs[langugeIds.decisionGraph] = res;
	// });
	// Parser.Language.load('parsers/tree-sitter-valueinference.wasm').then ((res) => {
	// 	parserLangs[langugeIds.valueInference] = res;
	// });
})

export function CreateParser (langId: langugeIds): Parser {
	let parser = new Parser();
	parser.setLanguage(parserLangs[langId]);
	return parser;
}

async function ParserFactoryHelper1(){
	await Parser.init();
}

async function ParserFactoryHelper2(wasm: string)  {
	let lang = await Parser.Language.load(wasm);
	return lang;
}*/