console.log("hello!");
//{OnigRegExp, OnigScanner} = require ('oniguruma');
var  onig = require ('oniguruma');
var scanner = new onig.OnigScanner(['c', 'a(b)?']);
const fs = require('fs');
import * as vsctm from 'vscode-textmate';
import * as onigLibs from './onigLibs';
import * as path from 'path';

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
            if (scopeName === 'source.js') {
				let cwd = __dirname + "/../../";
				//let grammarPath = path.resolve(__dirname, '../../', 'syntaxes/Javascript.tmLanguage.json.txt');
				let grammarPath = path.resolve(__dirname, '../../', 'syntaxes/Javascript.plist');
				return Promise.resolve(vsctm.parseRawGrammar(fs.readFileSync(grammarPath).toString(), grammarPath))
				
            }
            console.log(`Unknown scope name: ${scopeName}`);
            return null;
        }, getOnigLib: () => onigLibs.getOniguruma()
	});
	
	//const onigurumaRegistry = new Registry({ loadGrammar, getOnigLib: () => onigLibs.getOniguruma()});

    // Load the JavaScript grammar and any other grammars included by it async.
    registry.loadGrammar('source.js').then(grammar => {
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
