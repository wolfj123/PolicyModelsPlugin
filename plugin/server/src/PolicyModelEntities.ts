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

enum PolicyModelEntityType {
	Slot,
	SlotValue,
	DecisionGraphNodeId,
	DecisionGraphNode
}

class PolicyModelEntity {
	type : PolicyModelEntityType;
	name : string;
	declaration : Location;
	references : Location[];
	text : string;

	constructor(name : string, type : PolicyModelEntityType, text: string, declaration : Location) {
		this.name = name;
		this.type = type;
        this.declaration = declaration;
    }

	addReference(reference : Location) {
		this.references.push(reference);
	}

	equals(other : PolicyModelEntity) : boolean {
		if(this.type == other.type){
			return false;
		}
		if(!(this.name === other.name)){
			return false;
		}
		if(this.declaration.uri === other.declaration.uri){
			return false;
		}
		return true;
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


function analyzeParseTreeDecisionGraph(node : Parser.SyntaxNode, uri : DocumentUri, result : PolicyModelEntity[]) {
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
	
	if(nodeTypes.indexOf(node.type) > -1){
		let idNode = node.children.filter(child => child.type === 'node_id')[0]
		if(idNode){
			let id : string = idNode.descendantsOfType('node_id_value')[0].text
			let text = node.text
			let loc : Location = newLocation(uri, point2Position(node.startPosition), point2Position(node.endPosition))
			let newNode : PolicyModelEntity = new PolicyModelEntity(id, PolicyModelEntityType.DecisionGraphNodeId, text, loc)
			result.push(newNode)
		} 
		else {
			let text = node.text
			let loc : Location = newLocation(uri, point2Position(node.startPosition), point2Position(node.endPosition))
			let newNode : PolicyModelEntity = new PolicyModelEntity('foldingRange', PolicyModelEntityType.DecisionGraphNode, text, loc)
			result.push(newNode)
		}
	} 
}
function analyzeParseTreePolicySpace(node : Parser.SyntaxNode, uri : DocumentUri, result : PolicyModelEntity[]) {
	//TODO:
}
function  analyzeParseTreeValueInference(node : Parser.SyntaxNode, uri : DocumentUri, result : PolicyModelEntity[]) {
	//TODO:
}



function analyzeParseTree(root: Parser.Tree, uri : DocumentUri, visibleRanges: {start: number, end: number}[]) : PolicyModelEntity[] {
	let result : PolicyModelEntity[] = []

	let fileExtensionsDecisionGraph = ['dg']
	let fileExtensionsPolicySpace = ['pspace']
	let fileExtensionsvalueInference = ['vi']

	let collectionFunction;
	if(fileExtensionsDecisionGraph.indexOf(getFileExtension(uri)) > -1) {
		collectionFunction = analyzeParseTreeDecisionGraph
	} 
	else if(fileExtensionsPolicySpace.indexOf(getFileExtension(uri)) > -1) {
		collectionFunction = analyzeParseTreePolicySpace
	} 
	else if (fileExtensionsvalueInference.indexOf(getFileExtension(uri)) > -1) {
		collectionFunction = analyzeParseTreeValueInference
	}
	else {
		return result
	}

	for (let node of nextNode(root, visibleRanges)){
		collectionFunction(node, uri, result)
	}
	return result
}

function point2Position(p : Parser.Point) : Position {
	return  Position.create(p.row, p.column)
}

function newRange(pos1 : Position, pos2 : Position) : Range {
	return {start: pos1,end: pos2}
}

function newLocation(uri : DocumentUri, pos1 : Position, pos2 : Position) : Location {
	let range = newRange(pos1, pos2)
	return 	{
		uri: uri,
		range: range
	}
}

function getFileExtension(filename : string) : string {
	let re = /(?:\.([^.]+))?$/;
	//console.log(re.exec(filename)[1])
	return re.exec(filename)[1];   
}


//***********************PLAYGROUND******************


async function demo() {
	await Parser.init()
	const parser = new Parser()
	const wasm = 'parsers/tree-sitter-decisiongraph.wasm'
	const lang = await Parser.Language.load(wasm)
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
	console.log(analyzeParseTree(tree, "somefile.dg", [{start: 0 , end: 8}]))

}

function myprint(msg){
	if(true){
		console.log(msg)
	}
}

demo()

