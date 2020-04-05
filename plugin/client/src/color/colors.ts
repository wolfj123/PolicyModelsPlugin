/******** COLOR SYNTAX ********/

//text mate scopes:
//https://macromates.com/manual/en/language_grammars

import * as Parser from 'web-tree-sitter'

export type Range = {start: Parser.Point, end: Parser.Point}
export type ColorFunction = (x: Parser.Tree, visibleRanges: {start: number, end: number}[]) => Map<string, Range[]>


export function colorDecisionGraph(root: Parser.Tree, visibleRanges: {start: number, end: number}[]) {
	//const functions: Range[] = []
	const nodeIds: Range[] = []
	const nodeTypes: Range[] = []
	const freeTexts: Range[] = []
	const slotValues: Range[] = []
	const freeTextAnswerTerm : Range[] = []
	const slots: Range[] = []

	const keywordsStrings : string[] = [
		"todo",
		"ask",
		"text",
		"terms",
		"answers",
		"call",
		"consider",
		"options",
		"else",
		"when",
		"section",
		"title",
		"continue",
		"end",
		"reject",
		"set",
		"slot",
		"#import"
	]


	let visitedChildren = false
	let cursor = root.walk()
	let parents = [cursor.nodeType]
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
		// // Skip nodes that are not visible
		if (!visible(cursor, visibleRanges)) {
			visitedChildren = true
			continue
		}
		// Color tokens
		const parent = parents[parents.length - 1]
		const grandparent = parents[parents.length - 2]
		if(keywordsStrings.indexOf(cursor.nodeType) > -1){
			nodeTypes.push({start: cursor.startPosition, end: cursor.endPosition})
		}
		else {
			switch (cursor.nodeType) {
				case 'free_text':
					let node = cursor.currentNode()
					let nextNode = node.nextSibling;
					if(nextNode != null && nextNode.type == ':') {
						freeTextAnswerTerm.push({start: cursor.startPosition, end: cursor.endPosition})	
					} 
					else {
						freeTexts.push({start: cursor.startPosition, end: cursor.endPosition})
					}
					break
				case 'node_id':
					nodeIds.push({start: cursor.startPosition, end: cursor.endPosition})	
					break
				case 'slot_identifier':
					slots.push({start: cursor.startPosition, end: cursor.endPosition})	
					break
				case 'decision_graph_name':
					nodeIds.push({start: cursor.startPosition, end: cursor.endPosition})	
					break
				case 'node_id_value':
					if (parent != 'node_id') {
						nodeIds.push({start: cursor.startPosition, end: cursor.endPosition})
					}	
					break
				case 'slot_value':
					slotValues.push({start: cursor.startPosition, end: cursor.endPosition})	
					break
				case 'slot_reference':
					slots.push({start: cursor.startPosition, end: cursor.endPosition})	
					break
				case 'file_path':
					freeTexts.push({start: cursor.startPosition, end: cursor.endPosition})
					break
			}
		}
	}

	return new Map([
		//['entity.name.function', functions],
		['variable', nodeIds],
		//['constant.numeric', slotValues],
		['constant.numeric', slotValues],
		['entity.name.type', slots],								//TODO: this is temporary color for now, only to see that it works
		['keyword.control', freeTextAnswerTerm],
		['string', freeTexts],
		['keyword', nodeTypes]
	])
}

export function colorPolicySpace(root: Parser.Tree, visibleRanges: {start: number, end: number}[]) {
	const slots: Range[] = []
	const slotValues: Range[] = []

	let visitedChildren = false
	let cursor = root.walk()
	let parents = [cursor.nodeType]
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
		// Color tokens
		const parent = parents[parents.length - 1]
		const grandparent = parents[parents.length - 2]
		switch (cursor.nodeType) {
			case 'identifier_value':
				if (grandparent == 'identifier') {
					slots.push({start: cursor.startPosition, end: cursor.endPosition})
				}
			case 'slot_value':
				slotValues.push({start: cursor.startPosition, end: cursor.endPosition})
			break
		}
	}

	return new Map([
		['entity.name.type', slots],
		['constant.numeric', slotValues],
	])
}

export function colorValueInference(root: Parser.Tree, visibleRanges: {start: number, end: number}[]) {
	const slots: Range[] = []
	const slotValues: Range[] = []
	const keywords : Range[] = []

	const keywordsStrings : string[] = [
		"support",
		"->"
	]

	let visitedChildren = false
	let cursor = root.walk()
	let parents = [cursor.nodeType]
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
		// Color tokens
		const parent = parents[parents.length - 1]
		const grandparent = parents[parents.length - 2]
		if(keywordsStrings.indexOf(cursor.nodeType) > -1){
			keywords.push({start: cursor.startPosition, end: cursor.endPosition})
		}
		else {
			switch (cursor.nodeType) {
				case 'slot_identifier':
					if (parent === 'slot_reference') {
						slots.push({start: cursor.startPosition, end: cursor.endPosition})
					}
				break
				case 'slot_value':
					// if (parent != 'slot_identifier')
					slotValues.push({start: cursor.startPosition, end: cursor.endPosition})
				break
			}
		}
	}

	return new Map([
		['entity.name.type', slots],
		['constant.numeric', slotValues],
		['keyword', keywords]
	])
}


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