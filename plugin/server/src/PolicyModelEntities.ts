import {
	ReferenceParams,
	Location,
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

function analyzeParseTree(root: Parser.Tree, visibleRanges: {start: number, end: number}[]) {
	let visitedChildren = false
	let cursor = root.walk()
	let parents = [cursor.nodeType]

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

	while(cursorNext()){

	}
}



