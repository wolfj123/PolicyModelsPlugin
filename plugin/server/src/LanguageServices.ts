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

import * as Parser from 'web-tree-sitter'
import { TextEdit } from 'vscode-languageserver-textdocument';
import { TextDocWithChanges } from './DocumentChangesManager';
import { Analyzer } from './Analyzer';
import { getFileExtension } from './Utils';


//https://github.com/bash-lsp/bash-language-server/blob/master/server/src/parser.ts
//https://github.com/bash-lsp/bash-language-server/blob/790f5a5203af62755d6cec38ef1620e2b2dc0dcd/server/src/analyser.ts#L269




class LanguageServices extends Analyzer{
	//protected textDocument:TextDocWithChanges;
	parser : Parser

	constructor(textDocument: TextDocWithChanges){
		super(textDocument)
		this.parser = getParser(textDocument.textDocument.uri)
	}

	// this fucntions are called when the request is first made from the server
	onReference(params:ReferenceParams):  Location[] {
		let uri = params.textDocument.uri
		let location = params.position


		//TODO:
		return null
	}
	onDefinition(params:DeclarationParams):  LocationLink[] {
		//TODO:
		return null
	}
	onPrepareRename(params:RenameParams): Range | null {
		//TODO:
		return null
	}
	onRename(params:RenameParams): WorkspaceEdit {
		//TODO:
		return null
	}
	onCompletion(params:TextDocumentPositionParams): CompletionList {
		//TODO:
		return null
	}
	onCompletionResolve(params:CompletionItem): CompletionItem {
		//TODO:
		return null
	}
	onFoldingRanges(params:FoldingRangeParams): FoldingRange[] {
		//TODO:
		return null
	}


	//update (); // Still not sure about the signature but this will be called when there is an update in the file text

	//TODO: what is this...

 	// //this functions are needed to complete the info of a request made by server to another file
	// referncesFromOtherFiles (params): Location [];
	// findDefintionForOtherFile (params): LocationLink [];
	// doRenameFromOtherFile (params);
	// findCompletionsForOtherFile (params): CompletionList;
}


//TODO: maybe extract this info from package.json
let parsersInfo =
[ 
	{ 
		fileExtentsions : ['dg'],
		wasm : 'tree-sitter-decisiongraph.wasm'
	},
	{ 
		fileExtentsions : ['pspace', 'ps', 'ts'],
		wasm : 'tree-sitter-policyspace.wasm'
	},
	{ 
		fileExtentsions :  ['vi'],
		wasm : 'tree-sitter-valueinference.wasm'
	}
]
function getParser(uri : DocumentUri) : Parser {
	let fileExtension = getFileExtension(uri)
	const wasm = parsersInfo.find(info => info.fileExtentsions.indexOf(fileExtension) != -1).wasm
	Parser.init()
	const parser = new Parser()
	const lang = Parser.Language.load(wasm)
	parser.setLanguage(lang)
	return parser
}