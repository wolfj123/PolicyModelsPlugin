/******** COLOR SYNTAX ********/
import * as Parser from 'web-tree-sitter'

export type Range = {start: Parser.Point, end: Parser.Point}
export type ColorFunction = (x: Parser.Tree, visibleRanges: {start: number, end: number}[]) => Map<string, Range[]>

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