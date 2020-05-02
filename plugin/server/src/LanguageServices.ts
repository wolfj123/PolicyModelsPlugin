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


//https://www.npmjs.com/package/web-tree-sitter

//https://github.com/bash-lsp/bash-language-server/blob/master/server/src/parser.ts
//https://github.com/bash-lsp/bash-language-server/blob/790f5a5203af62755d6cec38ef1620e2b2dc0dcd/server/src/analyser.ts#L269


export class LanguageServicesFacade {
	services : LanguageServices

	static async init(docs : PMTextDocument[], pluginDir: string) : Promise<LanguageServicesFacade> {
		let instance : LanguageServicesFacade = new LanguageServicesFacade
		let services : LanguageServices = await LanguageServices.init(docs, pluginDir)
		instance.services = services
		return instance
	}

	//TODO: it has to be async
	// constructor(docs : TextDocWithChanges[]) {
	// 	this.services = new LanguageServices(docs)
	// }

	addDocs(docs : PMTextDocument[]) {
		this.services.addDocs(docs)
	}

	updateDoc(doc : PMTextDocument){
		this.services.updateDoc(doc)
	}

	removeDoc(doc : DocumentUri) {
		this.services.removeDoc(doc)
	}

	onDefinition(params : DeclarationParams):  LocationLink[] {
		let location : Location = Utils.position2Location(params.position, params.textDocument.uri)
		let locations : Location[] = this.services.getDeclarations(location)
		
		let result : LocationLink[] = locations.map(loc =>{
			let rangeOfDoc : Range = this.services.getRangeOfDoc(loc.uri)
			if(isNullOrUndefined(rangeOfDoc)) {return null}
			return {
				targetUri : loc.uri,
				targetSelectionRange: loc.range,
				targetRange: rangeOfDoc
			}
		})
		return result.filter(loc => !isNullOrUndefined(loc))
	}

	// these functions are called when the request is first made from the server
	onReferences(params : ReferenceParams):  Location[] {
		let location : Location = Utils.position2Location(params.position, params.textDocument.uri)
		return this.services.getReferences(location)
	}

	onPrepareRename(params : PrepareRenameParams): Range | null {
		let location : Location = Utils.position2Location(params.position, params.textDocument.uri)
		let entity : PolicyModelEntity = this.services.createPolicyModelEntity(location)
		if(isNullOrUndefined(entity)) {return null}
		let pos1 : Position = Utils.point2Position(entity.syntaxNode.startPosition)
		let pos2 : Position = Utils.point2Position(entity.syntaxNode.endPosition)
		let range : Range = Utils.newRange(pos1, pos2)
		return range
	}

	onRenameRequest(params : RenameParams) : Location[]	{		//WorkspaceEdit {
		let location : Location = Utils.position2Location(params.position, params.textDocument.uri)
		return this.services.getReferences(location)
	}

	onCompletion(params : TextDocumentPositionParams): CompletionList { //return a list of labels
		//TODO:
		return null
	}

	onCompletionResolve(params : CompletionItem): CompletionItem { //we are not supporting  this right now
		//TODO:
		return null
	}

	onFoldingRanges(params : FoldingRangeParams): Location[] {
		return this.services.getFoldingRanges(params.textDocument.uri)
	}
}

export enum PolicyModelsLanguage {
	PolicySpace,
	DecisionGraph,
	ValueInference
}

export class LanguageServices {
	//Workspace
	fileManagers : Map<DocumentUri, FileManager>

	//config
	parsers : Map<PolicyModelsLanguage, Parser>
	parsersInfo = 	//TODO: maybe extract this info from package.json
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

	static async init(docs : PMTextDocument[], pluginDir: string /*uris : DocumentUri[]*/) : Promise<LanguageServices> {
		let instance : LanguageServices = new LanguageServices();
		// let fullPath:string = process.cwd();
		// let idx: number = fullPath.indexOf("plugin");
		// let pluginPath: string;
		// if (idx === -1){
		// 	pluginPath = fullPath;
		// }else {
		// 	pluginPath = fullPath.substring(0,  idx + 6);
		// }
		// console.log(`plugin path in facade ${pluginPath}`);
		// let parsersPath: string = path.join(pluginPath,"parsers");
		
		//console.log(`language facade init plugin dir is: ${pluginDir}`);

		let parsersPath: string = path.join(pluginDir,"parsers");
		await instance.initParsers(parsersPath)
		instance.fileManagers = new Map()
		instance.populateMaps(docs)
		return instance
	}

	//TODO: async
	// constructor(docs : TextDocWithChanges[] /*uris : DocumentUri[]*/) {
	// 	this.initParsers()
	// 	this.fileManagers = new Map()
	// 	this.populateMaps(docs)
	// }

	addDocs(docs : PMTextDocument[]) {
		this.populateMaps(docs)
	}

	updateDoc(doc : PMTextDocument){
		let fileManager : FileManager = this.fileManagers.get(doc.uri)
		if(isNullOrUndefined(fileManager)) return
		let parser : Parser = this.getParserByExtension(Utils.getFileExtension(doc.uri))
		const edits : Parser.Edit[] = doc.lastChanges.map(change => Utils.changeInfo2Edit(change))
		let tree : Parser.Tree = fileManager.tree
		edits.forEach((edit : Parser.Edit) => {
			tree.edit(edit)
			fileManager.updateTree(parser.parse(doc.getText())) //TODO: hopefully passing whole text with several changes doesn't break it
		});
	}

	removeDoc(doc : DocumentUri) {
		this.fileManagers.delete(doc)
	}

	//maybe this map should be global singleton?
	async initParsers(parserPath: string) {
		this.parsers = new Map()
		for(let info of this.parsersInfo) {
			const wasm = path.join(parserPath,info.wasm);
			await Parser.init()
			const parser = new Parser()
			const lang = await Parser.Language.load(wasm)
			parser.setLanguage(lang)
			this.parsers.set(info.language,parser)
		}
	}

	getLanguageByExtension(extension : string) : PolicyModelsLanguage | null {
		if(isNullOrUndefined(this.parsers)) return null
		const correspondingInfo = this.parsersInfo.filter(info => info.fileExtentsions.indexOf(extension) != -1)
		if(!(correspondingInfo) || correspondingInfo.length == 0) return null
		return correspondingInfo[0].language
	}

	getParserByExtension(extension : string) : Parser {
		const language = this.getLanguageByExtension(extension)
		return this.parsers.get(language)
	}

	populateMaps(docs : PMTextDocument[]) {
		for (let doc of docs) {
			const uri = doc.uri //doc.textDocument.uri
			const extension = Utils.getFileExtension(uri)
			// let fileManager : FileManager = FileManagerFactory.create(doc, 
			// 	this.getParserByExtension(extension), 
			// 	this.getLanguageByExtension(extension))
			let fileManager : FileManager = this.getFileManager(doc, extension)
			this.fileManagers.set(doc.uri, fileManager)
		}
	}

	getFileManager(doc : PMTextDocument, extension : string) : FileManager {
		return FileManagerFactory.create(doc, 
			this.getParserByExtension(extension), 
			this.getLanguageByExtension(extension))
	}

	getFileManagerByLocation(location : Location) : FileManager {
		return this.fileManagers.get(location.uri)
	}

	getDeclarations(location : Location) : Location[] {
		let fm : FileManager = this.getFileManagerByLocation(location)
		let entity : PolicyModelEntity = fm.createPolicyModelEntity(location)
		if(isNullOrUndefined(entity)) return []
		
		let result : Location[] = []
		this.fileManagers.forEach((fm: FileManager, uri: DocumentUri) => {
			result = result.concat(fm.getAllDefinitions(entity))
		});
		return result
	}

	getReferences(location : Location) : Location[] {
		let result : Location[] = []
		let declarations : Location[] = []
		let docsWithDeclaration : DocumentUri[] = []
		let references : Location[] = []

		let fm : FileManager = this.getFileManagerByLocation(location)
		let entity : PolicyModelEntity = fm.createPolicyModelEntity(location)

		//get all the declarations of the entity and their source files
		this.fileManagers.forEach((fm: FileManager, uri: DocumentUri) => {	
			let locs : Location[] = fm.getAllDefinitions(entity)
			declarations = declarations.concat(locs)
			if(locs.length > 0) {
				docsWithDeclaration.push(fm.uri)
			}
		});
		
		//if no source file, then just get all the references
		if(docsWithDeclaration.length == 0){
			this.fileManagers.forEach((fm: FileManager, uri: DocumentUri) => {
				references = references.concat(fm.getAllReferences(entity))
			});
		}
		//if there is a source file, then get all the references from that source
		else {
			docsWithDeclaration.forEach((uri: DocumentUri) => {	
				entity.setSource(uri)
				this.fileManagers.forEach((fm: FileManager, uri: DocumentUri) => {
					references = references.concat(fm.getAllReferences(entity))
				});
			});
		}

		result = result.concat(declarations) //we include declarations in this query
		result = result.concat(references)
		result = Utils.uniqueArray(result)
		return result
	}

	getRangeOfDoc(uri : DocumentUri) : Range | null {
		let fm : FileManager = this.fileManagers.get(uri)
		if(isNullOrUndefined(fm)) {return null}
		let pos1 : Position = Utils.point2Position(fm.tree.rootNode.startPosition)
		let pos2 : Position = Utils.point2Position(fm.tree.rootNode.endPosition)
		let range : Range = Utils.newRange(pos1, pos2)
		return range
	}

	createPolicyModelEntity(location : Location) : PolicyModelEntity | null {
		let fm : FileManager = this.fileManagers.get(location.uri)
		if(isNullOrUndefined(fm)) {return null}
		let entity : PolicyModelEntity = fm.createPolicyModelEntity(location)
		return entity
	}
	
	getFoldingRanges(uri : DocumentUri) : Location[] | null {
		let result : Location[] = []
		let fm : FileManager = this.fileManagers.get(uri)
		if(isNullOrUndefined(fm)) {return null}
		return fm.getFoldingRanges()
		// this.fileManagers.forEach((fm: FileManager, uri: DocumentUri) => {	
		// 	result = result.concat(fm.getFoldingRanges())
		// });
		// return result
	}

	getCompletion(location : Location) : Location[] {
		//TODO:
		//return []
		throw new Error("Method not implemented.");
	}
}



//****Entities****/
export enum PolicyModelEntityType {
	DGNode,
	Slot,
	SlotValue,
	ValueInference,
	InferencePair
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
			category){
		this.name = name
		this.type = type
		this.syntaxNode = syntaxNode
		this.location = Utils.newLocation(source, 
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


//****File Managers****/
export abstract class FileManager {
	tree : Parser.Tree
	uri : DocumentUri

	constructor(tree : Parser.Tree, uri : DocumentUri){
		this.tree = tree
		this.uri = uri
	}

	updateTree(newTree : Parser.Tree) {
		this.tree = newTree
	}

	isLocationInDoc(location : Location) : boolean {
		if (!(location.uri === this.uri)) return false
		return true
	}

	getNodeFromLocation(location : Location) : Parser.SyntaxNode | null {
		if(!this.isLocationInDoc(location)) return null
		const position : Position = location.range.start
	 	return this.tree.walk().currentNode().namedDescendantForPosition(Utils.position2Point(position))
	}

	rangeArray2LocationArray(ranges : Range[]) : Location[] {
		return ranges.map(range => Utils.newLocation(this.uri, range))
	}

	getAllDefinitions(entity : PolicyModelEntity) : Location[] {
		if(isNullOrUndefined(entity)) {return []}
		switch(entity.getType()){
			case PolicyModelEntityType.DGNode: 
				return this.getAllDefinitionsDGNode(entity.getName())
			case PolicyModelEntityType.Slot: 
				return this.getAllDefinitionsSlot(entity.getName())
			case PolicyModelEntityType.SlotValue: 
				return this.getAllDefinitionsSlotValue(entity.getName())
			default:
				return undefined
		}

	}

	getAllReferences(entity : PolicyModelEntity) : Location[] {
		if(isNullOrUndefined(entity)) {return []}
		switch(entity.getType()){
			case PolicyModelEntityType.DGNode: 
				return this.getAllReferencesDGNode(entity.getName(), entity.source)
			case PolicyModelEntityType.Slot: 
				return this.getAllReferencesSlot(entity.getName(), entity.source)
			case PolicyModelEntityType.SlotValue: 
				return this.getAllReferencesSlotValue(entity.getName(), entity.source)
			default:
				return undefined
		}
	}

	abstract createPolicyModelEntity(location : Location) : PolicyModelEntity

	abstract getAllDefinitionsDGNode(name : string) : Location[]
	abstract getAllDefinitionsSlot(name : string) : Location[]
	abstract getAllDefinitionsSlotValue(name : string) : Location[]

	abstract getAllReferencesDGNode(name : string, source : DocumentUri) : Location[]
	abstract getAllReferencesSlot(name : string, source : DocumentUri) : Location[]
	abstract getAllReferencesSlotValue(name : string, source : DocumentUri) : Location[]

	abstract getFoldingRanges() : Location[]

	abstract getAutoComplete(location : Location)
}

export class FileManagerFactory {
	static create(doc : PMTextDocument, parser : Parser, language : PolicyModelsLanguage, cacheVersion : boolean = false) : FileManager | null {
		const uri = doc.uri
		const extension = Utils.getFileExtension(uri)
		//let parser = getParserByExtension(extension)
		//let language = getLanguageByExtension(extension)
		let tree : Parser.Tree = parser.parse(doc.getText()) 
		switch(language) {
			case PolicyModelsLanguage.DecisionGraph:
				return (cacheVersion) ? new DecisionGraphFileManagerWithCache(tree, uri) : new DecisionGraphFileManager(tree, uri)

			case PolicyModelsLanguage.PolicySpace:
				return (cacheVersion) ? new PolicySpaceFileManagerWithCache(tree, uri) : new PolicySpaceFileManager(tree, uri)	
						
			case PolicyModelsLanguage.ValueInference:
				return (cacheVersion) ? new ValueInferenceFileManagerWithCache(tree, uri) : new ValueInferenceFileManager(tree, uri)
				
			default:
				return null
		}
	}
}

export class DecisionGraphFileManager extends FileManager {
	createPolicyModelEntity(location : Location): PolicyModelEntity | null {
		let node : Parser.SyntaxNode = this.getNodeFromLocation(location)
		if(isNullOrUndefined(node)) {return null}
		return DecisionGraphServices.createEntityFromNode(node, location.uri)
	}
	getAllDefinitionsDGNode(name: string): Location[] {
		let ranges : Range[] = DecisionGraphServices.getAllDefinitionsOfNodeInDocument(name, this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getAllDefinitionsSlot(name: string): Location[] {
		return []
	}
	getAllDefinitionsSlotValue(name: string): Location[] {
		return []
	}
	getAllReferencesDGNode(name: string, source : DocumentUri): Location[] {
		let ranges : Range[] = DecisionGraphServices.getAllReferencesOfNodeInDocument(name, this.tree, source)
		return this.rangeArray2LocationArray(ranges)
	}
	getAllReferencesSlot(name: string, source : DocumentUri): Location[] {
		let ranges : Range[] = DecisionGraphServices.getAllReferencesOfSlotInDocument(name, this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getAllReferencesSlotValue(name: string, source : DocumentUri): Location[] {
		let ranges : Range[] = DecisionGraphServices.getAllReferencesOfSlotValueInDocument(name, this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getFoldingRanges(): Location[] {
		let ranges : Range[] = DecisionGraphServices.getAllNodesInDocument(this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getAutoComplete(location: Location) {
		//TODO:
		throw new Error("Method not implemented.");
	}
}

export class PolicySpaceFileManager extends FileManager {
	createPolicyModelEntity(location : Location): PolicyModelEntity | null {
		let node : Parser.SyntaxNode = this.getNodeFromLocation(location)
		if(isNullOrUndefined(node)) {return null}
		return PolicySpaceServices.createEntityFromNode(node, location.uri)
	}
	getAllDefinitionsDGNode(name: string): Location[] {
		return []
	}
	getAllDefinitionsSlot(name: string): Location[] {
		let ranges : Range[] = PolicySpaceServices.getAllDefinitionsOfSlotInDocument(name, this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getAllDefinitionsSlotValue(name: string): Location[] {
		let ranges : Range[] = PolicySpaceServices.getAllDefinitionsOfSlotValueInDocument(name, this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getAllReferencesDGNode(name: string, source : DocumentUri): Location[] {
		return []
	}
	getAllReferencesSlot(name: string, source : DocumentUri): Location[] {
		let ranges : Range[] = PolicySpaceServices.getAllReferencesOfSlotInDocument(name, this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getAllReferencesSlotValue(name: string, source : DocumentUri): Location[] {
		let ranges : Range[] = PolicySpaceServices.getAllDefinitionsOfSlotValueInDocument(name, this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getFoldingRanges(): Location[] {
		let ranges : Range[] = PolicySpaceServices.getAllSlotsInDocument(this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getAutoComplete(location: Location) {
		//TODO:
		throw new Error("Method not implemented.");
	}
}

export class ValueInferenceFileManager extends FileManager {
	createPolicyModelEntity(location : Location): PolicyModelEntity | null {
		let node : Parser.SyntaxNode = this.getNodeFromLocation(location)
		if(isNullOrUndefined(node)) {return null}
		return ValueInferenceServices.createEntityFromNode(node, location.uri)
	}
	getAllDefinitionsDGNode(name: string): Location[] {
		return []
	}
	getAllDefinitionsSlot(name: string): Location[] {
		return []
	}
	getAllDefinitionsSlotValue(name: string): Location[] {
		return []
	}
	getAllReferencesDGNode(name: string, source: string): Location[] {
		return []
	}
	getAllReferencesSlot(name: string, source: string): Location[] {
		let ranges : Range[] = ValueInferenceServices.getAllReferencesOfSlotInDocument(name, this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getAllReferencesSlotValue(name: string, source: string): Location[] {
		let ranges : Range[] = ValueInferenceServices.getAllReferencesOfSlotValueInDocument(name, this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getFoldingRanges(): Location[] {
		let ranges : Range[] = []
		ranges = ranges.concat(ValueInferenceServices.getAllValueInferencesInDocument(this.tree))
		ranges = ranges.concat(ValueInferenceServices.getAllInferencePairsInDocument(this.tree))
		return this.rangeArray2LocationArray(ranges)
	}
	getAutoComplete(location: Location) {
		throw new Error("Method not implemented.");
	}
}



//****Cache variant****/
export class LanguageServicesWithCache extends LanguageServices {
	static async init(docs : PMTextDocument[], pluginDir: string /*uris : DocumentUri[]*/) : Promise<LanguageServicesWithCache> {
		let instance : LanguageServicesWithCache = new LanguageServicesWithCache();
		//console.log(`language facade init plugin dir is: ${pluginDir}`);
		let parsersPath: string = path.join(pluginDir,"parsers");
		await instance.initParsers(parsersPath)
		instance.fileManagers = new Map()
		instance.populateMaps(docs)
		return instance
	}

	getFileManager(doc : PMTextDocument, extension : string) : FileManager {
		return FileManagerFactory.create(doc, 
			this.getParserByExtension(extension), 
			this.getLanguageByExtension(extension), true)
	}
}

export class DecisionGraphFileManagerWithCache extends DecisionGraphFileManager {
	cache : PolicyModelEntity[]

	constructor(tree : Parser.Tree, uri : DocumentUri){
		super(tree, uri)
		this.cache = DecisionGraphServices.getAllEntitiesInDoc(tree, uri)
	}

	updateTree(newTree : Parser.Tree) {
		this.tree = newTree
		this.cache = DecisionGraphServices.getAllEntitiesInDoc(newTree, this.uri)
	}

	getAllDefinitionsDGNode(name: string): Location[] {
		const type = PolicyModelEntityType.DGNode
		const category = PolicyModelEntityCategory.Declaration
		return this.cache
			.filter(e => e.getName() === name && e.getCategory() == category && e.getType() == type)
			.map(e => e.location)
	}

	getAllReferencesDGNode(name: string, source : DocumentUri): Location[] {
		const type = PolicyModelEntityType.DGNode
		const category1 = PolicyModelEntityCategory.Reference
		const category2 = PolicyModelEntityCategory.Declaration
		return this.cache
			.filter(e => e.getName() === name && (e.getCategory() == category1 ||  e.getCategory() == category2) && e.getType() == type)
			.map(e => e.location)
	}
	getAllReferencesSlot(name: string, source : DocumentUri): Location[] {
		const type = PolicyModelEntityType.Slot
		const category = PolicyModelEntityCategory.Reference
		return this.cache
			.filter(e => e.getName() === name && e.getCategory() == category && e.getType() == type)
			.map(e => e.location)
	}
	getAllReferencesSlotValue(name: string, source : DocumentUri): Location[] {
		const type = PolicyModelEntityType.Slot
		const category = PolicyModelEntityCategory.Reference
		return this.cache
			.filter(e => e.getName() === name && e.getCategory() == category && e.getType() == type)
			.map(e => e.location)
	}
	getFoldingRanges(): Location[] {
		const category = PolicyModelEntityCategory.FoldRange
		return this.cache
			.filter(e => e.getCategory() == category )
			.map(e => e.location)
	}
	getAutoComplete(location: Location) {
		//TODO:
		throw new Error("Method not implemented.");
	}
}

export class PolicySpaceFileManagerWithCache extends PolicySpaceFileManager {}

export class ValueInferenceFileManagerWithCache extends ValueInferenceFileManager {}



//****Language Specific Static Services****/
export class DecisionGraphServices {
	static nodeTypes : string[] = [
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
		'continue_node',
	]

	static createEntityFromNode(node : Parser.SyntaxNode, uri : DocumentUri) : PolicyModelEntity | null {
		let name : string
		switch(node.type) {
			//case 'node_id':
			case 'node_id_value':
				let nodeWithText : Parser.SyntaxNode
				// if(node.type === 'node_id') {
				// 	nodeWithText = node.descendantsOfType('node_id_value')[0]
				// }
				// else {
					nodeWithText = node
				//}
				name = nodeWithText.text

				let source : DocumentUri = (nodeWithText.parent.type === 'node_reference') ? undefined : uri ;
				let category : PolicyModelEntityCategory = (nodeWithText.parent.type === 'node_reference') ? PolicyModelEntityCategory.Reference : PolicyModelEntityCategory.Declaration ;
				return new PolicyModelEntity(name, PolicyModelEntityType.DGNode, nodeWithText, uri, category)
			case 'slot_identifier':
				name = node.text
				return new PolicyModelEntity(name, PolicyModelEntityType.Slot, node, uri, PolicyModelEntityCategory.Reference)
					
			case 'slot_value':
				name = node.text
				return new PolicyModelEntity(name, PolicyModelEntityType.SlotValue, node, uri, PolicyModelEntityCategory.Reference)	
			default:
				return null
		}
	}

	static getAllEntitiesInDoc(tree : Parser.Tree, uri : DocumentUri) : PolicyModelEntity[] {
		let result : PolicyModelEntity[] = []
		for (let node of nextNode(tree)) {
			if(this.nodeTypes.indexOf(node.type) > -1) {
				result.push(new PolicyModelEntity(node.type, PolicyModelEntityType.DGNode, node, uri, PolicyModelEntityCategory.FoldRange))
			}
			else {
				let entity = DecisionGraphServices.createEntityFromNode(node, uri)
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
			if(this.nodeTypes.indexOf(node.type) > -1){
				result.push(node)
			}
		}
		return getRangesOfSyntaxNodes(result)
	}
}

export class PolicySpaceServices {
	
	static createEntityFromNode(node : Parser.SyntaxNode, uri : DocumentUri) : PolicyModelEntity | null {
		let name : string
		if(node.type === 'identifier_value') {
			name = node.text
			switch(node.parent.type) {
				case 'identifier':
					return new PolicyModelEntity(name, PolicyModelEntityType.Slot, node, uri, PolicyModelEntityCategory.Declaration)	
				case 'compound_values':					
					return new PolicyModelEntity(name, PolicyModelEntityType.Slot, node, uri, PolicyModelEntityCategory.Reference)					
				case 'slot_value':
					return new PolicyModelEntity(name, PolicyModelEntityType.SlotValue, node, uri, PolicyModelEntityCategory.Declaration)
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
				result.push(new PolicyModelEntity(node.type, PolicyModelEntityType.Slot, node, uri, PolicyModelEntityCategory.FoldRange))
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
					return new PolicyModelEntity(name, PolicyModelEntityType.Slot, node, uri, PolicyModelEntityCategory.Reference)					
				case 'slot_value':
					return new PolicyModelEntity(name, PolicyModelEntityType.SlotValue, node, uri, PolicyModelEntityCategory.Reference)	
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
				result.push(new PolicyModelEntity(node.type , PolicyModelEntityType.ValueInference, node, uri, PolicyModelEntityCategory.FoldRange))
			}
			else if(node.type === "inference_pair") {
				result.push(new PolicyModelEntity(node.type , PolicyModelEntityType.InferencePair, node, uri, PolicyModelEntityCategory.FoldRange))
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

function getRangesOfSyntaxNodes(nodes : Parser.SyntaxNode[]) : Range[] {
	return nodes.map(
		id => {
			return Utils.newRange(Utils.point2Position(id.startPosition), Utils.point2Position(id.endPosition))
		}
	)
}



















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


