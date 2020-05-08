/******** COLOR SYNTAX ********/
import Parser = require('web-tree-sitter')
import colors = require('./colors')

type Assert = [string, string|{not:string}]
type TestCase = [string, ...Assert[]]



// ['entity.name.type', slots],
// ['constant.numeric', slotValues],

const policyspaceTests: TestCase[] = [
    [
        `Storage : one of clear, serverEncrypt.`, 
        ['Storage', 'entity.name.type'], ['clear', 'constant.numeric'], ['serverEncrypt', 'constant.numeric']
    ],
    [
        `StorageWithDescription [The way data are stored on the server.]: one of
        clear [Not encrypted at all],
        serverEncrypt [Encryption on the server, "at rest". Attacker cannot use the data by getting the files from the file system],
        clientEncrypt [Encryption on the client side. Data obtained from the server (e.g. buy data breach or subpeona) cannot be used unless the depositor provides the password],
        doubleEncrypt [Encryption on the client, and then on the server. Both passwords are required in order to make use of the data].`, 

        ['StorageWithDescription', 'entity.name.type'], 
        ['clear', 'constant.numeric'], 
        ['serverEncrypt', 'constant.numeric'], 
        ['clientEncrypt', 'constant.numeric'], 
        ['doubleEncrypt', 'constant.numeric']
    ],
    [
        `ProtectedDataSubjectsWithDescription [The type of entities that could be harmed by misuse of the data]: some of
        livingPersons [Living persons - including privacy issues],
        deadPeople [They don't know they're dead],
        endangeredSpecies [Endangered species need protection from poachers],
        rareMinerals [Disclosing location of rare minerals might lead to illegal mining].`, 

        ['ProtectedDataSubjectsWithDescription', 'entity.name.type'], 
        ['livingPersons', 'constant.numeric'], 
        ['deadPeople', 'constant.numeric'],
        ['endangeredSpecies', 'constant.numeric'],
        ['rareMinerals', 'constant.numeric']
    ],
    [
        `myslot[descriptions1] : consists of something, somethingElse , evenMoreSomething .`, 
        ['myslot', 'entity.name.type'], 
        ['something', 'entity.name.type'], 
        ['somethingElse', 'entity.name.type'], 
        ['evenMoreSomething', 'entity.name.type']
    ],
    [
        `myslot[descriptions1] : consists of something , <* a wild [comment] appears!*> somethingElse , evenMoreSomething.`, 
        ['myslot', 'entity.name.type'], 
        ['something', 'entity.name.type'], 
        ['somethingElse', 'entity.name.type'],
        ['evenMoreSomething', 'entity.name.type']
    ],
]





// ['variable', nodeIds],
// ['constant.numeric', slotValues],
// ['entity.name.type', slots],
// ['keyword.control', freeTextAnswerTerm],
// ['string', freeTexts],
// ['keyword', nodeTypes]


const decisiongrapTests: TestCase[] = [
    [
        `[ask:
            {text: Do the data concern living persons?}
            {answers:
              {yes?: [todo] }
              {no: [todo] }}]`, 

        ['ask', 'keyword'],
        ['Do the data concern living persons?', 'string'],
        ['text', 'keyword'],
        ['answers', 'keyword'],
        ['yes?', 'keyword.control'],
        ['todo', 'keyword'],
        ['no', 'keyword.control']
    ],
    [
        `[when:
            {Subjects+=livingPresons: [call: privacy]}
            {Subjects+=deceasedPresons; Domains += medical: [call: privacy]}
            {else:
              [call: open-data]
            }
          ]`, 

        ['when', 'keyword'],
        ['Subjects', 'entity.name.type'],
        ['livingPresons', 'constant.numeric'],
        ['call', 'keyword'],
        ['privacy', 'variable'],
        ['Subjects', 'entity.name.type'],
        ['deceasedPresons', 'constant.numeric'],
        ['Domains', 'entity.name.type'],
        ['medical', 'constant.numeric'],
        ['call', 'keyword'],
        ['privacy', 'variable'],
        ['else', 'keyword'],
        ['call', 'keyword'],
        ['open-data', 'variable'],
    ],
]


// ['entity.name.type', slots],
// ['constant.numeric', slotValues],
// ['keyword', keywords]

const valueinferenceTests: TestCase[] = [
    [
        `[DataTag: support
            [ Encrypt1=None;   DUA_AM1=Implied -> Blue ]
            [ Encrypt2=Quick;  DUA_AM2+=Click   -> Yellow ]
          ]`, 
        ['DataTag', 'entity.name.type'], 
        ['support', 'keyword'], 
        ['Encrypt1', 'entity.name.type'],
        ['None', 'constant.numeric'],
        ['DUA_AM1', 'entity.name.type'],
        ['Implied', 'constant.numeric'],
        ['Blue', 'constant.numeric'],
        ['Encrypt2', 'entity.name.type'],
        ['Quick', 'constant.numeric'],
        ['DUA_AM2', 'entity.name.type'],
        ['Click', 'constant.numeric'],
        ['Yellow', 'constant.numeric'],
    ],
]

console.log("Running Color unit tests:")
test(decisiongrapTests, 'parsers/tree-sitter-decisiongraph.wasm', colors.colorDecisionGraph, "DecisionGraph color")
test(policyspaceTests, 'parsers/tree-sitter-policyspace.wasm', colors.colorPolicySpace, "PolicySpace color")
test(valueinferenceTests, 'parsers/tree-sitter-valueinference.wasm', colors.colorValueInference, "Value Inference color")



async function test(testCases: TestCase[], wasm: string, color: colors.ColorFunction, testDescription : string) {
    await Parser.init()
    const parser = new Parser() 
    //console.log(testDescription)
    //console.log(__dirname)
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
    console.log("\t" + testDescription + " tests passed ("+testCases.length.toString()+" tests in total)")
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