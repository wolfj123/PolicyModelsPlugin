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
import * as Utils from './Utils'
import * as path from 'path';
import { isNullOrUndefined } from 'util';
import { PMTextDocument } from './Documents';
import { URI } from 'vscode-uri';

export declare type FilePath = string;

/**
 * A map in which a keys are the names of an imported decision graph and the values are their file paths
 */
export declare type ImportMap = Map<string, FilePath>

export enum PolicyModelsLanguage {
	PolicySpace,
	DecisionGraph,
	ValueInference
}

/**
 * An object list describing the necessary information to create an instance of a language parser
 */
export const parsersInfo = 	
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

/**
 * Returns the sum of two numbers.
 *
 * @param extension - the file type extension
 * @returns The PolicyModelsLanguage corresponding to the provided file extension
 */
export function getLanguageByExtension(extension : string) : PolicyModelsLanguage | null {
	const correspondingInfo = parsersInfo.filter(info => info.fileExtentsions.indexOf(extension) != -1)
	if(!(correspondingInfo) || correspondingInfo.length == 0) return null
	return correspondingInfo[0].language
}

/**
 * Given an absolute path to 1st file, and a relative path to 2nd file, 
 * returns the path to the 2nd file
 *
 * @param fromAbsolutePath absolute path to 1st file
 * @param toRelativePath relative path to 2nd file
 * @returns absolute path to 2nd file
 */
function resolvePaths(fromAbsolutePath : FilePath, toRelativePath : FilePath) : FilePath {
	let currFileDir : FilePath = path.dirname(fromAbsolutePath)
	//let absolutePath : FilePath = path.resolve(currFileDir, toRelativePath)
	// return absolutePath
	return path.normalize(path.join(currFileDir, toRelativePath))
}



/**
 * This class represents an entity found in a parse tree.
 * Instances of this class are the basis of all language services.
 * It holds all the necessary information to answer LSP queries.
 * Entity types are listed in {@link PolicyModelEntityType}
 * Entity category are listed in {@link PolicyModelEntityCategory}
 */
export class PolicyModelEntity {
	/**
 	* The type of the entity in the file
	*/
	type : PolicyModelEntityType

	/**
 	* The category of the entity in the file
	*/
	category : PolicyModelEntityCategory
	
	/**
 	* The name of the entity in the file
	*/
	name : string

	/**
	 * The file from which the entity originates. 
	 * //An _**undefined**_ value denotes that this is either irrelevant or originates from the same file it was found
	*/
	source : FilePath

	/**
	* The Syntax node from which this entity was originated
	*/
	syntaxNode : Parser.SyntaxNode

	/**
	 * The location of the this entity. (Derived from it's syntax node location)
	 */
	location : Location

	constructor(
			name : string , 
			type : PolicyModelEntityType, 
			syntaxNode : Parser.SyntaxNode, 
			sourceFile : FilePath, 
			currentFile : FilePath,
			category){
		this.name = name
		this.type = type
		this.syntaxNode = syntaxNode

		//derive location from syntax node
		this.location = Utils.newLocation(
			currentFile,
			Utils.newRange(
				Utils.point2Position(syntaxNode.startPosition), 
				Utils.point2Position(syntaxNode.endPosition)))

		//TODO: fileparse
		// if(!isNullOrUndefined(sourceFile)) {
		// 	this.source = resolvePaths(currentFile, sourceFile)
		// } 
		this.source = sourceFile
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

export enum PolicyModelEntityType {
	DGNode,
	Slot,
	SlotValue,
	ValueInference,
	InferencePair,
	ImportGraph
}

export enum PolicyModelEntityCategory {
	FoldRange,
	Declaration,
	Reference,
	Special
}


/**
 * Keywords for AutoComplete in Decision Graph files
 */
export const DecisionGraphKeywords : CompletionItem[] = [
	{label: "todo", kind: CompletionItemKind.Keyword},
	{label: "ask", kind: CompletionItemKind.Keyword},
	{label: "text", kind: CompletionItemKind.Keyword},
	{label: "term", kind: CompletionItemKind.Keyword},
	{label: "answers", kind: CompletionItemKind.Keyword},
	{label: "call", kind: CompletionItemKind.Keyword},
	{label: "consider", kind: CompletionItemKind.Keyword},
	{label: "slot", kind: CompletionItemKind.Keyword},
	{label: "options", kind: CompletionItemKind.Keyword},
	{label: "else", kind: CompletionItemKind.Keyword},
	{label: "when", kind: CompletionItemKind.Keyword},
	{label: "section", kind: CompletionItemKind.Keyword},
	{label: "title", kind: CompletionItemKind.Keyword},
	{label: "end", kind: CompletionItemKind.Keyword},
	{label: "reject", kind: CompletionItemKind.Keyword},
	{label: "set", kind: CompletionItemKind.Keyword},
	{label: "#import", kind: CompletionItemKind.Keyword},
]

/**
 * Keywords for AutoComplete in Policy Space files
 */
export const PolicySpaceKeywords : CompletionItem[] = [
	{label: "TODO", kind: CompletionItemKind.Keyword},
	{label: "one of", kind: CompletionItemKind.Keyword},
	{label: "some of", kind: CompletionItemKind.Keyword},
	{label: "consists of", kind: CompletionItemKind.Keyword},
]

/**
 * Keywords for AutoComplete in Value Inference files
 */
export const ValueInferenceKeywords : CompletionItem[] = [
	{label: "support", kind: CompletionItemKind.Keyword},
	{label: "comply", kind: CompletionItemKind.Keyword},
]


/**
 * Converts a {@link PolicyModelEntity} into a {@link CompletionItem}
 *
 * @param entity the entity to convert
 * @param currentFile current file in which the completion item is suggested. 
 * Used with import map to include imported decision graph file name in completion item label
 * @param importMap the import map of the current file
 * @returns CompletionItem representing the provided entity. 
 * Null if entity should be a suggested CompletionItem
 */
export function entity2CompletionItem(entity : PolicyModelEntity, currentFile : FilePath = undefined, importMap : ImportMap = undefined) : CompletionItem | null {
	let EntityType2CompletionItemKind : CompletionItemKind[] = []
	EntityType2CompletionItemKind[PolicyModelEntityType.DGNode] = CompletionItemKind.Variable
	EntityType2CompletionItemKind[PolicyModelEntityType.Slot] = CompletionItemKind.Enum
	EntityType2CompletionItemKind[PolicyModelEntityType.SlotValue] = CompletionItemKind.Value
	if(entity.getType() == PolicyModelEntityType.ImportGraph) {
		return null //import entities are not suggested in autocomplete
	}

	let kind : CompletionItemKind = EntityType2CompletionItemKind[entity.getType()]
	let prefix : string = ""
	if(!isNullOrUndefined(currentFile) && !isNullOrUndefined(importMap)){
		prefix =
		(entity.getType() == PolicyModelEntityType.DGNode && 
		[PolicyModelEntityCategory.Declaration, PolicyModelEntityCategory.Reference].indexOf(entity.getCategory()) > -1 && 
		!isNullOrUndefined(entity.getSource()) &&
		entity.getSource() !== currentFile && Utils.getMapKeysByValue(importMap, entity.getSource()).length > 0)
			? Utils.getMapKeysByValue(importMap, entity.getSource())[0].concat(">") : "" 
	}
	
	let label : string = prefix.concat(entity.getName())

	let result : CompletionItem = {
		label: label,
		kind: kind,
	}
	return result
}

function getRangesOfSyntaxNodes(nodes : Parser.SyntaxNode[]) : Range[] {
	return nodes.map(
		id => {
			return Utils.newRange(Utils.point2Position(id.startPosition), Utils.point2Position(id.endPosition))
		}
	)
}

/**
 * Generator gunction to iterate a {@link Parser.Tree} 
 *
 * @param root the {@link Parser.Tree} to iterate
 * @param visibleRanges the range of the visible text
 * @returns an {@link IterableIterator} of {@link Parser.SyntaxNode}
 */
function* nextNode(root : Parser.Tree, visibleRanges: {start: number, end: number}[] = undefined) : IterableIterator<Parser.SyntaxNode> {
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

/**
 * Main node type names, as returned from the {@link Parser.Tree}
 * of Decision Graph language
 */
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

/**
 * Sub-node type names, as returned from the {@link Parser.Tree}
 * of Decision Graph language
 */
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

/**
 * All node type names, as returned from the {@link Parser.Tree}
 * of Decision Graph language
 */
const nodeTypes : string[] = mainNodesTypes.concat(subNodesTypes)

/**
 * This class is a collection of basic analysis methods of a **Decision Graph** {@link Parser.Tree}
 * All the methods are static and store no information and cause no side-effects.
 * They are to be called by other classes to compose more complex queries
 */
export class DecisionGraphServices {	
	
	/**
	 * creates an {@link PolicyModelEntity} from a {@link Parser.SyntaxNode}
	 *
	 * @param node the  node to convert
	 * @param currentFile the current file from which the syntax node originated
	 * @param importMap the import map of the current file
	 * @returns the {@link PolicyModelEntity} derived from the node
	 */
	static createEntityFromNode(node : Parser.SyntaxNode, currentFile : FilePath, importMap : ImportMap = undefined) : PolicyModelEntity | null {
		let name : string
		let source : DocumentUri
		let category : PolicyModelEntityCategory
		switch(node.type) {				
			case 'node_id_value':	
			 	name = node.text
				switch(node.parent.type){
					case 'node_reference':
						category = PolicyModelEntityCategory.Reference
						let parent = node.parent

						//we need to check whether the node reference also contains an imported graph reference
						let graph_name_node = parent.descendantsOfType('decision_graph_name')
						if(isNullOrUndefined(graph_name_node) || graph_name_node.length == 0) {
							//in case there is no imported graph reference -> set the entity's source to be this file
							source = currentFile
						} 
						else {
							//in case there is an imported graph reference -> set the entity's source to be the imported graph's file
							source = isNullOrUndefined(importMap) ? 
								undefined : 
								importMap.get(graph_name_node[0].text.trim())
						}
						break;
					case 'node_id':
						category = PolicyModelEntityCategory.Declaration
						source = currentFile
						break;
				}
				return new PolicyModelEntity(name, PolicyModelEntityType.DGNode, node, source, currentFile, category)
			case 'slot_identifier':
				name = node.text
				return new PolicyModelEntity(name, PolicyModelEntityType.Slot, node, undefined, currentFile, PolicyModelEntityCategory.Reference)
			case 'slot_value':
				name = node.text
				return new PolicyModelEntity(name, PolicyModelEntityType.SlotValue, node, undefined, currentFile, PolicyModelEntityCategory.Reference)	
			// case 'import_node':
			// 	name = node.descendantsOfType("decision_graph_name")[0].text.trim()
			// 	return new PolicyModelEntity(name, PolicyModelEntityType.ImportGraph, node, undefined, uri, PolicyModelEntityCategory.Special)	
			default:
				return null
		}
	}

	/**
	 * TODO: add doc
	 */
	static getAllImportsInDoc(tree : Parser.Tree, currentFile : FilePath) : {imports: PolicyModelEntity[], importMap : ImportMap}  {
		let importNodes : Parser.SyntaxNode[] = tree.walk().currentNode().descendantsOfType("import_node")
		let imports : PolicyModelEntity[] = []
		
		if (importNodes.length > 0) {
			importNodes.forEach(imp => {
				let graphname : string = imp.descendantsOfType("decision_graph_name")[0].text.trim()
				let entity : PolicyModelEntity = new PolicyModelEntity(graphname, PolicyModelEntityType.ImportGraph, imp, undefined, currentFile, PolicyModelEntityCategory.Special)	
				imports.push(entity)
			})
		}

		return {
			imports: imports,
			importMap: DecisionGraphServices.importMapFromImportEntities(imports, currentFile)
		}
	}

	/**
	 * TODO: add doc
	 */
	static importMapFromImportEntities(imports: PolicyModelEntity[], currentFile : FilePath) : ImportMap {
		let importMap : ImportMap = new Map()
		
		if (imports.length > 0) {
			imports
				.map(importEntity => importEntity.syntaxNode)
				.filter(imp => imp.type === "import_node")
				.forEach(imp => {
					let filename : string = imp.descendantsOfType("file_path")[0].text.trim()
					filename = resolvePaths(currentFile, filename)
					let graphname : string = imp.descendantsOfType("decision_graph_name")[0].text.trim()
					importMap.set(graphname, filename)
				})
		}	
		return importMap
	}

	/**
	 * TODO: add doc
	 */
	static getAllEntitiesInDoc(tree : Parser.Tree, currentFile : FilePath) : {entities: PolicyModelEntity[], importMap : ImportMap} {
		let result : PolicyModelEntity[] = []
		let importsInfo : {imports: PolicyModelEntity[], importMap : Map<string, DocumentUri>} 
			= DecisionGraphServices.getAllImportsInDoc(tree, currentFile)

		for (let node of nextNode(tree)) {
			if(nodeTypes.indexOf(node.type) > -1) {
				result.push(new PolicyModelEntity(node.type, PolicyModelEntityType.DGNode, node, currentFile, currentFile, PolicyModelEntityCategory.FoldRange))
			}
			else {
				let entity = DecisionGraphServices.createEntityFromNode(node, currentFile, importsInfo.importMap)
				if(!isNullOrUndefined(entity)) {
					result.push(entity)
				}
			}
		}
		return {entities: result.concat(importsInfo.imports), importMap: importsInfo.importMap}
	}

	/**
	 * TODO: add doc
	 */
	static getAllDefinitionsOfNodeInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let nodeIds : Parser.SyntaxNode[] = root.descendantsOfType("node_id")
		let relevantIds = nodeIds
			.map(id => id.descendantsOfType("node_id_value")[0])
			.filter(id => id.text === name)

		return getRangesOfSyntaxNodes(relevantIds)
	}

	/**
	 * TODO: add doc
	 */
	static getAllReferencesOfNodeInDocument(name : string, tree : Parser.Tree, currentFile : FilePath, decisiongraphSource : FilePath = undefined /*if the node is from another file*/) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let importedGraphName

		if(decisiongraphSource) {
			let imports : Parser.SyntaxNode[] = root.descendantsOfType("import_node")
			let importSource : Parser.SyntaxNode = imports.find(
				node => 
					{ 
						return resolvePaths(currentFile, node.descendantsOfType("file_path")[0].text.trim()) === decisiongraphSource
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

	/** 
	 * TODO: add doc
	 */	
	static getAllReferencesOfSlotInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let slotRefs : Parser.SyntaxNode[] = root.descendantsOfType("slot_reference")
		let slotIdentifiers : Parser.SyntaxNode[] = Utils.flatten(slotRefs.map(ref => ref.descendantsOfType("slot_identifier")))
		let relevant = slotIdentifiers.filter(id => id.text === name)
		return getRangesOfSyntaxNodes(relevant)
	}
	
	/**
	 * TODO: add doc
	 */		
	static getAllReferencesOfSlotValueInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let slotRefs : Parser.SyntaxNode[] = root.descendantsOfType("slot_value")
		let relevant = slotRefs.filter(id => id.text === name)
		return getRangesOfSyntaxNodes(relevant)
	}
	
	/**
	 * TODO: add doc
	 */		
	static getAllNodesInDocument(tree : Parser.Tree) : Range[] {
		let result : Parser.SyntaxNode[] = []
		for (let node of nextNode(tree)) {
			if(nodeTypes.indexOf(node.type) > -1){
				result.push(node)
			}
		}
		return getRangesOfSyntaxNodes(result)
	}
}

/**
 * This class is a collection of basic analysis methods of a **Policy Space** {@link Parser.Tree}
 * All the methods are static and store no information and cause no side-effects.
 * They are to be called by other classes to compose more complex queries
 */
export class PolicySpaceServices {
		
	/**
	 * TODO: add doc
	 */
	static createEntityFromNode(node : Parser.SyntaxNode, currentFile : FilePath) : PolicyModelEntity | null {
		let name : string
		if(node.type === 'identifier_value') {
			name = node.text
			switch(node.parent.type) {
				case 'identifier':
					return new PolicyModelEntity(name, PolicyModelEntityType.Slot, node, currentFile, currentFile, PolicyModelEntityCategory.Declaration)	
				case 'compound_values':					
					return new PolicyModelEntity(name, PolicyModelEntityType.Slot, node, currentFile, currentFile, PolicyModelEntityCategory.Reference)					
				case 'slot_value':
					return new PolicyModelEntity(name, PolicyModelEntityType.SlotValue, node, currentFile, currentFile, PolicyModelEntityCategory.Declaration)
				default:
					return null	
			}
		}
		return null
	} 
	
	/**
	 * TODO: add doc
	 */
	static getAllEntitiesInDoc(tree : Parser.Tree, currentFile : FilePath) : PolicyModelEntity[] {
		let result : PolicyModelEntity[] = []
		for (let node of nextNode(tree)) {
			if(node.type === "slot") {
				result.push(new PolicyModelEntity(node.type, PolicyModelEntityType.Slot, node, currentFile, currentFile, PolicyModelEntityCategory.FoldRange))
			}
			else {
				let entity = PolicySpaceServices.createEntityFromNode(node, currentFile)
				if(!isNullOrUndefined(entity)) {
					result.push(entity)
				}
			}
		}
		return result
	}

	/**
	 * TODO: add doc
	 */	
	static getAllDefinitionsOfSlotInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let slots : Parser.SyntaxNode[] = root.descendantsOfType("slot")
		let relevantSlots = slots
			.map(slot => slot.children.find(child => child.type === "identifier"))
			.filter(id => id && id.descendantsOfType("identifier_value")[0].text === name)
			.map(id => id.descendantsOfType("identifier_value")[0])
		return getRangesOfSyntaxNodes(relevantSlots)
	}

	/**
	 * TODO: add doc
	 */
	static getAllReferencesOfSlotInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let identifiers : Parser.SyntaxNode[] = root.descendantsOfType("identifier_value")
		let relevantIdentifiers = identifiers
			.filter(id => !(id.parent.type === "identifier") && !(id.parent.type === "slot_value"))
			.filter(id => id.text === name)
		return getRangesOfSyntaxNodes(relevantIdentifiers)
	}
	
	/**
	 * TODO: add doc
	 */
	static getAllDefinitionsOfSlotValueInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let values : Parser.SyntaxNode[] = root.descendantsOfType("slot_value")
		let relevantIdentifiers = values
			.map(val => val.descendantsOfType("identifier_value")[0])
			.filter(id => id.text === name)
		return getRangesOfSyntaxNodes(relevantIdentifiers)
	}
	
	/**
	 * TODO: add doc
	 */
	static getAllSlotsInDocument(tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let result : Parser.SyntaxNode[] = root.descendantsOfType("slot")
		return getRangesOfSyntaxNodes(result)
	}
}

export class ValueInferenceServices {
	
	/**
	 * TODO: add doc
	 */
	static createEntityFromNode(node : Parser.SyntaxNode, currentFile : FilePath) : PolicyModelEntity | null {
		let name : string
		if(node.type === 'slot_identifier') {
			name = node.text
			switch(node.parent.type) {
				case 'slot_reference':				
					return new PolicyModelEntity(name, PolicyModelEntityType.Slot, node, undefined, currentFile, PolicyModelEntityCategory.Reference)					
				case 'slot_value':
					return new PolicyModelEntity(name, PolicyModelEntityType.SlotValue, node, undefined, currentFile, PolicyModelEntityCategory.Reference)	
				default:
					return null
			}
		}
		return null
	} 

	/**
	 * TODO: add doc
	 */
	static getAllEntitiesInDoc(tree : Parser.Tree, currentFile : FilePath) : PolicyModelEntity[] {
		let result : PolicyModelEntity[] = []
		for (let node of nextNode(tree)) {
			if(node.type === "value_inference") {
				result.push(new PolicyModelEntity(node.type , PolicyModelEntityType.ValueInference, node, currentFile, currentFile, PolicyModelEntityCategory.FoldRange))
			}
			else if(node.type === "inference_pair") {
				result.push(new PolicyModelEntity(node.type , PolicyModelEntityType.InferencePair, node, currentFile, currentFile, PolicyModelEntityCategory.FoldRange))
			}
			else {
				let entity = ValueInferenceServices.createEntityFromNode(node, currentFile)
				if(!isNullOrUndefined(entity)) {
					result.push(entity)
				}
			}
		}
		return result
	}

	/**
	 * TODO: add doc
	 */
	static getAllReferencesOfSlotInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let identifiers : Parser.SyntaxNode[] = Utils.flatten(root.descendantsOfType("slot_reference")
			.map(id => id.descendantsOfType("slot_identifier")))
		let relevantIdentifiers = identifiers.filter(ref => ref.text === name)
		return getRangesOfSyntaxNodes(relevantIdentifiers)
	}

	/**
	 * TODO: add doc
	 */	
	static getAllReferencesOfSlotValueInDocument(name : string, tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let identifiers : Parser.SyntaxNode[] = root.descendantsOfType("slot_value")
			.map(id => id.descendantsOfType("slot_identifier")[0])
		let relevantIdentifiers = identifiers.filter(ref => ref.text === name)
		return getRangesOfSyntaxNodes(relevantIdentifiers)
	}
	
	/**
	 * TODO: add doc
	 */	
	static getAllValueInferencesInDocument(tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let result : Parser.SyntaxNode[] = root.descendantsOfType("value_inference")
		return getRangesOfSyntaxNodes(result)
	}
	
	/**
	 * TODO: add doc
	 */	
	static getAllInferencePairsInDocument(tree : Parser.Tree) : Range[] {
		let root : Parser.SyntaxNode = tree.walk().currentNode()
		let result : Parser.SyntaxNode[] = root.descendantsOfType("inference_pair")
		return getRangesOfSyntaxNodes(result)
	}
}


