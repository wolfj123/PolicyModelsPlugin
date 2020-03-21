
const Parser = require('tree-sitter');
const PolicySpace = require('tree-sitter-policyspace');
const DecisionGraph = require('tree-sitter-decisiongraph');

const parser = new Parser();
parser.setLanguage(PolicySpace);
//Then you can parse some source code,

const sourceCode = 'myslot : one of something .';
const tree = parser.parse(sourceCode);
//and inspect the syntax tree.

console.log(tree.rootNode.toString());

//output should be this:

// (source_file 
//     (slot 
//         (identifier_simple) 
//         (atomic_values (identifier_simple))))


//more examples here:
// https://github.com/tree-sitter/node-tree-sitter/blob/master/README.md

