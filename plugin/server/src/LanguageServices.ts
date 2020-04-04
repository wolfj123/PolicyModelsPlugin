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
import * as path from 'path';


//https://github.com/bash-lsp/bash-language-server/blob/master/server/src/parser.ts
//https://github.com/bash-lsp/bash-language-server/blob/790f5a5203af62755d6cec38ef1620e2b2dc0dcd/server/src/analyser.ts#L269



class LanguageServices extends Analyzer{
	//protected textDocument:TextDocWithChanges;
	parser : Parser
	tree : Parser.Tree

	constructor(textDocument : TextDocWithChanges){
		super(textDocument)
		this.parser = getParser(textDocument.textDocument.uri)
		this.tree = parser.parse(textDocument.textDocument.getText());
	}

	onDefinition(params : DeclarationParams):  LocationLink[] {
		//TODO:
		return null
	}
	// this fucntions are called when the request is first made from the server
	onReference(params : ReferenceParams):  Location[] {
		let uri = params.textDocument.uri
		let location = params.position


		//TODO:
		return null
	}
	onPrepareRename(params : RenameParams): Range | null {
		//TODO:
		return null
	}
	onRename(params : RenameParams): WorkspaceEdit {
		//TODO:
		return null
	}
	onCompletion(params : TextDocumentPositionParams): CompletionList {
		//TODO:
		return null
	}
	onCompletionResolve(params : CompletionItem): CompletionItem {
		//TODO:
		return null
	}
	onFoldingRanges(params : FoldingRangeParams): FoldingRange[] {
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



enum LanguageName {
	PolicySpace,
	DecisionGraph,
	ValueInference
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
	const fileExtension = getFileExtension(uri)
	const wasm = parsersInfo.find(info => info.fileExtentsions.indexOf(fileExtension) != -1).wasm
	//const absolute = path.join(context.extensionPath, 'parsers', wasm)
	Parser.init()
	const parser = new Parser()
	const lang = Parser.Language.load(wasm)
	parser.setLanguage(lang)
	return parser
}

function* nextNode(root : Parser.Tree, visibleRanges: {start: number, end: number}[]) {
	function visible(x: Parser.TreeCursor, visibleRanges: {start: number, end: number}[]) {
		for (const { start, end } of visibleRanges) {
			const overlap = x.startPosition.row <= end + 1 && start - 1 <= x.endPosition.row
			if (overlap) return true
		}
		return false
	}

	let visitedChildren = false
	let cursor = root.walk()
	let parents = [cursor.nodeType]
	let parent
	let grandparent
	while (true) {
		// Advance cursor
		if (visitedChildren) {
			if (cursor.gotoNextSibling()) {
				visitedChildren = false
			} else if (cursor.gotoParent()) {
				parents.pop()
				visitedChildren = true
				continue
			} else {
				break
			}
		} else {
			const parent = cursor.nodeType
			if (cursor.gotoFirstChild()) {
				parents.push(parent)
				visitedChildren = false
			} else {
				visitedChildren = true
				continue
			}
		}
		// Skip nodes that are not visible
		if (!visible(cursor, visibleRanges)) {
			visitedChildren = true
			continue
		}

		yield cursor.currentNode()
	}
}



