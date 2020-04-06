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
import { getFileExtension, point2Position, position2Point, newRange, flatten } from './Utils';
import * as path from 'path';


//https://github.com/bash-lsp/bash-language-server/blob/master/server/src/parser.ts
//https://github.com/bash-lsp/bash-language-server/blob/790f5a5203af62755d6cec38ef1620e2b2dc0dcd/server/src/analyser.ts#L269



class LanguageServicesFacade {
	//protected textDocument:TextDocWithChanges;
	// parser : Parser
	// tree : Parser.Tree

	// constructor(textDocument : TextDocWithChanges){
	// 	super(textDocument)
	// 	this.parser = getParser(textDocument.textDocument.uri)
	// 	this.tree = parser.parse(textDocument.textDocument.getText());
	// }

	// getNodeFromPosition(position : Position) : Parser.SyntaxNode {
	// 	return this.tree.walk().currentNode().namedDescendantForPosition(position2Point(position))
	// }

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
}

enum PolicyModelsLanguage {
	PolicySpace,
	DecisionGraph,
	ValueInference
}

class LanguageServices {
	//Workspace
	decisionGraph : Map<DocumentUri, Parser.Tree>
	policySpace : Map<DocumentUri, Parser.Tree>
	valueInference : Map<DocumentUri, Parser.Tree>
	parsers : Map<PolicyModelsLanguage, Parser>

	//config
	parsersInfo = 	//TODO: maybe extract this info from package.json
	[ 
		{ 
			fileExtentsions : ['dg'],
			language : PolicyModelsLanguage.DecisionGraph,
			wasm : 'tree-sitter-decisiongraph.wasm',
			map : this.decisionGraph
		},
		{ 
			fileExtentsions : ['pspace', 'ps', 'ts'],
			language : PolicyModelsLanguage.PolicySpace,
			wasm : 'tree-sitter-policyspace.wasm',
			map : this.policySpace
		},
		{ 
			fileExtentsions :  ['vi'],
			language : PolicyModelsLanguage.ValueInference,
			wasm : 'tree-sitter-valueinference.wasm',
			map : this.valueInference
		}
	]

	constructor(docs : TextDocWithChanges[] /*uris : DocumentUri[]*/) {
		this.initParsers()

		this.decisionGraph = new Map()
		this.policySpace = new Map()
		this.valueInference = new Map()	
		this.populateMaps(docs)
	}

	addDocs(docs : TextDocWithChanges[]) {
		this.populateMaps(docs)
	}

	updateDoc(doc : TextDocWithChanges){

	}

	//maybe this map should be global singleton?
	async initParsers() {
		this.parsers = new Map()
		for(let info of this.parsersInfo) {
			const wasm = info.wasm
			//const absolute = path.join(context.extensionPath, 'parsers', wasm
			await Parser.init()
			const parser = new Parser()
			const lang = await Parser.Language.load(wasm)
			parser.setLanguage(lang)
			this.parsers.set(info.language,parser)
		}
	}

	populateMaps(docs : TextDocWithChanges[]){
		for (let doc of docs){
			const uri = doc.textDocument.uri
			const extension : string = getFileExtension(uri)
			const correspondingInfo = this.parsersInfo.filter(info => info.fileExtentsions.indexOf(extension) != -1)
			if(!(correspondingInfo) || correspondingInfo.length == 0){
				continue;
			}
			const language : PolicyModelsLanguage = correspondingInfo[0].language
			let tree : Parser.Tree = this.parsers.get(language).parse(doc.textDocument.getText())
			let map : Map<DocumentUri, Parser.Tree> = correspondingInfo[0].map
			map.set(uri, tree)
		}
	}

	getFoldingRanges() : Location[] {
		//TODO:
		return null
	}

	getFoldingRangesOfNodes() : Location[] {
		//TODO:
		return null
	}

	getFoldingRangesOfSlots() : Location[] {
		//TODO:
		return null
	}

	getFoldingRangesOfValueInferences() : Location[] {
		//TODO:
		return null
	}

	getDeclarations(location : Location) : Location[] {
		//TODO:
		return null
	}

	getDeclarationsOfNodes() : Location[] {
		//TODO:
		return null
	}

	getDeclarationsOfSlots() : Location[] {
		//TODO:
		return null
	}

	getReferences(location : Location) : Location[] {
		//TODO:
		return null
	}

	getReferencesOfNodes() : Location[] {
		//TODO:
		return null
	}

	getReferencesOfSlots() : Location[] {
		//TODO:
		return null
	}

	getReferencesOfSlotValues() : Location[] {
		//TODO:
		return null
	}

	getCompletion(location : Location) : Location[] {
		//TODO:
		return null
	}

	getCompletionOfDecisionGraphKeywords(location : Location) : Location[] {
		//TODO:
		return null
	}

	getCompletionOfPolicySpaceKeywords(location : Location) : Location[] {
		//TODO:
		return null
	}

	// getParser(uri : DocumentUri) : Parser {
	// 	const fileExtension = getFileExtension(uri)
	// 	const wasm = this.parsersInfo.find(info => info.fileExtentsions.indexOf(fileExtension) != -1).wasm
	// 	//const absolute = path.join(context.extensionPath, 'parsers', wasm)
	// 	Parser.init()
	// 	const parser = new Parser()
	// 	const lang = Parser.Language.load(wasm)
	// 	parser.setLanguage(lang)
	// 	return parser
	// }
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

	static getAllNodesInDocument(tree : Parser.Tree) : Range[] {
		const nodeTypes : string[] = [
			'ask_node',
			'continue_node',
			'todo_node',
			'call_node',
			'reject_node',
			'set_node',
			'section_node',
			'part_node',
			'consider_node',
			'when_node',
			'import_node',
			'end_node',
			'text_sub_node',
			'terms_sub_node',
			'term_sub_node',
			'answers_sub_node',
			'answer_sub_node',
			'slot_sub_node',
			'consider_options_sub_node',
			'consider_option_sub_node',
			'else_sub_node',
			'when_answer_sub_node',
			'info_sub_node',
			'continue_node',
		]
		//let root : Parser.SyntaxNode = tree.walk().currentNode()
		let result : Parser.SyntaxNode[] = []
		for (let node of nextNode(tree)) {
			if(nodeTypes.indexOf(node.type) > -1){
				result.push(node)
			}
		}
		return getRangesOfSyntaxNodes(result)
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

function* nextNode(root : Parser.Tree, visibleRanges: {start: number, end: number}[] = undefined) {
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
//demoDecisionGraphGetAllReferencesOfNodeInDocument()
//demoDecisionGraphGetAllDefinitionsOfNodeInDocument()
//demoDecisionGraphGetAllReferencesOfSlotInDocument()
//demoDecisionGraphGetAllReferencesOfSlotValueInDocument()
//demoDecisionGraphGetAllNodesInDocument()
//demoPolicySpaceGetAllDefinitionsOfSlotInDocument()
//demoPolicySpaceGetAllReferencesOfSlotInDocument()
//demoPolicySpaceGetAllDefinitionsOfSlotValueInDocument()
//demoValueInferenceAllReferencesOfSlotValueInDocument()

async function demoDecisionGraphGetAllReferencesOfNodeInDocument() {
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

async function demoDecisionGraphGetAllDefinitionsOfNodeInDocument() {
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

async function demoDecisionGraphGetAllReferencesOfSlotInDocument() {
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

async function demoDecisionGraphGetAllReferencesOfSlotValueInDocument() {
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

async function demoDecisionGraphGetAllNodesInDocument() {
	await Parser.init()
	const parser = new Parser()
	const wasm = 'parsers/tree-sitter-decisiongraph.wasm'
	const lang = await Parser.Language.load(wasm)
	parser.setLanguage(lang)
	let tree
	let sourceCode
	let result

	sourceCode = `[section:
		{title: Health Data}
		[ask:
		  {text: Are there any related health issues?}
		  {answers:
			{no: [continue]}
		  }
		]
	  
	  ]`;
	tree = parser.parse(sourceCode);
	result = DecisionGraphServices.getAllNodesInDocument(tree)
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


