/******** COLOR SYNTAX ********/
import * as Parser from 'web-tree-sitter'

export type Range = {start: Parser.Point, end: Parser.Point}
export type ColorFunction = (x: Parser.Tree, visibleRanges: {start: number, end: number}[]) => Map<string, Range[]>


export function colorDecisionGraph(root: Parser.Tree, visibleRanges: {start: number, end: number}[]) {
	const functions: Range[] = []
	const variables: Range[] = []

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
		// if (!visible(cursor, visibleRanges)) {
		// 	visitedChildren = true
		// 	continue
		// }
		// Color tokens
		const parent = parents[parents.length - 1]
		const grandparent = parents[parents.length - 2]
		switch (cursor.nodeType) {
			case 'todo':
				if (parent == 'todo_node') {
					functions.push({start: cursor.startPosition, end: cursor.endPosition})
				}
			case 'ask':
				if (parent == 'ask_node') {
					functions.push({start: cursor.startPosition, end: cursor.endPosition})
				}
			case 'text':
				if (parent == 'text_sub_node') {
					functions.push({start: cursor.startPosition, end: cursor.endPosition})
				}
			case 'terms':
				if (parent == 'terms_sub_node') {
					functions.push({start: cursor.startPosition, end: cursor.endPosition})
				}
			case 'free_text':
				if (parent == 'term_sub_node') {
					functions.push({start: cursor.startPosition, end: cursor.endPosition})
				}
			case 'answers':
				if (parent == 'answers_sub_node') {
					functions.push({start: cursor.startPosition, end: cursor.endPosition})
				}
			case 'free_text':
				if (parent == 'answer_sub_node') {
					functions.push({start: cursor.startPosition, end: cursor.endPosition})
				}
			case 'call':
				if (parent == 'call_node') {
					functions.push({start: cursor.startPosition, end: cursor.endPosition})
				}
			case 'consider':
				if (parent == 'consider_node') {
					functions.push({start: cursor.startPosition, end: cursor.endPosition})
				}
			case 'slot':
				if (parent == 'slot_sub_node') {
					functions.push({start: cursor.startPosition, end: cursor.endPosition})
				}
			case 'options':
				if (parent == 'consider_options_sub_node') {
					functions.push({start: cursor.startPosition, end: cursor.endPosition})
				}
			case 'slot_value':
				if (parent == 'consider_option_sub_node') {
					functions.push({start: cursor.startPosition, end: cursor.endPosition})
				}
			case 'else':
				if (parent == 'else_sub_node') {
					functions.push({start: cursor.startPosition, end: cursor.endPosition})
				}
			case 'when':
				if (parent == 'when_node') {
					functions.push({start: cursor.startPosition, end: cursor.endPosition})
				}
			case 'assignment_slot':
				if (parent == 'when_answer_sub_node') {
					functions.push({start: cursor.startPosition, end: cursor.endPosition})
				}
								
			break
		}
	}

	return new Map([
		['entity.name.function', functions],
		['variable', variables],
	])
}

export function colorPolicySpace(root: Parser.Tree, visibleRanges: {start: number, end: number}[]) {
	const functions: Range[] = []
	const variables: Range[] = []

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
			case 'identifier_simple':
				if (parent == 'slot' || (parent == 'identifier_with_desc' && grandparent == 'slot')) {
					functions.push({start: cursor.startPosition, end: cursor.endPosition})
				}
				else {
					variables.push({start: cursor.startPosition, end: cursor.endPosition})
				}
			break
		}
	}

	return new Map([
		['entity.name.function', functions],
		['variable', variables],
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