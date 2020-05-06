import {
	ReferenceParams,
	DocumentUri,
	Location,
	Range,
	Position,
	TextDocument,
	DeclarationParams,
	RenameParams,
	LocationLink,
	CompletionItem,
	TextDocumentPositionParams,
	FoldingRangeParams,
	FoldingRange,
	FoldingRangeKind,
	WorkspaceEdit,
	TextDocumentEdit,
	CompletionList,
	CompletionItemKind,
	TextDocuments,
	TextDocumentIdentifier,
	TextDocumentChangeEvent,
	DidChangeWatchedFilesParams,
	PrepareRenameParams,
} from 'vscode-languageserver';
import * as Parser from 'web-tree-sitter';
import { TextEdit } from 'vscode-languageserver-textdocument';
import { Analyzer } from './Analyzer';
import * as Utils from './Utils'
import * as path from 'path';
import { isNullOrUndefined } from 'util';
import { PMTextDocument } from './Documents';


export enum PolicyModelsLanguage {
	PolicySpace,
	DecisionGraph,
	ValueInference
}

export const parsersInfo = 	//TODO: maybe extract this info from package.json
[ 
	{ 
		fileExtentsions : ['dg'],
		language : PolicyModelsLanguage.DecisionGraph,
		wasm : 'tree-sitter-decisiongraph.wasm',
	},
	{ 
		fileExtentsions : ['pspace', 'ps', 'ts'],
		language : PolicyModelsLanguage.PolicySpace,
		wasm : 'tree-sitter-policyspace.wasm',
	},
	{ 
		fileExtentsions :  ['vi'],
		language : PolicyModelsLanguage.ValueInference,
		wasm : 'tree-sitter-valueinference.wasm',
	}
]

export function getLanguageByExtension(extension : string) : PolicyModelsLanguage | null {
	const correspondingInfo = parsersInfo.filter(info => info.fileExtentsions.indexOf(extension) != -1)
	if(!(correspondingInfo) || correspondingInfo.length == 0) return null
	return correspondingInfo[0].language
}


//****Entities****/
export enum PolicyModelEntityType {
	DGNode,
	Slot,
	SlotValue,
	ValueInference,
	InferencePair,
	Keyword
}

export enum PolicyModelEntityCategory {
	FoldRange,
	Declaration,
	Reference
}

export class PolicyModelEntity {
	type : PolicyModelEntityType
	name : string
	source? : DocumentUri
	syntaxNode : Parser.SyntaxNode
	location : Location
	category : PolicyModelEntityCategory

	constructor(
			name : string , 
			type : PolicyModelEntityType, 
			syntaxNode : Parser.SyntaxNode, 
			source : DocumentUri, 
			uri : DocumentUri,
			category){
		this.name = name
		this.type = type
		this.syntaxNode = syntaxNode
		this.location = Utils.newLocation(
			uri,
			Utils.newRange(
				Utils.point2Position(syntaxNode.startPosition), 
				Utils.point2Position(syntaxNode.endPosition)))
		this.source = source
		this.category = category
	}

	getType() : PolicyModelEntityType {
		return this.type
	}

	getName() : string {
		return this.name
	}

	getSource() : DocumentUri {
		return this.source
	}

	setSource(uri : DocumentUri) {
		this.source = uri
	}

	getCategory() : PolicyModelEntityCategory {
		return this.category
	}
}

function getRangesOfSyntaxNodes(nodes : Parser.SyntaxNode[]) : Range[] {
	return nodes.map(
		id => {
			return Utils.newRange(Utils.point2Position(id.startPosition), Utils.point2Position(id.endPosition))
		}
	)
}

function* nextNode(root : Parser.Tree, visibleRanges: {start: number, end: number}[] = undefined) {
	function visible(x: Parser.TreeCursor, visibleRanges: {start: number, end: number}[]) {
		if(visibleRanges) {
			for (const { start, end } of visibleRanges) {
				const overlap = x.startPosition.row <= end + 1 && start - 1 <= x.endPosition.row
				if (overlap) return true
			}
			return false
		}
		return true
	}

	let visitedChildren = false
	let cursor = root.walk()
	let parents = [cursor.nodeType]
	let parent
	let grandparent
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

		yield cursor.currentNode()
	}
}


//****Language Specific Static Services****/

const mainNodesTypes : string[] = [
	'text_sub_node',
	'terms_sub_node',
	'term_sub_node',
	'answers_sub_node',
	'answer_sub_node',
	'slot_sub_node',
	'consider_options_sub_node',
	'consider_option_sub_node',
	'else_sub_node',
	'when_answer_sub_node',
	'info_sub_node',
]

const subNodesTypes : string[] = [
	'ask_node',
	'continue_node',
	'todo_node',
	'call_node',
	'reject_node',
	'set_node',
	'section_node',
	'part_node',
	'consider_node',
	'when_node',
	'import_node',
	'end_node',
	'continue_node',
]

const nodeTypes : string[] = mainNodesTypes.concat(subNodesTypes)


export class DecisionGraphServices {	
	static createEntityFromNode(node : Parser.SyntaxNode, uri : DocumentUri, importMap : Map<string, string> = undefined) : PolicyModelEntity | null {
		let name : string
		let source : DocumentUri
		let category : PolicyModelEntityCategory
		switch(node.type) {
			//case 'node_id':
			case 'node_id_value':	
			 	name = node.text
				switch(node.parent.type){
					case 'node_reference':
						category = PolicyModelEntityCategory.Reference
						let parent = node.parent
						let graph_name_node = parent.descendantsOfType('decision_graph_name')
						if(isNullOrUndefined(graph_name_node) || graph_name_node.length == 0) {
							source = uri
						} 
						else {
							source = isNullOrUndefined(importMap) ? 
								undefined : 
								//importMap[graph_name_node[0].text.trim()]
								importMap.get(graph_name_node[0].text.trim())
						}

						break;
					case 'node_id':
						category = PolicyModelEntityCategory.Declaration
						source = uri
						break;
				}
				return new PolicyModelEntity(name, PolicyModelEntityType.DGNode, node, source, uri, category)
			case 'slot_identifier':
				name = node.text
				return new PolicyModelEntity(name, PolicyModelEntityType.Slot, node, undefined, uri, PolicyModelEntityCategory.Reference)
			case 'slot_value':
				name = node.text
				return new PolicyModelEntity(name, PolicyModelEntityType.SlotValue, node, undefined, uri, PolicyModelEntityCategory.Reference)	
			default:
				return null
		}
	}

	static getAllEntitiesInDoc(tree : Parser.Tree, uri : DocumentUri) : PolicyModelEntity[] {
		let result : PolicyModelEntity[] = []
		let imports : Parser.SyntaxNode[] = tree.walk().currentNode().descendantsOfType("import_node")
		let importMap : Map<string, string>
		
		if (imports.length > 0) {
			//	imports.forEach
			importMap = new Map()
			imports.forEach(imp => {
				let filename : string = imp.descendantsOfType("file_path")[0].text.trim()
				let graphname : string = imp.descendantsOfType("decision_graph_name")[0].text.trim()
				importMap.set(graphname, filename)
			})
		}

		for (let node of nextNode(tree)) {
			if(nodeTypes.indexOf(node.type) > -1) {
				result.push(new PolicyModelEntity(node.type, PolicyModelEntityType.DGNode, node, uri, uri, PolicyModelEntityCategory.FoldRange))
			}
			else {
				let entity = DecisionGraphServices.createEntityFromNode(node, uri, importMap)
				if(!isNullOrUndefined(entity)) {
					result.push(entity)
				}
			}
		}
		return result
	}

	static getAllDefinitionsOfNodeInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let nodeIds : Parser.SyntaxNode[] = root.descendantsOfType("node_id")
		let relevantIds = nodeIds
			.map(id => id.descendantsOfType("node_id_value")[0])
			.filter(id => id.text === name)

		return getRangesOfSyntaxNodes(relevantIds)
	}

	static getAllReferencesOfNodeInDocument(name : string, tree : Parser.Tree, decisiongraphSource : DocumentUri = undefined /*if the node is from another file*/) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let importedGraphName

		if(decisiongraphSource) {
			let imports : Parser.SyntaxNode[] = root.descendantsOfType("import_node")
			let importSource : Parser.SyntaxNode = imports.find(
				node => 
					{ 
						return node.descendantsOfType("file_path")[0].text.trim() === decisiongraphSource
					}
				)
			if(importSource){
				importedGraphName = importSource.descendantsOfType("decision_graph_name")[0].text
			}
		}

		let references : Parser.SyntaxNode[] = root.descendantsOfType("node_reference")
		let relevantReferences = references.filter(
			ref => 
			{
				return ref.descendantsOfType("node_id_value")[0].text === name &&
					(!(importedGraphName) || (importedGraphName &&
					ref.descendantsOfType("decision_graph_name").length > 0 && ref.descendantsOfType("decision_graph_name")[0].text === importedGraphName))
			}	
		).map(ref => {return ref.descendantsOfType("node_id_value")[0]})
		return getRangesOfSyntaxNodes(relevantReferences)
	}

	static getAllReferencesOfSlotInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let slotRefs : Parser.SyntaxNode[] = root.descendantsOfType("slot_reference")
		let slotIdentifiers : Parser.SyntaxNode[] = Utils.flatten(slotRefs.map(ref => ref.descendantsOfType("slot_identifier")))
		let relevant = slotIdentifiers.filter(id => id.text === name)
		return getRangesOfSyntaxNodes(relevant)
	}
	
	static getAllReferencesOfSlotValueInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let slotRefs : Parser.SyntaxNode[] = root.descendantsOfType("slot_value")
		let relevant = slotRefs.filter(id => id.text === name)
		return getRangesOfSyntaxNodes(relevant)
	}

	static getAllNodesInDocument(tree : Parser.Tree) : Range[] {
		
		//let root : Parser.SyntaxNode = tree.walk().currentNode()
		let result : Parser.SyntaxNode[] = []
		for (let node of nextNode(tree)) {
			if(nodeTypes.indexOf(node.type) > -1){
				result.push(node)
			}
		}
		return getRangesOfSyntaxNodes(result)
	}

	static getCompletion(tree : Parser.Tree, range : Range) : PolicyModelEntityType | null {
		//TODO:
		let result : PolicyModelEntityType = null
		let cursor : Parser.TreeCursor = tree.walk()
		let node : Parser.SyntaxNode = cursor.currentNode().descendantForPosition(Utils.position2Point(range.start), Utils.position2Point(range.end))
		console.log(node.type)
		console.log(node.hasError())
		console.log(node.text)
		
		
		return result
	}
}

export class PolicySpaceServices {
	static createEntityFromNode(node : Parser.SyntaxNode, uri : DocumentUri) : PolicyModelEntity | null {
		let name : string
		if(node.type === 'identifier_value') {
			name = node.text
			switch(node.parent.type) {
				case 'identifier':
					return new PolicyModelEntity(name, PolicyModelEntityType.Slot, node, uri, uri, PolicyModelEntityCategory.Declaration)	
				case 'compound_values':					
					return new PolicyModelEntity(name, PolicyModelEntityType.Slot, node, uri, uri, PolicyModelEntityCategory.Reference)					
				case 'slot_value':
					return new PolicyModelEntity(name, PolicyModelEntityType.SlotValue, node, uri, uri, PolicyModelEntityCategory.Declaration)
				default:
					return null	
			}
		}
		return null
	} 

	static getAllEntitiesInDoc(tree : Parser.Tree, uri : DocumentUri) : PolicyModelEntity[] {
		let result : PolicyModelEntity[] = []
		for (let node of nextNode(tree)) {
			if(node.type === "slot") {
				result.push(new PolicyModelEntity(node.type, PolicyModelEntityType.Slot, node, uri, uri, PolicyModelEntityCategory.FoldRange))
			}
			else {
				let entity = PolicySpaceServices.createEntityFromNode(node, uri)
				if(!isNullOrUndefined(entity)) {
					result.push(entity)
				}
			}
		}
		return result
	}
	
	static getAllDefinitionsOfSlotInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let slots : Parser.SyntaxNode[] = root.descendantsOfType("slot")
		let relevantSlots = slots
			.map(slot => slot.children.find(child => child.type === "identifier"))
			.filter(id => id && id.descendantsOfType("identifier_value")[0].text === name)
			.map(id => id.descendantsOfType("identifier_value")[0])
		return getRangesOfSyntaxNodes(relevantSlots)
	}

	static getAllReferencesOfSlotInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let identifiers : Parser.SyntaxNode[] = root.descendantsOfType("identifier_value")
		let relevantIdentifiers = identifiers
			.filter(id => !(id.parent.type === "identifier") && !(id.parent.type === "slot_value"))
			.filter(id => id.text === name)
		return getRangesOfSyntaxNodes(relevantIdentifiers)
	}
	
	static getAllDefinitionsOfSlotValueInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let values : Parser.SyntaxNode[] = root.descendantsOfType("slot_value")
		let relevantIdentifiers = values
			.map(val => val.descendantsOfType("identifier_value")[0])
			.filter(id => id.text === name)
		return getRangesOfSyntaxNodes(relevantIdentifiers)
	}

	static getAllSlotsInDocument(tree : Parser.Tree) : Range[] {
		//TODO: this maybe can be made faster without using descendantsOfType
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let result : Parser.SyntaxNode[] = root.descendantsOfType("slot")
		return getRangesOfSyntaxNodes(result)
	}
}

export class ValueInferenceServices {
	static createEntityFromNode(node : Parser.SyntaxNode, uri : DocumentUri) : PolicyModelEntity | null {
		let name : string
		if(node.type === 'slot_identifier') {
			name = node.text
			switch(node.parent.type) {
				case 'slot_reference':				
					return new PolicyModelEntity(name, PolicyModelEntityType.Slot, node, undefined, uri, PolicyModelEntityCategory.Reference)					
				case 'slot_value':
					return new PolicyModelEntity(name, PolicyModelEntityType.SlotValue, node, undefined, uri, PolicyModelEntityCategory.Reference)	
				default:
					return null
			}
		}
		return null
	} 

	static getAllEntitiesInDoc(tree : Parser.Tree, uri : DocumentUri) : PolicyModelEntity[] {
		let result : PolicyModelEntity[] = []
		for (let node of nextNode(tree)) {
			if(node.type === "value_inference") {
				result.push(new PolicyModelEntity(node.type , PolicyModelEntityType.ValueInference, node, uri, uri, PolicyModelEntityCategory.FoldRange))
			}
			else if(node.type === "inference_pair") {
				result.push(new PolicyModelEntity(node.type , PolicyModelEntityType.InferencePair, node, uri, uri, PolicyModelEntityCategory.FoldRange))
			}
			else {
				let entity = ValueInferenceServices.createEntityFromNode(node, uri)
				if(!isNullOrUndefined(entity)) {
					result.push(entity)
				}
			}
		}
		return result
	}

	static getAllReferencesOfSlotInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let identifiers : Parser.SyntaxNode[] = Utils.flatten(root.descendantsOfType("slot_reference")
			.map(id => id.descendantsOfType("slot_identifier")))
		let relevantIdentifiers = identifiers.filter(ref => ref.text === name)
		return getRangesOfSyntaxNodes(relevantIdentifiers)
	}
	
	static getAllReferencesOfSlotValueInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let identifiers : Parser.SyntaxNode[] = root.descendantsOfType("slot_value")
			.map(id => id.descendantsOfType("slot_identifier")[0])
		let relevantIdentifiers = identifiers.filter(ref => ref.text === name)
		return getRangesOfSyntaxNodes(relevantIdentifiers)
	}

	static getAllValueInferencesInDocument(tree : Parser.Tree) : Range[] {
		//TODO: this maybe can be made faster without using descendantsOfType
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let result : Parser.SyntaxNode[] = root.descendantsOfType("value_inference")
		return getRangesOfSyntaxNodes(result)
	}

	static getAllInferencePairsInDocument(tree : Parser.Tree) : Range[] {
		//TODO: this maybe can be made faster without using descendantsOfType
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let result : Parser.SyntaxNode[] = root.descendantsOfType("inference_pair")
		return getRangesOfSyntaxNodes(result)
	}
}



{
	/*************DEMO*********/
	//demoDecisionGraphGetAllReferencesOfNodeInDocument()
	//demoDecisionGraphGetAllDefinitionsOfNodeInDocument()
	//demoDecisionGraphGetAllReferencesOfSlotInDocument()
	//demoDecisionGraphGetAllReferencesOfSlotValueInDocument()
	//demoDecisionGraphGetAllNodesInDocument()
	//demoPolicySpaceGetAllDefinitionsOfSlotInDocument()
	//demoPolicySpaceGetAllReferencesOfSlotInDocument()
	//demoPolicySpaceGetAllDefinitionsOfSlotValueInDocument()
	//demoValueInferenceAllReferencesOfSlotValueInDocument()

	async function demoDecisionGraphGetAllReferencesOfNodeInDocument() {
		await Parser.init()
		const parser = new Parser()
		const wasm = 'parsers/tree-sitter-decisiongraph.wasm'
		const lang = await Parser.Language.load(wasm)
		parser.setLanguage(lang)
		let tree
		let sourceCode
		let result

		//Then you can parse some source code,
		sourceCode = `
		[>bb< ask:
		{>asd< text: Do the data contain health information?}
		{answers:
		{yes: [ >yo< call: asd]}}]
		`;
		// tree = parser.parse(sourceCode);
		// result = DecisionGraphServices.getAllReferencesOfNodeInDocument("asd", tree)
		// console.log(result)

		sourceCode = `[#import dg : file.dg]
		[>bb< ask:
		{text: Do the data contain health information?}
		{answers:
		{yes: [ >yo< call: dg>asd]}}]
		`;
		tree = parser.parse(sourceCode);
		result = DecisionGraphServices.getAllReferencesOfNodeInDocument("asd", tree, "file.dg")
		console.log(result)

		
		sourceCode = ` [#import dg : file.dg]
		[>bb< ask:
		{text: Do the data contain health information?}
		{answers:
		{yes: [ >yo< call: dg2>asd]}}]
		`;
		tree = parser.parse(sourceCode);
		result = DecisionGraphServices.getAllReferencesOfNodeInDocument("asd", tree, "file.dg")
		console.log(result)
	}

	async function demoDecisionGraphGetAllDefinitionsOfNodeInDocument() {
		await Parser.init()
		const parser = new Parser()
		const wasm = 'parsers/tree-sitter-decisiongraph.wasm'
		const lang = await Parser.Language.load(wasm)
		parser.setLanguage(lang)
		let tree
		let sourceCode
		let result

		sourceCode = ` [#import dg : file.dg]
		[>asd< ask:
		{text: Do the data contain health information?}
		{answers:
		{yes: [ >yo< call: dg>asd]}}]
		`;
		tree = parser.parse(sourceCode);
		result = DecisionGraphServices.getAllDefinitionsOfNodeInDocument("asd", tree)
		console.log(result)
		result = DecisionGraphServices.getAllDefinitionsOfNodeInDocument("yo", tree)
		console.log(result)
	}

	async function demoDecisionGraphGetAllReferencesOfSlotInDocument() {
		await Parser.init()
		const parser = new Parser()
		const wasm = 'parsers/tree-sitter-decisiongraph.wasm'
		const lang = await Parser.Language.load(wasm)
		parser.setLanguage(lang)
		let tree
		let sourceCode
		let result

		sourceCode = `[set: 
		DataTags/Mid1/Bottom1=b1a; 
		DataTags/Mid2/Mid1+=
		{b2b, b2c}]`;
		tree = parser.parse(sourceCode);
		result = DecisionGraphServices.getAllReferencesOfSlotInDocument("Mid1", tree)
		console.log(result)
	}

	async function demoDecisionGraphGetAllReferencesOfSlotValueInDocument() {
		await Parser.init()
		const parser = new Parser()
		const wasm = 'parsers/tree-sitter-decisiongraph.wasm'
		const lang = await Parser.Language.load(wasm)
		parser.setLanguage(lang)
		let tree
		let sourceCode
		let result

		sourceCode = `[set: 
		DataTags/Mid1/Bottom1=b1a; 
		DataTags/Mid2/Mid1+= {b2b, b1a}]`;
		tree = parser.parse(sourceCode);
		result = DecisionGraphServices.getAllReferencesOfSlotValueInDocument("b1a", tree)
		console.log(result)
	}

	async function demoDecisionGraphGetAllNodesInDocument() {
		await Parser.init()
		const parser = new Parser()
		const wasm = 'parsers/tree-sitter-decisiongraph.wasm'
		const lang = await Parser.Language.load(wasm)
		parser.setLanguage(lang)
		let tree
		let sourceCode
		let result

		sourceCode = `[section:
			{title: Health Data}
			[ask:
			{text: Are there any related health issues?}
			{answers:
				{no: [continue]}
			}
			]
		
		]`;
		tree = parser.parse(sourceCode);
		result = DecisionGraphServices.getAllNodesInDocument(tree)
		console.log(result)
	}

	async function demoPolicySpaceGetAllDefinitionsOfSlotInDocument() {
		await Parser.init()
		const parser = new Parser()
		const wasm = 'parsers/tree-sitter-policyspace.wasm'
		const lang = await Parser.Language.load(wasm)
		parser.setLanguage(lang)
		let tree
		let sourceCode
		let result

		sourceCode = `Storage: one of clear, serverEncrypt, clientEncrypt, doubleEncrypt.
		Handling: consists of Storage, Transit, Authentication.
		IntellecualProperty: TODO.
		myslot[descriptions1] : some of something [description2], somethingElse [else thingy!], evenMoreSomething [much else?].
		`;
		tree = parser.parse(sourceCode);
		result = PolicySpaceServices.getAllDefinitionsOfSlotInDocument("IntellecualProperty", tree)
		console.log(result)
	}

	async function demoPolicySpaceGetAllReferencesOfSlotInDocument() {
		await Parser.init()
		const parser = new Parser()
		const wasm = 'parsers/tree-sitter-policyspace.wasm'
		const lang = await Parser.Language.load(wasm)
		parser.setLanguage(lang)
		let tree
		let sourceCode
		let result

		sourceCode = `Storage: one of clear, serverEncrypt, Authentication, doubleEncrypt.
		Handling: consists of Storage, Transit, Authentication.
		IntellecualProperty: TODO.
		myslot[descriptions1] : some of something [description2], somethingElse [else thingy!], evenMoreSomething [much else?].
		`;
		tree = parser.parse(sourceCode);
		result = PolicySpaceServices.getAllReferencesOfSlotInDocument("Storage", tree)
		console.log(result)
	}

	async function demoPolicySpaceGetAllDefinitionsOfSlotValueInDocument() {
		await Parser.init()
		const parser = new Parser()
		const wasm = 'parsers/tree-sitter-policyspace.wasm'
		const lang = await Parser.Language.load(wasm)
		parser.setLanguage(lang)
		let tree
		let sourceCode
		let result

		sourceCode = `Storage: one of clear, serverEncrypt, Authentication, doubleEncrypt.
		Handling: consists of Storage, Transit, Authentication.
		IntellecualProperty: TODO.
		myslot[descriptions1] : some of something [description2], Authentication [else thingy!], evenMoreSomething [much else?].
		`;
		tree = parser.parse(sourceCode);
		result = PolicySpaceServices.getAllDefinitionsOfSlotValueInDocument("Authentication", tree)
		console.log(result)
	}

	async function demoValueInferenceAllReferencesOfSlotValueInDocument() {
		await Parser.init()
		const parser = new Parser()
		const wasm = 'parsers/tree-sitter-valueinference.wasm'
		const lang = await Parser.Language.load(wasm)
		parser.setLanguage(lang)
		let tree
		let sourceCode
		let result

		sourceCode = `[DataTag: support
			[ Encrypt=None;   DUA_AM=Implied -> Blue    ]
			[ Encrypt=Quick;  DUA_AM=Click   -> Yellow  ]
			[ Encrypt=Hard;   DUA_AM=Click   -> DUA_AM   ]
			[ Encrypt=Double; DUA_AM=Type    -> Red     ]
			[ Encrypt=Double; DUA_AM=Sign    -> DUA_AM ]
		]
		`;
		tree = parser.parse(sourceCode);
		result = ValueInferenceServices.getAllReferencesOfSlotInDocument("DUA_AM", tree)
		console.log(result)

		tree = parser.parse(sourceCode);
		result = ValueInferenceServices.getAllReferencesOfSlotValueInDocument("Click", tree)
		console.log(result)

		tree = parser.parse(sourceCode);
		result = ValueInferenceServices.getAllReferencesOfSlotValueInDocument("DUA_AM", tree)
		console.log(result)
	}
}

dgplayground()

async function dgplayground() {
	await Parser.init()
	const parser = new Parser()
	const wasm = 'parsers/tree-sitter-decisiongraph.wasm'
	const lang = await Parser.Language.load(wasm)
	parser.setLanguage(lang)
	let tree
	let sourceCode
	let result

	//Then you can parse some source code,
	sourceCode = `[`;
	tree = parser.parse(sourceCode);
	let range : Range = {start: {character:1, line:0}, end:{character:0, line:0}}
	result = DecisionGraphServices.getCompletion(tree, range)
	console.log(result)
}

