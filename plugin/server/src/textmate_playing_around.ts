console.log("hello!");
//{OnigRegExp, OnigScanner} = require ('oniguruma');
var  onig = require ('oniguruma');

var scanner = new onig.OnigScanner(['c', 'a(b)?']);

const fs = require('fs');
const vsctm = require('vscode-textmate');

/**
 * Utility to read a file as a promise 
 */
function readFile(path) { 
    return new Promise((resolve, reject) => {
        fs.readFile(path, (error, data) => error ? reject(error) : resolve(data));
    })
}

export function runme() {

    // Create a registry that can create a grammar from a scope name.
    const registry = new vsctm.Registry({
        loadGrammar: (scopeName) => {
            if (scopeName === 'source.ts') {
                let cwd = __dirname + "/../../";
                // https://github.com/textmate/javascript.tmbundle/blob/master/Syntaxes/JavaScript.plist
                return readFile(cwd + './syntaxes/Javascript.plist').then(data => vsctm.parseRawGrammar(data.toString()))
            }
            console.log(`Unknown scope name: ${scopeName}`);
            return null;
        }
    });

    // Load the JavaScript grammar and any other grammars included by it async.
    registry.loadGrammar('source.ts').then(grammar => {
        const text = [
            `function sayHello(name) {`,
            `\treturn "Hello, " + name;`,
            `}`
        ];
        let ruleStack = vsctm.INITIAL;
        for (let i = 0; i < text.length; i++) {
            const line = text[i];
            const lineTokens = grammar.tokenizeLine(line, ruleStack);
            console.log(`\nTokenizing line: ${line}`);
            for (let j = 0; j < lineTokens.tokens.length; j++) {
                const token = lineTokens.tokens[j];
                console.log(` - token from ${token.startIndex} to ${token.endIndex} ` +
                `(${line.substring(token.startIndex, token.endIndex)}) ` +
                `with scopes ${token.scopes.join(', ')}`
                );
            }
            ruleStack = lineTokens.ruleStack;
        }
    });

}
