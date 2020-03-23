/******** COLOR SYNTAX ********/
import Parser = require('web-tree-sitter')
import fs = require('fs')
import colors = require('./colors')

benchmarkPolicySpace()

async function benchmarkPolicySpace() {

    //console.log('Current directory: ' + process.cwd());
    await Parser.init()
    const parser = new Parser()
    const wasm = 'client/parsers/tree-sitter-policyspace.wasm'
    const lang = await Parser.Language.load(wasm)
    parser.setLanguage(lang)
    const text = fs.readFileSync('client/examples/policyspace/slots.pspace', {encoding: 'utf-8'})
    const tree = parser.parse(text)
    for (let i = 0; i < 10; i++) {
        console.time('colorPolicySpace')
        colors.colorGo(tree, [{start: 0, end: tree.rootNode.endPosition.row}])
        console.timeEnd('colorPolicySpace')
    }
}