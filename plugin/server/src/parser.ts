
const Parser = require('tree-sitter');
const PolicySpace = require('tree-sitter-policyspace');
const DecisionGraph = require('tree-sitter-decisiongraph');

const parser = new Parser();
parser.setLanguage(PolicySpace);
//Then you can parse some source code,

const sourceCode = 'myslot : one of a, b .';
const tree = parser.parse(sourceCode);
//and inspect the syntax tree.

console.log(tree.rootNode.toString());

//output should be this:
// (policyspace 
// 	(slot 
// 		(identifier_simple) 
// 		(atomic_values 
// 			(identifier_simple) 
// 			(identifier_simple))))


//Replace 'one of' with 'some of'
const newSourceCode = 'myslot : some of a, b .';

tree.edit({
  startIndex: 9,
  oldEndIndex: 11,
  newEndIndex: 12,
  startPosition: {row: 0, column: 9},
  oldEndPosition: {row: 0, column: 11},
  newEndPosition: {row: 0, column: 12},
});

const newTree = parser.parse(newSourceCode, tree);
console.log(newTree.rootNode.toString());

//output should be this:
// (policyspace 
// 	(slot 
// 		(identifier_simple) 
// 		(aggregate_values 
// 			(identifier_simple) 
// 			(identifier_simple))))



const getMethods = (obj) => {
	let properties = new Set()
	let currentObj = obj
	do {
	  Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
	} while ((currentObj = Object.getPrototypeOf(currentObj)))
	return [...properties.keys()].filter(item => typeof obj[item] === 'function')
  }

//Traverse
//https://tree-sitter.github.io/tree-sitter/using-parsers#walking-trees-with-tree-cursors

let cursor = newTree.rootNode.walk();
//console.log(cursor);
console.log(cursor.nodeType);
cursor.gotoFirstChild();
console.log(cursor.nodeType);
console.log(cursor.currentNode);
cursor.gotoFirstChild();
console.log(cursor.nodeType);
console.log(cursor.currentNode);


// console.log(newTree.rootNode.toString());
// console.log(newTree.rootNode.toString());
// console.log(newTree.rootNode.toString());
// console.log(newTree.rootNode.toString());
// console.log(newTree.rootNode.toString());



//more features here:
// https://github.com/tree-sitter/node-tree-sitter
// https://github.com/tree-sitter/node-tree-sitter/blob/master/index.js

//policyspace ast examples:
// https://github.com/wolfj123/tree-sitter-policyspace/tree/master/test/corpus

//decisiongraph ast examples:
// https://github.com/wolfj123/tree-sitter-decisiongraph/tree/master/test/corpus


