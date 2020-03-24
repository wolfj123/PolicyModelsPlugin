/******** COLOR SYNTAX ********/
import Parser = require('web-tree-sitter')
import colors = require('./colors')

type Assert = [string, string|{not:string}]
type TestCase = [string, ...Assert[]]


const policyspaceTests: TestCase[] = [
    [
        `Storage : one of clear, serverEncrypt.`, 
        ['Storage', 'entity.name.function'], ['clear', 'variable'], ['serverEncrypt', 'variable']
    ],
]
test(policyspaceTests, 'parsers/tree-sitter-policyspace.wasm', colors.colorPolicySpace)

async function test(testCases: TestCase[], wasm: string, color: colors.ColorFunction) {
    await Parser.init()
    const parser = new Parser()
    const lang = await Parser.Language.load(wasm)
    parser.setLanguage(lang)
    for (const [src, ...expect] of testCases) {
        const tree = parser.parse(src)
        const scope2ranges = color(tree, [{start: 0, end: tree.rootNode.endPosition.row}])
        const code2scopes = new Map<string, Set<string>>()
        for (const [scope, ranges] of scope2ranges) {
            for (const range of ranges) {
                const start = index(src, range.start)
                const end = index(src, range.end)
                const code = src.substring(start, end)
                if (!code2scopes.has(code)) {
                    code2scopes.set(code, new Set<string>())
                }
                code2scopes.get(code)!.add(scope)
            }
        }
        function printSrcAndTree() {
            console.error('Source:\t' + src)
            console.error('Parsed:\t' + tree.rootNode.toString())
            throw new Error('color tests failed');
        }
        for (const [code, assert] of expect) {
            if (typeof assert == 'string') {
                const scope = assert
                if (!code2scopes.has(code)) {
                    console.error(`Error:\tcode (${code}) was not found in (${join(code2scopes.keys())})`)
                    printSrcAndTree()
                    continue
                }
                const foundScopes = code2scopes.get(code)!
                if (!foundScopes.has(scope)) {
                    console.error(`Error:\tscope (${scope}) was not among the scopes for (${code}) (${join(foundScopes.keys())})`)
                    printSrcAndTree()
                    continue
                }
            } else {
                const scope = assert.not
                if (!code2scopes.has(code)) {
                    continue
                }
                const foundScopes = code2scopes.get(code)!
                if (foundScopes.has(scope)) {
                    console.error(`Error:\tbanned scope (${scope}) was among the scopes for (${code}) (${join(foundScopes.keys())})`)
                    printSrcAndTree()
                    continue
                }
            }
        }
    }
}
function index(code: string, point: Parser.Point): number {
    let row = 0
    let column = 0
    for (let i = 0; i < code.length; i++) {
        if (row == point.row && column == point.column) {
            return i
        }
        if (code[i] == '\n') {
            row++
            column = 0
        } else {
            column++
        }
    }
    return code.length
}
function join(strings: IterableIterator<string>) {
    var result = ''
    for (const s of strings) {
        result = result + s + ', '
    }
    return result.substring(0, result.length - 2)
}