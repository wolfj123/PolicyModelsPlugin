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
import * as Utils from './Utils'

//https://github.com/bash-lsp/bash-language-server/blob/master/server/src/parser.ts
//https://github.com/bash-lsp/bash-language-server/blob/790f5a5203af62755d6cec38ef1620e2b2dc0dcd/server/src/analyser.ts#L269

// enum PolicyModelEntityType {
// 	Slot,
// 	SlotValue,
// 	DecisionGraphNodeId,
// 	DecisionGraphNode
// }

abstract class PolicyModelEntity {
	//type : PolicyModelEntityType;
	name : string;
	declaration : Location;
	references : Location[];
	text : string;

	constructor(name : string, text: string, declaration : Location) {
		this.name = name;
		this.declaration = declaration;
		this.text = text;
		//this.type = type;
    }

	getName() : string {
		return this.name;
	}

	addReference(reference : Location) {
		this.references.push(reference);
	}

	// equals(other : PolicyModelEntity) : boolean {
	// 	if(this.type == other.type){
	// 		return false;
	// 	}
	// 	if(!(this.name === other.name)){
	// 		return false;
	// 	}
	// 	if(this.declaration.uri === other.declaration.uri){
	// 		return false;
	// 	}
	// 	return true;
	// }
}


const namelessNodeIdentifier : string = ':foldingRange:'
class DecisionGraphNode extends PolicyModelEntity {
	static createNode(name : string , text: string, declaration : Location) : DecisionGraphNode{
		return new DecisionGraphNode(name, text, declaration)
	}

	static createNamelessNode(text: string, declaration : Location) : DecisionGraphNode {
		return new DecisionGraphNode(namelessNodeIdentifier, text, declaration)
	}
	
	isNamed() : boolean {
		return !(this.getName() === namelessNodeIdentifier)
	}

	isComplete() : boolean {
		return this.name != null && this.text != null && this.declaration != null 
	}
}

class Slot extends PolicyModelEntity {}

class AtomicSlotValue extends PolicyModelEntity {

}

class AtomicSlot extends Slot {
	values : Map<string, AtomicSlotValue>
}

class AggregateSlot extends Slot {
	values : Map<string, AtomicSlot>
}

class CompoundSlot extends Slot {
	values : Map<string, Slot>
}


//https://stackoverflow.com/questions/8877666/how-is-a-javascript-hash-map-implemented
//https://howtodoinjava.com/typescript/maps/
class PolicyModelEntityMap {
	slots : Map<string, PolicyModelEntity>
	nodes : Map<string, PolicyModelEntity>
	namelessNodes : PolicyModelEntity[]

	addNode(node : PolicyModelEntity){
		if(this.nodes.has(node.getName())) {
			//Node with same ID already exists
			//TODO: how do we handle user writing 2 nodes with the same name?
		}
		this.nodes.set(node.getName(), node);
	}

	addNodeReference(name : string, ref : Location){
		let node : PolicyModelEntity
		if(!this.nodes.has(name)) {
			node = DecisionGraphNode.createNode(name, null, null)
		}
		this.addNode(node)
		node.addReference(ref)
	}

	addSlot(slot : PolicyModelEntity) {

	}

	addSlotReference(name : string, ref : Location) {

	}
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

function analyzeParseTreeDecisionGraph(root : Parser.Tree, visibleRanges: {start: number, end: number}[], uri : DocumentUri, result : PolicyModelEntity[]) {
	let nodeTypes = [
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

		//------------------ sub nodes:
		'text_sub_node',
		'terms_sub_node',
		'term_sub_node',
		//'answers_sub_node',  - no id here
		'answer_sub_node',
		//'slot_sub_node', 	- no id here
		//consider_options_sub_node, - no id here
		'consider_option_sub_node',
		//'else_sub_node',  - no id here
		//when_answer_sub_node, - no id here
		'info_sub_node',
		'continue_node',
		'part_node'
	]
	console.time('tree')
	var tmpNode = root.walk().currentNode().namedDescendantForPosition({row: 2, column: 3})
	console.log(tmpNode)

	for (let node of nextNode(root, visibleRanges)) {
		if(nodeTypes.indexOf(node.type) > -1){
			let idNode = node.children.filter(child => child.type === 'node_id')[0]
			if(idNode) {
				let id : string = idNode.descendantsOfType('node_id_value')[0].text
				let text = node.text
				let range : Range = Utils.newRange(Utils.point2Position(node.startPosition), Utils.point2Position(node.endPosition))
				let loc : Location = Utils.newLocation(uri,range)
				//let newNode : PolicyModelEntity = new PolicyModelEntity(id, PolicyModelEntityType.DecisionGraphNodeId, text, loc)
				let newNode : DecisionGraphNode = DecisionGraphNode.createNode(id, text, loc)
				result.push(newNode)
			} 
			else {
				let text = node.text
				let range : Range = Utils.newRange(Utils.point2Position(node.startPosition), Utils.point2Position(node.endPosition))
				let loc : Location = Utils.newLocation(uri, range)
				//let newNode : PolicyModelEntity = new PolicyModelEntity('foldingRange', PolicyModelEntityType.DecisionGraphNode, text, loc)
				let newNode : DecisionGraphNode =  DecisionGraphNode.createNamelessNode(text, loc)
				result.push(newNode)
			}
		} 
	}
	console.timeEnd('tree')
}

function analyzeParseTreePolicySpace(root : Parser.Tree, visibleRanges: {start: number, end: number}[], uri : DocumentUri, result : PolicyModelEntity[]) {
	let cursor = root.walk()

	let slots = cursor.currentNode().descendantsOfType("slot")
	for (let slot of slots) {
		let identifierNode : Parser.SyntaxNode = slot.firstNamedChild
		if(identifierNode.type === 'identifier_with_desc') {
			identifierNode = identifierNode.firstNamedChild
		}
		let name : string = identifierNode.text
		let text = slot.text
		let range : Range = Utils.newRange(Utils.point2Position(slot.startPosition), Utils.point2Position(slot.endPosition))
		let loc : Location = Utils.newLocation(uri, range)
		//let newNode : PolicyModelEntity = new PolicyModelEntity(name, PolicyModelEntityType.Slot, text, loc)
		//result.push(newNode)
	}
}

function  analyzeParseTreeValueInference(root : Parser.Tree, visibleRanges: {start: number, end: number}[], uri : DocumentUri, result : PolicyModelEntity[]) {
	//TODO:
}



function analyzeParseTree(root: Parser.Tree, uri : DocumentUri, visibleRanges: {start: number, end: number}[]) : PolicyModelEntity[] {
	let result : PolicyModelEntity[] = []

	let fileExtensionsDecisionGraph = ['dg']
	let fileExtensionsPolicySpace = ['pspace']
	let fileExtensionsvalueInference = ['vi']

	let collectionFunction;
	if(fileExtensionsDecisionGraph.indexOf(Utils.getFileExtension(uri)) > -1) {
		collectionFunction = analyzeParseTreeDecisionGraph
	} 
	else if(fileExtensionsPolicySpace.indexOf(Utils.getFileExtension(uri)) > -1) {
		collectionFunction = analyzeParseTreePolicySpace
	} 
	else if (fileExtensionsvalueInference.indexOf(Utils.getFileExtension(uri)) > -1) {
		collectionFunction = analyzeParseTreeValueInference
	}
	else {
		return result
	}

	collectionFunction(root, visibleRanges, uri, result)

	return result
}


//***********************PLAYGROUND******************


async function demoDecisionGraph() {
	await Parser.init()
	const parser = new Parser()
	const wasm = 'parsers/tree-sitter-decisiongraph.wasm'
	const lang = await Parser.Language.load(wasm)
	//console.log(lang)
	parser.setLanguage(lang)
		
	//Then you can parse some source code,
	const sourceCode = `
	[>bb< ask:
	{>asd< text: Do the data contain health information?}
	{answers:
	  {yes: [ >yo< call: healthSection]}}]
	`;
	const tree = parser.parse(sourceCode);
	
	//and inspect the syntax tree.
	let result = analyzeParseTree(tree, "somefile.dg", [{start: 0 , end: 8}])
	//console.log(result)
}

async function demoPolicySpace() {
	await Parser.init()
	const parser = new Parser()
	const wasm = 'parsers/tree-sitter-policyspace.wasm'
	const lang = await Parser.Language.load(wasm)
	parser.setLanguage(lang)
		
	//Then you can parse some source code,
	const sourceCode = `
	slot1: one of a, b.
	slot2 [another one]: one of c, d.
	`;
	const tree = parser.parse(sourceCode);
	
	//and inspect the syntax tree.
	console.log(analyzeParseTree(tree, "somefile.pspace", [{start: 0 , end: 8}]))
}

async function demoValueInference() {
	await Parser.init()
	const parser = new Parser()
	const wasm = 'parsers/tree-sitter-valueinference.wasm'
	const lang = await Parser.Language.load(wasm)
	parser.setLanguage(lang)
		
	//Then you can parse some source code,
	const sourceCode = `

	`;
	const tree = parser.parse(sourceCode);
	
	//and inspect the syntax tree.
	console.log(analyzeParseTree(tree, "somefile.vi", [{start: 0 , end: 8}]))
}

function myprint(msg){
	if(true){
		console.log(msg)
	}
}

demoDecisionGraph()
//demoPolicySpace()