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
import { Point } from 'web-tree-sitter';

enum PolicyModelEntityType {
	Slot,
	SlotValue,
	DecisionGraphNode
}

class PolicyModelEntity {
	type : PolicyModelEntityType;
	name : string;
	declaration : Location;
	references : Location[];

	constructor(name : string, type : PolicyModelEntityType, declaration : Location) {
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

// class PolicyModelEntityDS {

// }


function isVisible(x: Parser.SyntaxNode, visibleRanges: {start: number, end: number}[]) {
	for (const {start, end} of visibleRanges) {
		const overlap = x.startPosition.row <= end+1 && start-1 <= x.endPosition.row
		if (overlap) return true
	}
	return false
}
function visible(x: Parser.TreeCursor, visibleRanges: { start: number, end: number }[]) {
	for (const { start, end } of visibleRanges) {
		const overlap = x.startPosition.row <= end + 1 && start - 1 <= x.endPosition.row
		if (overlap) return true
	}
	return false
}


function analyzeParseTree(root: Parser.Tree, uri : DocumentUri, visibleRanges: {start: number, end: number}[]) : PolicyModelEntity[] {
	let result : PolicyModelEntity[]

	let fileExtensionsDecisionGraph = ['.dg']
	let fileExtensionsPolicySpace = ['.pspace']
	let fileExtensionsvalueInference = ['.vi']


	let visitedChildren = false
	let cursor = root.walk()
	let parents = [cursor.nodeType]
	let parent
	let grandparent

	function cursorNext() : boolean {
		// Advance cursor
		if (visitedChildren) {
			if (cursor.gotoNextSibling()) {
				visitedChildren = false
			} else if (cursor.gotoParent()) {
				parents.pop()
				visitedChildren = true
				return true
			} else {
				return false
			}
		} else {
			const parent = cursor.nodeType
			if (cursor.gotoFirstChild()) {
				parents.push(parent)
				visitedChildren = false
			} else {
				visitedChildren = true
				return true
			}
		}
		// Skip nodes that are not visible
		if (!visible(cursor, visibleRanges)) {
			visitedChildren = true
			return true
		}
	}

	function analyzeParseTreeDecisionGraph() {
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

		//declarations
		while(cursorNext()){
			parent = parents[parents.length - 1]
			grandparent = parents[parents.length - 2]

			if(nodeTypes.indexOf(cursor.nodeType) > -1){
				let currNode = cursor.currentNode()
				let idArray = currNode.descendantsOfType('node_id')
				if(idArray.length > 0){
					let id = idArray[0].text
					let loc : Location = newLocation(uri, point2Position(currNode.startPosition), point2Position(currNode.endPosition))
					let newNode : PolicyModelEntity = new PolicyModelEntity(id, PolicyModelEntityType.DecisionGraphNode, loc)
					result.push(newNode)
				} 
				else {
					//TODO: what about nameless nodes for folding?
				}
			} 
			else if() {

			}
		}
	}

	function analyzeParseTreePolicySpace() {
		
	}

	function analyzeParseTreeValueInference() {
		
	}

	if(fileExtensionsDecisionGraph.indexOf(getFileExtension(uri)) > -1) {
		analyzeParseTreeDecisionGraph()
	} 
	else if(fileExtensionsPolicySpace.indexOf(getFileExtension(uri)) > -1) {
		analyzeParseTreePolicySpace()
	} 
	else if (fileExtensionsvalueInference.indexOf(getFileExtension(uri)) > -1) {
		analyzeParseTreeValueInference()
	}

	return result
}


// function newLocation(uri : DocumentUri, pos1_line : number, pos1_char : number, pos2_line : number, pos2_char : number) : Location {
// 	let range = newRange(pos1_line, pos1_char, pos2_line, pos2_char)
// 	return 	{
// 		uri: uri,
// 		range: range
// 	}
// }

// function newRange(pos1_line : number, pos1_char : number, pos2_line : number, pos2_char : number) : Range {
// 	let pos1 : Position = Position.create(pos1_line, pos1_char)
// 	let pos2 : Position = Position.create(pos2_line, pos2_char)
// 	return {start: pos1,end: pos2}
// }

function point2Position(p : Point) : Position {
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
	return re.exec(filename)[1];   
}

