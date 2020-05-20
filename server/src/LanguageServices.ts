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
import { PMTextDocument, createNewTextDocument } from './Documents';
import {
	entity2CompletionItem,
	DecisionGraphKeywords,
	PolicySpaceKeywords,
	ValueInferenceKeywords,
	PolicyModelsLanguage,
	parsersInfo,
	getLanguageByExtension,
	PolicyModelEntityType,
	PolicyModelEntityCategory,
	PolicyModelEntity,
	DecisionGraphServices,
	PolicySpaceServices,
	ValueInferenceServices,
	FilePath,
	ImportMap
} from './LanguageUtils'

//https://www.npmjs.com/package/web-tree-sitter
//https://github.com/bash-lsp/bash-language-server/blob/master/server/src/parser.ts
//https://github.com/bash-lsp/bash-language-server/blob/790f5a5203af62755d6cec38ef1620e2b2dc0dcd/server/src/analyser.ts#L269


export class LanguageServicesFacade {
	uriPathMap : Map<DocumentUri, FilePath>
	services : LanguageServices

	static async init(docs : PMTextDocument[], pluginDir: string) : Promise<LanguageServicesFacade> {
		let instance : LanguageServicesFacade = new LanguageServicesFacade
		instance.addToUriPathMap(docs)
		let convertedDocs : PMTextDocument[] = docs.map(doc => instance.convertUri2PathPMTextDocument(doc))
		let services : LanguageServices = await LanguageServicesWithCache.init(convertedDocs, pluginDir)
		instance.services = services
		return instance
	}

	addToUriPathMap(docs : PMTextDocument[]) {
		if(isNullOrUndefined(this.uriPathMap)){
			this.uriPathMap = new Map()
		}
		docs.forEach(doc => {
			const uri : DocumentUri = doc.uri
			const path : FilePath = Utils.Uri2FilePath(uri)
			this.uriPathMap.set(uri, path)
		})
	}

	addDocs(docs : PMTextDocument[]) {
		this.addToUriPathMap(docs)
		this.services.addDocs(docs.map(doc => this.convertUri2PathPMTextDocument(doc)))
	}

	updateDoc(doc : PMTextDocument){
		this.services.updateDoc(this.convertUri2PathPMTextDocument(doc))
	}

	removeDoc(doc : DocumentUri) {
		const path : FilePath = this.uriPathMap.get(doc)
		this.services.removeDoc(path)
		this.uriPathMap.delete(doc)
	}

	onDefinition(params : DeclarationParams):  LocationLink[] {
		let location : Location = Utils.position2Location(params.position, params.textDocument.uri)
		location = this.convertUri2PathLocation(location)
		let locations : Location[] = this.services.getDeclarations(location)
		
		let result : LocationLink[] = locations.map(loc =>{
			let rangeOfDoc : Range = this.services.getRangeOfDoc(loc.uri)
			if(isNullOrUndefined(rangeOfDoc)) {return null}
			return this.convertUri2PathLocationLink({
				targetUri : loc.uri,
				targetSelectionRange: loc.range,
				targetRange: rangeOfDoc
			}, false)
		})
		return result.filter(loc => !isNullOrUndefined(loc))
	}

	// these functions are called when the request is first made from the server
	onReferences(params : ReferenceParams):  Location[] {
		let location : Location = Utils.position2Location(params.position, params.textDocument.uri)
		location = this.convertUri2PathLocation(location)
		return this.services.getReferences(location).map(loc => this.convertUri2PathLocation(loc, false))
	}

	onPrepareRename(params : PrepareRenameParams): Range | null {
		let location : Location = Utils.position2Location(params.position, params.textDocument.uri)
		location = this.convertUri2PathLocation(location)
		let entity : PolicyModelEntity = this.services.createPolicyModelEntity(location)
		if(isNullOrUndefined(entity)) {return null}
		let pos1 : Position = Utils.point2Position(entity.syntaxNode.startPosition)
		let pos2 : Position = Utils.point2Position(entity.syntaxNode.endPosition)
		let range : Range = Utils.newRange(pos1, pos2)
		return range
	}

	onRenameRequest(params : RenameParams) : Location[]	{		//WorkspaceEdit {
		let location : Location = Utils.position2Location(params.position, params.textDocument.uri)
		location = this.convertUri2PathLocation(location)
		return this.services.getReferences(location).map(loc => this.convertUri2PathLocation(loc, false))
	}

	onCompletion(params : TextDocumentPositionParams): CompletionList | null { //return a list of labels
		let location : Location = Utils.position2Location(params.position, params.textDocument.uri)
		location = this.convertUri2PathLocation(location)
		return this.services.getCompletion(location)
	}

	onCompletionResolve(params : CompletionItem): CompletionItem | null { //we are not supporting  this right now
		//TODO:
		return null
	}

	onFoldingRanges(params : FoldingRangeParams): Location[] {
		return this.services.getFoldingRanges(Utils.Uri2FilePath(params.textDocument.uri)).map(loc => this.convertUri2PathLocation(loc, false))
	}

	private convertUri2PathLocation(toConvert : Location, uri2path : boolean = true) : Location { 
		let str : string = toConvert.uri
		let strs : string[] = (uri2path) ?
			[this.uriPathMap.get(toConvert.uri)] :
			Utils.getMapKeysByValue(this.uriPathMap, toConvert.uri)
		if(strs.length > 0){
			str = strs[0]
		}
		return {
			uri: str,
			range: toConvert.range
		}
	}

	private convertUri2PathLocationLink(toConvert : LocationLink, uri2path : boolean = true) : LocationLink { 
		let str : string = toConvert.targetUri
		let strs : string[] = (uri2path) ?
			[this.uriPathMap.get(toConvert.targetUri)] :
			Utils.getMapKeysByValue(this.uriPathMap, toConvert.targetUri)
		if(strs.length > 0){
			str = strs[0]
		}
		return {
			targetUri: str,
			targetRange: toConvert.targetRange,
			targetSelectionRange: toConvert.targetSelectionRange,
			//originSelectionRange: toConvert.originSelectionRange //we leave this as undefined
		}
	}
	
	private convertUri2PathPMTextDocument(toConvert : PMTextDocument, uri2path : boolean = true) : PMTextDocument { 
		let str : string = toConvert.uri
		let strs : string[] = (uri2path) ?
			[this.uriPathMap.get(toConvert.uri)] :
			Utils.getMapKeysByValue(this.uriPathMap, toConvert.uri)
		if(strs.length > 0){
			str = strs[0]
		}
		let newDoc : PMTextDocument = createNewTextDocument(str, toConvert.languageId, toConvert.version, toConvert.getText())
		newDoc.lastChanges = toConvert.lastChanges
		// let newDoc : PMTextDocument = {
		// 	uri: str,
		// 	path : toConvert.path,
		// 	languageId: toConvert.languageId,
		// 	version : toConvert.version,
		// 	getText : toConvert.getText,
		// 	positionAt : toConvert.positionAt,
		// 	offsetAt : toConvert.offsetAt,
		// 	isEqual : toConvert.isEqual,
		// 	lineCount : toConvert.lineCount,
		// 	update : toConvert.update,
		// 	lastChanges : toConvert.lastChanges	
		// }
		return newDoc
	}
}


export class LanguageServices {
	//Workspace
	fileManagers : Map<FilePath, FileManager>

	//config
	parsers : Map<PolicyModelsLanguage, Parser>


	static async init(docs : PMTextDocument[], pluginDir: string) : Promise<LanguageServices> {
		let instance : LanguageServices = new LanguageServices();
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
		for(let info of parsersInfo) {
			const wasm = path.join(parserPath,info.wasm);
			await Parser.init()
			const parser = new Parser()
			const lang = await Parser.Language.load(wasm)
			parser.setLanguage(lang)
			this.parsers.set(info.language,parser)
		}
	}

	getParserByExtension(extension : string) : Parser {
		const language = getLanguageByExtension(extension)
		return this.parsers.get(language)
	}

	populateMaps(docs : PMTextDocument[]) {
		for (let doc of docs) {
			//const uri : DocumentUri = doc.path
			//const filepath : FilePath = Utils.Uri2FilePath(doc.uri)
			const filepath : FilePath = doc.uri
			const extension = Utils.getFileExtension(filepath)
			let fileManager : FileManager = this.getFileManager(doc, extension)
			this.fileManagers.set(filepath, fileManager)
		}
	}

	getFileManager(doc : PMTextDocument, extension : string) : FileManager {
		return FileManagerFactory.create(doc, 
			this.getParserByExtension(extension), 
			getLanguageByExtension(extension))
	}

	getFileManagerByLocation(location : Location) : FileManager {
		return this.fileManagers.get(location.uri)
	}

	getDeclarations(location : Location) : Location[] {
		let fm : FileManager = this.getFileManagerByLocation(location)
		let entity : PolicyModelEntity = fm.createPolicyModelEntity(location)
		if(isNullOrUndefined(entity)) return []
		
		let result : Location[] = []
		this.fileManagers.forEach((fm: FileManager, path: FilePath) => {
			result = result.concat(fm.getAllDefinitions(entity))
		});
		return result
	}

	getReferences(location : Location) : Location[] {
		let result : Location[] = []
		let declarations : Location[] = []
		let references : Location[] = []

		let fm : FileManager = this.getFileManagerByLocation(location)
		let entity : PolicyModelEntity = fm.createPolicyModelEntity(location)
		//declarations = fm.getAllDefinitions(entity)
		this.fileManagers.forEach((fm: FileManager, path: FilePath) => {
			declarations = declarations.concat(fm.getAllDefinitions(entity))
		});

		
		this.fileManagers.forEach((fm: FileManager, path: FilePath) => {
			references = references.concat(fm.getAllReferences(entity))
		});
	
		result = result.concat(declarations) //we include declarations in this query
		result = result.concat(references)
		result = Utils.uniqueArray(result)
		return result
	}

	getRangeOfDoc(path: FilePath) : Range | null {
		let fm : FileManager = this.fileManagers.get(path)
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
	
	getFoldingRanges(path: FilePath) : Location[] | null {
		let result : Location[] = []
		let fm : FileManager = this.fileManagers.get(path)
		if(isNullOrUndefined(fm)) {return null}
		return fm.getFoldingRanges()
	}

	getCompletion(location : Location) : CompletionList | null {
		//TODO:
		throw new Error("Method not implemented.");
	}
}


//****File Managers****/
export abstract class FileManager {
	tree : Parser.Tree
	path : FilePath

	constructor(tree : Parser.Tree, path : FilePath){
		this.tree = tree
		this.path = path
	}

	updateTree(newTree : Parser.Tree) {
		this.tree = newTree
	}

	getCache() : PolicyModelEntity[] {
		//to be overridden in sub classes that contain a cache
		return []
	}

	isLocationInDoc(location : Location) : boolean {
		if (!(location.uri === this.path)) return false
		return true
	}

	getNodeFromLocation(location : Location) : Parser.SyntaxNode | null {
		if(!this.isLocationInDoc(location)) return null
		const position : Position = location.range.start
	 	return this.tree.walk().currentNode().namedDescendantForPosition(Utils.position2Point(position))
	}

	rangeArray2LocationArray(ranges : Range[]) : Location[] {
		return ranges.map(range => Utils.newLocation(this.path, range))
	}

	getAllDefinitions(entity : PolicyModelEntity) : Location[] {
		if(isNullOrUndefined(entity)) {return []}
		switch(entity.getType()){
			case PolicyModelEntityType.DGNode: 
				return this.getAllDefinitionsDGNode(entity.getName(), entity.getSource())
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
				return this.getAllReferencesDGNode(entity.getName(), this.path, entity.source)
			case PolicyModelEntityType.Slot: 
				return this.getAllReferencesSlot(entity.getName(), entity.source)
			case PolicyModelEntityType.SlotValue: 
				return this.getAllReferencesSlotValue(entity.getName(), entity.source)
			default:
				return undefined
		}
	}

	abstract createPolicyModelEntity(location : Location) : PolicyModelEntity

	abstract getAllDefinitionsDGNode(name : string, source : FilePath) : Location[]
	abstract getAllDefinitionsSlot(name : string) : Location[]
	abstract getAllDefinitionsSlotValue(name : string) : Location[]

	abstract getAllReferencesDGNode(name : string, currentFile: FilePath, sourceOfEntity : FilePath) : Location[]
	abstract getAllReferencesSlot(name : string, sourceOfEntity : FilePath) : Location[]
	abstract getAllReferencesSlotValue(name : string, sourceOfEntity : FilePath) : Location[]

	abstract getFoldingRanges() : Location[]

	abstract getAutoComplete(location : Location, allCaches : PolicyModelEntity[]) : CompletionList
}

export class FileManagerFactory {
	static create(doc : PMTextDocument, parser : Parser, language : PolicyModelsLanguage, cacheVersion : boolean = false) : FileManager | null {
		//const uri = doc.uri
		//const uri : DocumentUri = doc.path
		//const filepath : FilePath = Utils.Uri2FilePath(doc.uri)
		const filepath : FilePath = doc.uri
		const extension = Utils.getFileExtension(filepath)
		let tree : Parser.Tree = parser.parse(doc.getText()) 
		switch(language) {
			case PolicyModelsLanguage.DecisionGraph:
				return (cacheVersion) ? new DecisionGraphFileManagerWithCache(tree, filepath) : new DecisionGraphFileManager(tree, filepath)

			case PolicyModelsLanguage.PolicySpace:
				return (cacheVersion) ? new PolicySpaceFileManagerWithCache(tree, filepath) : new PolicySpaceFileManager(tree, filepath)	
						
			case PolicyModelsLanguage.ValueInference:
				return (cacheVersion) ? new ValueInferenceFileManagerWithCache(tree, filepath) : new ValueInferenceFileManager(tree, filepath)
				
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
	getAllDefinitionsDGNode(name: string, source : FilePath): Location[] {
		if(source === this.path) {
			let ranges : Range[] = DecisionGraphServices.getAllDefinitionsOfNodeInDocument(name, this.tree)
			return this.rangeArray2LocationArray(ranges)
		}
		return []
	}
	getAllDefinitionsSlot(name: string): Location[] {
		return []
	}
	getAllDefinitionsSlotValue(name: string): Location[] {
		return []
	}
	getAllReferencesDGNode(name: string, currentFile : FilePath, sourceOfEntity : FilePath): Location[] {
		let ranges : Range[] = DecisionGraphServices.getAllReferencesOfNodeInDocument(name, this.tree, currentFile, sourceOfEntity)
		return this.rangeArray2LocationArray(ranges)
	}
	getAllReferencesSlot(name: string, sourceOfEntity : FilePath): Location[] {
		let ranges : Range[] = DecisionGraphServices.getAllReferencesOfSlotInDocument(name, this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getAllReferencesSlotValue(name: string, sourceOfEntity : FilePath): Location[] {
		let ranges : Range[] = DecisionGraphServices.getAllReferencesOfSlotValueInDocument(name, this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getFoldingRanges(): Location[] {
		let ranges : Range[] = DecisionGraphServices.getAllNodesInDocument(this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getAutoComplete(location: Location, allCaches : PolicyModelEntity[]) : CompletionList {
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
	getAllDefinitionsDGNode(name: string, sourceOfEntity : FilePath): Location[] {
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
	getAllReferencesDGNode(name: string, currentFile : FilePath, sourceOfEntity : FilePath): Location[] {
		return []
	}
	getAllReferencesSlot(name: string, sourceOfEntity : FilePath): Location[] {
		let ranges : Range[] = PolicySpaceServices.getAllReferencesOfSlotInDocument(name, this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getAllReferencesSlotValue(name: string, sourceOfEntity : FilePath): Location[] {
		let ranges : Range[] = PolicySpaceServices.getAllDefinitionsOfSlotValueInDocument(name, this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getFoldingRanges(): Location[] {
		let ranges : Range[] = PolicySpaceServices.getAllSlotsInDocument(this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getAutoComplete(location: Location, allCaches : PolicyModelEntity[]) : CompletionList {
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
	getAllDefinitionsDGNode(name: string, sourceOfEntity : FilePath): Location[] {
		return []
	}
	getAllDefinitionsSlot(name: string): Location[] {
		return []
	}
	getAllDefinitionsSlotValue(name: string): Location[] {
		return []
	}
	getAllReferencesDGNode(name: string, currentFile : FilePath, sourceOfEntity : FilePath): Location[] {
		return []
	}
	getAllReferencesSlot(name: string, sourceOfEntity : FilePath): Location[] {
		let ranges : Range[] = ValueInferenceServices.getAllReferencesOfSlotInDocument(name, this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getAllReferencesSlotValue(name: string, sourceOfEntity : FilePath): Location[] {
		let ranges : Range[] = ValueInferenceServices.getAllReferencesOfSlotValueInDocument(name, this.tree)
		return this.rangeArray2LocationArray(ranges)
	}
	getFoldingRanges(): Location[] {
		let ranges : Range[] = []
		ranges = ranges.concat(ValueInferenceServices.getAllValueInferencesInDocument(this.tree))
		ranges = ranges.concat(ValueInferenceServices.getAllInferencePairsInDocument(this.tree))
		return this.rangeArray2LocationArray(ranges)
	}
	getAutoComplete(location: Location, allCaches : PolicyModelEntity[]) : CompletionList {
		throw new Error("Method not implemented.");
	}
}



//****Cache variant****/

export class LanguageServicesWithCache extends LanguageServices {
	static async init(docs : PMTextDocument[], pluginDir: string /*uris : DocumentUri[]*/) : Promise<LanguageServicesWithCache> {
		let instance : LanguageServicesWithCache = new LanguageServicesWithCache();
		let parsersPath: string = path.join(pluginDir,"parsers");
		await instance.initParsers(parsersPath)
		instance.fileManagers = new Map()
		instance.populateMaps(docs)
		return instance
	}

	getFileManager(doc : PMTextDocument, extension : string) : FileManager {
		return FileManagerFactory.create(doc, 
			this.getParserByExtension(extension), 
			getLanguageByExtension(extension), true)
	}

	getCompletion(location : Location) : CompletionList | null {
		let path : FilePath = location.uri
		let fm : FileManager = this.fileManagers.get(path)
		if(isNullOrUndefined(fm)) {return null}

		let pspaceCompletionList : CompletionList = {isIncomplete: false, items: []}
		this.fileManagers.forEach((fm : FileManager, path : FilePath) => {
			if(fm instanceof PolicySpaceFileManager) {
				pspaceCompletionList = Utils.mergeCompletionLists(pspaceCompletionList, fm.getAutoComplete(null, null))
			}
		})

		let result : CompletionList = pspaceCompletionList
		switch(true){
			case fm instanceof DecisionGraphFileManager: 
				let caches : PolicyModelEntity[] = 
				Utils.uniqueArray(Utils.flatten(
					Array.from(this.fileManagers.values())
						.map((fm: FileManager) => fm.getCache())))
				result = Utils.mergeCompletionLists(result,fm.getAutoComplete(location, caches))
				result.items = result.items.concat(DecisionGraphKeywords)
				break;	
	
			case fm instanceof PolicySpaceFileManager: 
				result.items = result.items.concat(PolicySpaceKeywords)
				break;

			case fm instanceof ValueInferenceFileManager: 
				result.items = result.items.concat(ValueInferenceKeywords)
				break;

			default:
				result = {isIncomplete: false, items: []}
				break;
		}

		return result
	}
}

export class DecisionGraphFileManagerWithCache extends DecisionGraphFileManager {
	cache : PolicyModelEntity[]
	importMap : ImportMap


	constructor(tree : Parser.Tree, path : FilePath){
		super(tree, path)
		let cacheAndImportMap : {entities: PolicyModelEntity[], importMap: ImportMap}
			= DecisionGraphServices.getAllEntitiesInDoc(tree, path)
		this.cache = cacheAndImportMap.entities
		this.importMap = cacheAndImportMap.importMap
	}

	updateTree(newTree : Parser.Tree) {
		this.tree = newTree
		let cacheAndImportMap : {entities: PolicyModelEntity[], importMap: ImportMap}
		= DecisionGraphServices.getAllEntitiesInDoc(newTree, this.path)
		this.cache = cacheAndImportMap.entities
		this.importMap = cacheAndImportMap.importMap
	}

	getCache() : PolicyModelEntity[] {
		return this.cache
	}

	getAllDefinitionsDGNode(name: string, sourceOfEntity : FilePath): Location[] {
		if(sourceOfEntity === this.path){
			return CacheQueries.getAllDefinitionsDGNode(this.cache, name)
		}
		return []
	}

	getAllReferencesDGNode(name: string, currentFile: FilePath, sourceOfEntity : FilePath): Location[] {
		return CacheQueries.getAllReferencesDGNode(this.cache, name, sourceOfEntity)
	}
	
	getAllReferencesSlot(name: string, sourceOfEntity : FilePath): Location[] {
		return CacheQueries.getAllReferencesSlot(this.cache, name, sourceOfEntity)
	}

	getAllReferencesSlotValue(name: string, sourceOfEntity : FilePath): Location[] {
		return CacheQueries.getAllReferencesSlotValue(this.cache, name, sourceOfEntity)
	}

	getFoldingRanges(): Location[] {
		return CacheQueries.getFoldingRanges(this.cache)
	}

	getAutoComplete(location: Location, allCaches : PolicyModelEntity[]) : CompletionList {
		//let importUris : DocumentUri[] = Array.from(this.importMap.values())
		return CacheQueries.getAutoCompleteDecisionGraph(allCaches, this.path, this.importMap)
	}
}

export class PolicySpaceFileManagerWithCache extends PolicySpaceFileManager {
	cache : PolicyModelEntity[]

	constructor(tree : Parser.Tree, currentFile: FilePath){
		super(tree, currentFile)
		this.cache = PolicySpaceServices.getAllEntitiesInDoc(tree, currentFile)
	}

	updateTree(newTree : Parser.Tree) {
		this.tree = newTree
		this.cache = PolicySpaceServices.getAllEntitiesInDoc(newTree, this.path)
	}

	getCache() : PolicyModelEntity[] {
		return this.cache
	}

	getAllDefinitionsSlot(name: string): Location[] {
		return CacheQueries.getAllDefinitionsSlot(this.cache, name)
	}

	getAllDefinitionsSlotValue(name: string): Location[] {
		return CacheQueries.getAllDefinitionsSlotValue(this.cache, name)
	}

	getAllReferencesSlot(name: string, sourceOfEntity : FilePath): Location[] {
		return CacheQueries.getAllReferencesSlot(this.cache, name, sourceOfEntity)
	}

	getAllReferencesSlotValue(name: string, sourceOfEntity : FilePath): Location[] {
		return CacheQueries.getAllReferencesSlotValue(this.cache, name, sourceOfEntity)
	}

	getFoldingRanges(): Location[] {
		return CacheQueries.getFoldingRanges(this.cache)
	}

	getAutoComplete(location: Location, allCaches : PolicyModelEntity[]) : CompletionList {
		return CacheQueries.getAutoCompletePolicySpace(this.cache)
	}
}

export class ValueInferenceFileManagerWithCache extends ValueInferenceFileManager {
	cache : PolicyModelEntity[]

	constructor(tree : Parser.Tree, path : FilePath){
		super(tree, path)
		this.cache = ValueInferenceServices.getAllEntitiesInDoc(tree, path)
	}

	updateTree(newTree : Parser.Tree) {
		this.tree = newTree
		this.cache = ValueInferenceServices.getAllEntitiesInDoc(newTree, this.path)
	}

	getCache() : PolicyModelEntity[] {
		return this.cache
	}

	getAllReferencesSlot(name: string, source: string): Location[] {
		return CacheQueries.getAllReferencesSlot(this.cache, name, source)
	}

	getAllReferencesSlotValue(name: string, source: string): Location[] {
		return CacheQueries.getAllReferencesSlotValue(this.cache, name, source)
	}

	getFoldingRanges(): Location[] {
		return CacheQueries.getFoldingRanges(this.cache)
	}

	getAutoComplete(location: Location, allCaches : PolicyModelEntity[]) : CompletionList {
		//return CacheQueries.getAutoCompleteValueInference(this.cache)
		return CacheQueries.getAutoCompletePolicySpace(this.cache)
	}
}

export class CacheQueries {
	static getAllDefinitionsDGNode(cache : PolicyModelEntity[], name: string): Location[] {
		const type = PolicyModelEntityType.DGNode
		const category = PolicyModelEntityCategory.Declaration
		return cache
			.filter(e => e.getName() === name && e.getCategory() == category && e.getType() == type)
			.map(e => e.location)
	}

	static getAllReferencesDGNode(cache : PolicyModelEntity[], name: string, sourceOfEntity : FilePath): Location[] {
		const type = PolicyModelEntityType.DGNode
		const category1 = PolicyModelEntityCategory.Reference
		//const category2 = PolicyModelEntityCategory.Declaration
		return cache
			.filter(e => e.getName() === name && (e.getCategory() == category1 /*||  e.getCategory() == category2*/) && e.getType() == type && e.source == sourceOfEntity) 
			.map(e => e.location)
	}

	static getAllDefinitionsSlot(cache : PolicyModelEntity[],name: string): Location[] {
		const type = PolicyModelEntityType.Slot
		const category = PolicyModelEntityCategory.Declaration
		return cache
			.filter(e => e.getName() === name && (e.getCategory() == category) && e.getType() == type)
			.map(e => e.location)
	}

	static getAllReferencesSlot(cache : PolicyModelEntity[], name: string, sourceOfEntity : FilePath): Location[] {
		const type = PolicyModelEntityType.Slot
		const category = PolicyModelEntityCategory.Reference
		return cache
			.filter(e => e.getName() === name && e.getCategory() == category && e.getType() == type)
			.map(e => e.location)
	}

	static getAllDefinitionsSlotValue(cache : PolicyModelEntity[],name: string): Location[] {
		const type = PolicyModelEntityType.SlotValue
		const category = PolicyModelEntityCategory.Declaration
		return cache
			.filter(e => e.getName() === name && (e.getCategory() == category) && e.getType() == type)
			.map(e => e.location)
	}
	
	static getAllReferencesSlotValue(cache : PolicyModelEntity[], name: string, sourceOfEntity : FilePath): Location[] {
		const type = PolicyModelEntityType.SlotValue
		const category1 = PolicyModelEntityCategory.Declaration
		const category2 = PolicyModelEntityCategory.Reference
		return cache
			.filter(e => e.getName() === name && (e.getCategory() == category1 || e.getCategory() == category2) && e.getType() == type)
			.map(e => e.location)
	}

	static getFoldingRanges(cache : PolicyModelEntity[]): Location[] {
		const category = PolicyModelEntityCategory.FoldRange
		return cache
			.filter(e => e.getCategory() == category )
			.map(e => e.location)
	}

	static getAutoCompleteDecisionGraph(cache : PolicyModelEntity[], currentFile : FilePath, importMap : ImportMap) : CompletionList | null {
		let nodes : PolicyModelEntity[]
		let slots : PolicyModelEntity[]
		let slotvalues : PolicyModelEntity[]
		let keywords : CompletionItem[] = DecisionGraphKeywords

		nodes = cache
				.filter(function (e) {
					if(e.getType() != PolicyModelEntityType.DGNode) {return false}

					let isImported : boolean = e.source === currentFile || Array.from(importMap.values()).indexOf(e.getSource()) > -1

					return (e.getCategory() == PolicyModelEntityCategory.Declaration || 
							(e.getCategory() == PolicyModelEntityCategory.Reference && isImported))
				})

		let items : CompletionItem[] = Utils.uniqueArray(nodes.map(e => entity2CompletionItem(e, currentFile, importMap)))

		let result = {
			isIncomplete: false,
			items: items
		}
		return result		
	}

	static getAutoCompletePolicySpace(cache : PolicyModelEntity[]) : CompletionList {		
		let entities : PolicyModelEntity[] = cache.filter(e => 
			(e.getType() == PolicyModelEntityType.Slot || e.getType() == PolicyModelEntityType.SlotValue) 
			&& e.getCategory() != PolicyModelEntityCategory.FoldRange)
		let keywords : CompletionItem[] = PolicySpaceKeywords
		let items : CompletionItem[] = Utils.uniqueArray(entities.map(e => entity2CompletionItem(e)))

		let result = {
			isIncomplete: false,
			items: items
		}
		return result		
	}
}