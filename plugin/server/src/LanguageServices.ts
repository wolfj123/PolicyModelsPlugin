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
import { getFileExtension, point2Position, position2Point , newRange ,flatten} from './Utils';
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

	getNodeFromPosition(position : Position) : Parser.SyntaxNode {
		return this.tree.walk().currentNode().namedDescendantForPosition(position2Point(position))
	}

	onDefinition(params : DeclarationParams):  LocationLink[] {
		//TODO:
		return null
	}
	// this fucntions are called when the request is first made from the server
	onReferences(params : ReferenceParams):  Location[] {
		let uri : DocumentUri = params.textDocument.uri
		let position : Position = params.position


		//TODO:
		return null
	}
	onPrepareRename(params : RenameParams): Range | null {
		//TODO:
		return null
	}
	onRenameRequest(params : RenameParams): WorkspaceEdit {
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

class DecisionGraphServices {
	static getAllDefinitionsOfNodeInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let nodeIds : Parser.SyntaxNode[] = root.descendantsOfType("node_id")
		let relevantIds = nodeIds
			.map(id => id.descendantsOfType("node_id_value")[0])
			.filter(id => id.text === name)

		return getRangesOfSyntaxNodes(relevantIds)
	}

	static getAllReferencesOfNodeInDocument(name : string, tree : Parser.Tree, decisiongraphSource : DocumentUri = undefined /*if the node is from another file*/) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let importedGraphName

		if(decisiongraphSource) {
			let imports : Parser.SyntaxNode[] = root.descendantsOfType("import_node")
			let importSource : Parser.SyntaxNode = imports.find(
				node => 
					{ 
						return node.descendantsOfType("file_path")[0].text.trim() === decisiongraphSource
					}
				)
			if(importSource){
				importedGraphName = importSource.descendantsOfType("decision_graph_name")[0].text
			}
		}

		let references : Parser.SyntaxNode[] = root.descendantsOfType("node_reference")
		let relevantReferences = references.filter(
			ref => 
			{
				return ref.descendantsOfType("node_id_value")[0].text === name &&
					(!(importedGraphName) || (importedGraphName &&
					ref.descendantsOfType("decision_graph_name").length > 0 && ref.descendantsOfType("decision_graph_name")[0].text == importedGraphName))
			}	
		)
		return getRangesOfSyntaxNodes(relevantReferences)
	}

	static getAllReferencesOfSlotInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let slotRefs : Parser.SyntaxNode[] = root.descendantsOfType("slot_reference")
		let slotIdentifiers : Parser.SyntaxNode[] = flatten(slotRefs.map(ref => ref.descendantsOfType("slot_identifier")))
		let relevant = slotIdentifiers.filter(id => id.text === name)
		return getRangesOfSyntaxNodes(relevant)
	}
	
	static getAllReferencesOfSlotValueInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let slotRefs : Parser.SyntaxNode[] = root.descendantsOfType("slot_value")
		let relevant = slotRefs.filter(id => id.text === name)
		return getRangesOfSyntaxNodes(relevant)
	}
}


class PolicySpaceServices {
	static getAllDefinitionsOfSlotInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let slots : Parser.SyntaxNode[] = root.descendantsOfType("slot")
		let relevantSlots = slots
			.map(slot => slot.children.find(child => child.type === "identifier"))
			.filter(id => id && id.descendantsOfType("identifier_value")[0].text === name)
		return getRangesOfSyntaxNodes(relevantSlots)
	}

	static getAllReferencesOfSlotInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let identifiers : Parser.SyntaxNode[] = root.descendantsOfType("identifier_value")
		let relevantIdentifiers = identifiers
			.filter(id => !(id.parent.type === "identifier") && !(id.parent.type === "slot_value"))
			.filter(id => id.text === name)
		return getRangesOfSyntaxNodes(relevantIdentifiers)
	}
	
	static getAllDefinitionsOfSlotValueInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let values : Parser.SyntaxNode[] = root.descendantsOfType("slot_value")
		let relevantIdentifiers = values
			.map(val => val.descendantsOfType("identifier_value")[0])
			.filter(id => id.text === name)
		return getRangesOfSyntaxNodes(relevantIdentifiers)
	}
}

class ValueInferenceServices {
	static getAllReferencesOfSlotInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let identifiers : Parser.SyntaxNode[] = flatten(root.descendantsOfType("slot_reference")
			.map(id => id.descendantsOfType("slot_identifier")))
		let relevantIdentifiers = identifiers.filter(ref => ref.text === name)
		return getRangesOfSyntaxNodes(relevantIdentifiers)
	}
	
	static getAllDefinitionsOfSlotValueInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let identifiers : Parser.SyntaxNode[] = root.descendantsOfType("slot_value")
			.map(id => id.descendantsOfType("slot_identifier")[0])
		let relevantIdentifiers = identifiers.filter(ref => ref.text === name)
		return getRangesOfSyntaxNodes(relevantIdentifiers)
	}
}

enum LanguageName {
	PolicySpace,
	DecisionGraph,
	ValueInference
}


function getParser(uri : DocumentUri) : Parser {
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
		if(visibleRanges) {
			for (const { start, end } of visibleRanges) {
				const overlap = x.startPosition.row <= end + 1 && start - 1 <= x.endPosition.row
				if (overlap) return true
			}
			return false
		}
		return true
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

function getRangesOfSyntaxNodes(nodes : Parser.SyntaxNode[]) : Range[] {
	return nodes.map(
		id => {
			return newRange(point2Position(id.startPosition), point2Position(id.endPosition))
		}
	)
}

/*************DEMO*********/
//demoDecisionGraphAllReferencesOfNodeInDocument()
//demoDecisionGraphAllDefinitionsOfNodeInDocument()
//demoDecisionGraphAllReferencesOfSlotInDocument()
//demoDecisionGraphAllReferencesOfSlotValueInDocument()
//demoPolicySpaceGetAllDefinitionsOfSlotInDocument()
//demoPolicySpaceGetAllReferencesOfSlotInDocument()
//demoPolicySpaceGetAllDefinitionsOfSlotValueInDocument()
demoValueInferenceAllReferencesOfSlotValueInDocument()

async function demoDecisionGraphAllReferencesOfNodeInDocument() {
	await Parser.init()
	const parser = new Parser()
	const wasm = 'parsers/tree-sitter-decisiongraph.wasm'
	const lang = await Parser.Language.load(wasm)
	parser.setLanguage(lang)
	let tree
	let sourceCode
	let result

	//Then you can parse some source code,
	sourceCode = `
	[>bb< ask:
	{>asd< text: Do the data contain health information?}
	{answers:
	  {yes: [ >yo< call: asd]}}]
	`;
	// tree = parser.parse(sourceCode);
	// result = DecisionGraphServices.getAllReferencesOfNodeInDocument("asd", tree)
	// console.log(result)

	sourceCode = ` [#import dg : file.dg]
	[>bb< ask:
	{text: Do the data contain health information?}
	{answers:
	  {yes: [ >yo< call: dg>asd]}}]
	`;
	tree = parser.parse(sourceCode);
	result = DecisionGraphServices.getAllReferencesOfNodeInDocument("asd", tree, "file.dg")
	console.log(result)

	
	sourceCode = ` [#import dg : file.dg]
	[>bb< ask:
	{text: Do the data contain health information?}
	{answers:
	  {yes: [ >yo< call: dg2>asd]}}]
	`;
	tree = parser.parse(sourceCode);
	result = DecisionGraphServices.getAllReferencesOfNodeInDocument("asd", tree, "file.dg")
	console.log(result)
}

async function demoDecisionGraphAllDefinitionsOfNodeInDocument() {
	await Parser.init()
	const parser = new Parser()
	const wasm = 'parsers/tree-sitter-decisiongraph.wasm'
	const lang = await Parser.Language.load(wasm)
	parser.setLanguage(lang)
	let tree
	let sourceCode
	let result

	sourceCode = ` [#import dg : file.dg]
	[>asd< ask:
	{text: Do the data contain health information?}
	{answers:
	  {yes: [ >yo< call: dg>asd]}}]
	`;
	tree = parser.parse(sourceCode);
	result = DecisionGraphServices.getAllDefinitionsOfNodeInDocument("asd", tree)
	console.log(result)
	result = DecisionGraphServices.getAllDefinitionsOfNodeInDocument("yo", tree)
	console.log(result)
}

async function demoDecisionGraphAllReferencesOfSlotInDocument() {
	await Parser.init()
	const parser = new Parser()
	const wasm = 'parsers/tree-sitter-decisiongraph.wasm'
	const lang = await Parser.Language.load(wasm)
	parser.setLanguage(lang)
	let tree
	let sourceCode
	let result

	sourceCode = `[set: 
	DataTags/Mid1/Bottom1=b1a; 
	DataTags/Mid2/Mid1+=
	{b2b, b2c}]`;
	tree = parser.parse(sourceCode);
	result = DecisionGraphServices.getAllReferencesOfSlotInDocument("Mid1", tree)
	console.log(result)
}

async function demoDecisionGraphAllReferencesOfSlotValueInDocument() {
	await Parser.init()
	const parser = new Parser()
	const wasm = 'parsers/tree-sitter-decisiongraph.wasm'
	const lang = await Parser.Language.load(wasm)
	parser.setLanguage(lang)
	let tree
	let sourceCode
	let result

	sourceCode = `[set: 
	DataTags/Mid1/Bottom1=b1a; 
	DataTags/Mid2/Mid1+= {b2b, b1a}]`;
	tree = parser.parse(sourceCode);
	result = DecisionGraphServices.getAllReferencesOfSlotValueInDocument("b1a", tree)
	console.log(result)
}

async function demoPolicySpaceGetAllDefinitionsOfSlotInDocument() {
	await Parser.init()
	const parser = new Parser()
	const wasm = 'parsers/tree-sitter-policyspace.wasm'
	const lang = await Parser.Language.load(wasm)
	parser.setLanguage(lang)
	let tree
	let sourceCode
	let result

	sourceCode = `Storage: one of clear, serverEncrypt, clientEncrypt, doubleEncrypt.
	Handling: consists of Storage, Transit, Authentication.
	IntellecualProperty: TODO.
	myslot[descriptions1] : some of something [description2], somethingElse [else thingy!], evenMoreSomething [much else?].
	`;
	tree = parser.parse(sourceCode);
	result = PolicySpaceServices.getAllDefinitionsOfSlotInDocument("IntellecualProperty", tree)
	console.log(result)
}

async function demoPolicySpaceGetAllReferencesOfSlotInDocument() {
	await Parser.init()
	const parser = new Parser()
	const wasm = 'parsers/tree-sitter-policyspace.wasm'
	const lang = await Parser.Language.load(wasm)
	parser.setLanguage(lang)
	let tree
	let sourceCode
	let result

	sourceCode = `Storage: one of clear, serverEncrypt, Authentication, doubleEncrypt.
	Handling: consists of Storage, Transit, Authentication.
	IntellecualProperty: TODO.
	myslot[descriptions1] : some of something [description2], somethingElse [else thingy!], evenMoreSomething [much else?].
	`;
	tree = parser.parse(sourceCode);
	result = PolicySpaceServices.getAllReferencesOfSlotInDocument("Storage", tree)
	console.log(result)
}

async function demoPolicySpaceGetAllDefinitionsOfSlotValueInDocument() {
	await Parser.init()
	const parser = new Parser()
	const wasm = 'parsers/tree-sitter-policyspace.wasm'
	const lang = await Parser.Language.load(wasm)
	parser.setLanguage(lang)
	let tree
	let sourceCode
	let result

	sourceCode = `Storage: one of clear, serverEncrypt, Authentication, doubleEncrypt.
	Handling: consists of Storage, Transit, Authentication.
	IntellecualProperty: TODO.
	myslot[descriptions1] : some of something [description2], Authentication [else thingy!], evenMoreSomething [much else?].
	`;
	tree = parser.parse(sourceCode);
	result = PolicySpaceServices.getAllDefinitionsOfSlotValueInDocument("Authentication", tree)
	console.log(result)
}

async function demoValueInferenceAllReferencesOfSlotValueInDocument() {
	await Parser.init()
	const parser = new Parser()
	const wasm = 'parsers/tree-sitter-valueinference.wasm'
	const lang = await Parser.Language.load(wasm)
	parser.setLanguage(lang)
	let tree
	let sourceCode
	let result

	sourceCode = `[DataTag: support
		[ Encrypt=None;   DUA_AM=Implied -> Blue    ]
		[ Encrypt=Quick;  DUA_AM=Click   -> Yellow  ]
		[ Encrypt=Hard;   DUA_AM=Click   -> DUA_AM   ]
		[ Encrypt=Double; DUA_AM=Type    -> Red     ]
		[ Encrypt=Double; DUA_AM=Sign    -> DUA_AM ]
	  ]
	  `;
	tree = parser.parse(sourceCode);
	result = ValueInferenceServices.getAllReferencesOfSlotInDocument("DUA_AM", tree)
	console.log(result)

	tree = parser.parse(sourceCode);
	result = ValueInferenceServices.getAllDefinitionsOfSlotValueInDocument("Click", tree)
	console.log(result)

	tree = parser.parse(sourceCode);
	result = ValueInferenceServices.getAllDefinitionsOfSlotValueInDocument("DUA_AM", tree)
	console.log(result)
}


