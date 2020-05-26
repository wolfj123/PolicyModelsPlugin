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


/**
 * This class exposes the Language Services in the form of LSP-esque queries,
 * by wrapping a {@link LanguageServices} instance and translating said queries.
 * It uses a Map to store the original file URIs before converting them to absolute paths.
 * We do this in order to answer queries with the same URIs given initially.
 */
export class LanguageServicesFacade {
	uriPathMap : Map<DocumentUri, FilePath>
	services : LanguageServices

	/**
	 * Creates asynchronously a new instance of {@link LanguageServicesFacade}.
	 * The creation must be asynchronous due to the asynchronous initilization of {@link Parser}
	 * 
	 * @param docs The documents that compose the Policy Model project.
	 * Assumes all files are supplied and their URIs can be converted to absolute values.
	 * @param pluginDir The directory of the plugin - used to find the parsers WASM files.
	 * @returns A promise of a new instance of {@link LanguageServicesFacade}.
	 */
	static async init(docs : PMTextDocument[], pluginDir: string) : Promise<LanguageServicesFacade> {
		let instance : LanguageServicesFacade = new LanguageServicesFacade
		instance.addToUriPathMap(docs)
		let convertedDocs : PMTextDocument[] = docs.map(doc => instance.convertUri2PathPMTextDocument(doc))
		let services : LanguageServices = await LanguageServicesWithCache.init(convertedDocs, pluginDir)
		instance.services = services
		return instance
	}

	/**
	 * Adds new entries to the uriPathMap of this class.
	 * If the uriPathMap wasn't initilaized, it will initialize it.
	 * 
	 * @param docs The documents that compose the Policy Model project.
	 * Assumes all files are supplied and their URIs can be converted to absolute values.
	*/
	private addToUriPathMap(docs : PMTextDocument[]) {
		if(isNullOrUndefined(this.uriPathMap)){
			this.uriPathMap = new Map()
		}
		docs.forEach(doc => {
			const uri : DocumentUri = doc.uri
			const path : FilePath = Utils.Uri2FilePath(uri)
			this.uriPathMap.set(uri, path)
		})
	}

	/**
	 * Add new documents to the Policy Model project
	 * 
	 * @param docs New documents to be added to the Policy Model Project
	 * Assumes all files are supplied and their URIs can be converted to absolute values.
	 */
	addDocs(docs : PMTextDocument[]) {
		this.addToUriPathMap(docs)
		this.services.addDocs(docs.map(doc => this.convertUri2PathPMTextDocument(doc)))
	}

	/**
	 * Updates a document that was changed.
	 * 
	 * @param doc The changed document from the Policy Model project.
	 * Assumes the document was already added.
	 * Assumes all files are supplied and their URIs can be converted to absolute values.
	 */
	updateDoc(doc : PMTextDocument){
		this.services.updateDoc(this.convertUri2PathPMTextDocument(doc))
	}

	/**
	 * Removes a document that was changed.
	 * 
	 * @param docs The document to remove from the Policy Model project.
	 * Assumes the document was already added.
	 * Assumes all files are supplied and their URIs can be converted to absolute values.
	 */
	removeDoc(doc : DocumentUri) {
		const path : FilePath = this.uriPathMap.get(doc)
		this.services.removeDoc(path)
		this.uriPathMap.delete(doc)
	}

	/**
	 * Answers a LSP **onDefinition** query
	 *
	 * @param params LSP **onDefinition** query params
	 * @returns A {@link LocationLink} array of all definitions
	 */
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

	/**
	 * Answers a LSP **onReferences** query
	 * 
	 * @param params LSP **onReferences** query params
	 * @returns A {@link Location} array of all references
	 */
	onReferences(params : ReferenceParams):  Location[] {
		let location : Location = Utils.position2Location(params.position, params.textDocument.uri)
		location = this.convertUri2PathLocation(location)
		return this.services.getReferences(location).map(loc => this.convertUri2PathLocation(loc, false))
	}

	/**
	 * Answers a LSP **onPrepareRename** query
	 * 
	 * @param params LSP **onPrepareRename** query params
	 * @returns A {@link Range} or null if cannot rename
	 */
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

	/**
	 * Answers a LSP **onRenameRequest** query
	 * 
	 * @param params LSP **onRenameRequest** query params
	 * @returns A {@link Location} array of all rename requests
	 */
	onRenameRequest(params : RenameParams) : Location[]	{
		let location : Location = Utils.position2Location(params.position, params.textDocument.uri)
		location = this.convertUri2PathLocation(location)
		return this.services.getReferences(location).map(loc => this.convertUri2PathLocation(loc, false))
	}

	/**
	 * Answers a LSP **onCompletion** query
	 * 
	 * @param params LSP **onRenameRequest** query params
	 * @returns A {@link CompletionList} or null if file not found
	 */
	onCompletion(params : TextDocumentPositionParams): CompletionList | null {
		let location : Location = Utils.position2Location(params.position, params.textDocument.uri)
		location = this.convertUri2PathLocation(location)
		return this.services.getCompletion(location)
	}
	
	/**
	 * Unsupported
	 */
	onCompletionResolve(params : CompletionItem): CompletionItem | null { 
		//TODO:
		return null
	}

	/**
	 * Answers a LSP **onFoldingRanges** query
	 * @deprecated WE NO LONGER SUPPORT THIS
	 * @param params LSP **onFoldingRanges** query params
	 * @returns A {@link Location} array of all references
	 */
	onFoldingRanges(params : FoldingRangeParams): Location[] {
		throw new Error("Method not implemented.");

		return this.services.getFoldingRanges(Utils.Uri2FilePath(params.textDocument.uri)).map(loc => this.convertUri2PathLocation(loc, false))
	}

	/**
	 * Handles the convertion of URI to Absolute Path and vice versa,
	 * in a {@link Location} instance.
	 * This method uses the uriPathMap member of this class to resolve the conversion.
	 * 
	 * @param toConvert The object whose member must be converted
	 * @param uri2path A boolean that controls whether the uri must be converted to a path, or the reverse
	 * @returns A {@link Location} containing the converted value
	 */
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

	/**
	 * Handles the convertion of URI to Absolute Path and vice versa,
	 * in a {@link LocationLink} instance.
	 * This method uses the uriPathMap member of this class to resolve the conversion.
	 * 
	 * @param toConvert The object whose member must be converted
	 * @param uri2path A boolean that controls whether the uri must be converted to a path, or the reverse
	 * @returns A {@link LocationLink} containing the converted value
	 */
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

	/**
	 * Handles the convertion of URI to Absolute Path and vice versa,
	 * in a {@link PMTextDocument} instance.
	 * This method uses the uriPathMap member of this class to resolve the conversion.
	 * 
	 * @param toConvert The object whose member must be converted
	 * @param uri2path A boolean that controls whether the uri must be converted to a path, or the reverse
	 * @returns A {@link PMTextDocument} containing the converted value
	 */
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
		return newDoc
	}
}

/**
 * This class provides language services for a Policy Model project.
 * It assumes that it was provided all the files of said project, 
 * either in it's initilization or later incrementally.
 * 
 * This class holds a map of {@link FileManager}, each answering queries regarding a single file.
 * Queries that can be answered by anaylizing a single file are solved in the {@link FileManager}. 
 * Queries that can be answered by anaylizing multiple files (such as auto-completion) are solved in this class.
 */
export class LanguageServices {
	/**
 	* A map of {@link FileManager} for each Policy Model file in the project
	*/
	fileManagers : Map<FilePath, FileManager>

	/**
 	* A map of {@link Parser} for each Language of Policy Models
	*/
	parsers : Map<PolicyModelsLanguage, Parser>

	/**
	 * Creates asynchronously a new instance of {@link LanguageServices}.
	 * The creation must be asynchronous due to the asynchronous initilization of {@link Parser}
	 * 
	 * @param docs The documents that compose the Policy Model project.
	 * Assumes all files are supplied and their URIs can be converted to absolute values.
	 * @param pluginDir The directory of the plugin - used to find the parsers WASM files.
	 * @returns A promise of a new instance of {@link LanguageServices}.
	 */
	static async init(docs : PMTextDocument[], pluginDir: string) : Promise<LanguageServices> {
		let instance : LanguageServices = new LanguageServices();
		let parsersPath: string = path.join(pluginDir,"parsers");
		await instance.initParsers(parsersPath)
		instance.fileManagers = new Map()
		instance.populateMaps(docs)
		return instance
	}

	/**
	 * Adds new entries to the uriPathMap of this class.
	 * If the uriPathMap wasn't initilaized, it will initialize it.
	 * 
	 * @param docs New documents to be added to the Policy Model Project	
	 * Assumes all documents contain an abolsute path
	*/
	addDocs(docs : PMTextDocument[]) {
		this.populateMaps(docs)
	}

	/**
	 * Add new documents to the Policy Model project
	 * 
	 * @param docs The documents that compose the Policy Model project.
	 * Assumes all documents contain an abolsute path
	 */
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

	/**
	 * Removes a document that was changed.
	 * 
	 * @param docs The document to remove from the Policy Model project.
	 * Assumes the document was already added.
	 * Assumes all documents contain an abolsute path
	 */
	removeDoc(doc : DocumentUri) {
		this.fileManagers.delete(doc)
	}

	/**
	 * Initializing the parsers
	 * 
	 * @param parserPath A path to the plugin's parser folder which contains the WASM parsers
	 */
	protected async initParsers(parserPath: string) {
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

	/**
	 * Gets a {@link Parser} by a file extension
	 * 
	 * @param extension The file extension
	 * @returns A {@link Parser} corresponding to the langauge represented by the file extension
	 */
	protected getParserByExtension(extension : string) : Parser {
		const language = getLanguageByExtension(extension)
		return this.parsers.get(language)
	}

	/**
	 * Adds the documents to the map
	 * 
	 * @param docs Documents to be added to the Policy Model Project	
	 */
	protected populateMaps(docs : PMTextDocument[]) {
		for (let doc of docs) {
			const filepath : FilePath = doc.uri
			const extension = Utils.getFileExtension(filepath)
			let fileManager : FileManager = this.getFileManager(doc, extension)
			this.fileManagers.set(filepath, fileManager)
		}
	}

	/**
	 * Creates a new {@link FileManager} instance for a document
	 * 
	 * @param doc The document
	 * @param extension The file extension of the document
	 * @returns A new {@link FileManager} represeting the document
	 */
	protected getFileManager(doc : PMTextDocument, extension : string) : FileManager {
		return FileManagerFactory.create(doc, 
			this.getParserByExtension(extension), 
			getLanguageByExtension(extension))
	}

	/**
	 * Find a {@link FileManager} for a {@link Location}
	 * 
	 * @param location The location in a document
	 * @returns A {@link FileManager} that holds the document of the location
	 */
	protected getFileManagerByLocation(location : Location) : FileManager {
		return this.fileManagers.get(location.uri)
	}

	/**
	 * Given a location, returns the declarations of the entity found in that location
	 * 
	 * @param location The location in a document
	 * @returns A {@link Location} array that holds all the declarations of the entity
	 */
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

	/**
	 * Given a location, returns the references of the entity found in that location
	 * 
	 * @param location The location in a document
	 * @returns A {@link Location} array that holds all the references of the entity
	 */
	getReferences(location : Location) : Location[] {
		let result : Location[] = []
		let declarations : Location[] = []
		let references : Location[] = []

		let fm : FileManager = this.getFileManagerByLocation(location)
		let entity : PolicyModelEntity = fm.createPolicyModelEntity(location)
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

	/**
	 * Given a file path of a document, returns the document's range
	 * 
	 * @param path The path of the document
	 * @returns A {@link Range} of the document, null if document not found
	 */
	getRangeOfDoc(path: FilePath) : Range | null {
		let fm : FileManager = this.fileManagers.get(path)
		if(isNullOrUndefined(fm)) {return null}
		let pos1 : Position = Utils.point2Position(fm.tree.rootNode.startPosition)
		let pos2 : Position = Utils.point2Position(fm.tree.rootNode.endPosition)
		let range : Range = Utils.newRange(pos1, pos2)
		return range
	}

	/**
	 * Given a location, returns the {@link PolicyModelEntity} found in that location
	 * 
	 * @param location The location in a document
	 * @returns The {@link PolicyModelEntity} found in that location, null if no valid entity found
	 */
	createPolicyModelEntity(location : Location) : PolicyModelEntity | null {
		let fm : FileManager = this.fileManagers.get(location.uri)
		if(isNullOrUndefined(fm)) {return null}
		let entity : PolicyModelEntity = fm.createPolicyModelEntity(location)
		return entity
	}

	/**
	 * Given a file path of a document, returns all folding ranges in that document
	 * @deprecated WE NO LONGER SUPPORT THIS
	 * @param path The path of the document
	 * @returns A {@link Location} array of all folding ranges
	 */
	getFoldingRanges(path: FilePath) : Location[] | null {
		let result : Location[] = []
		let fm : FileManager = this.fileManagers.get(path)
		if(isNullOrUndefined(fm)) {return null}
		return fm.getFoldingRanges()
	}

	/**
	 * Unsupported in this sub-class
	 */
	getCompletion(location : Location) : CompletionList | null {
		return null
	}
}


/**
 * This class represents a single file in a Policy Models project
 */
export abstract class FileManager {
	/**
 	* The parser tree of the file
	*/
	tree : Parser.Tree
	
	/**
 	* The **abolsute** path of the file
	*/
	path : FilePath

	constructor(tree : Parser.Tree, path : FilePath){
		this.tree = tree
		this.path = path
	}

	/**
	 * Updates the tree
	 * 
	 * @param newTree The new tree of the file to be stored
	 */
	updateTree(newTree : Parser.Tree) {
		this.tree = newTree
	}

	/**
	 * Returns the cache of entities collected from the file
	 * 
	 * @retuns An array of {@link PolicyModelEntity}
	 */
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

	/**
	 * @deprecated
	 */
	abstract getFoldingRanges() : Location[]

	abstract getAutoComplete(location : Location, allCaches : PolicyModelEntity[]) : CompletionList
}

/**
 * This class is a factory of {@link FileManager}
 */
export class FileManagerFactory {

	/**
	 * Creates an instance of a {@link FileManager}
	 * 
	 * @param doc The Policy Model document
	 * @param parser A {@link Parser} of the Policy Model language
	 * @param language the Policy Model language of the document
	 * @param cacheVersion A flag that decides which {@link FileManager} sub-class to instatiate
	 * @returns A new instance of a {@link FileManager}
	 */
	static create(doc : PMTextDocument, parser : Parser, language : PolicyModelsLanguage, cacheVersion : boolean = false) : FileManager | null {
		const filepath : FilePath = doc.uri
		const extension = Utils.getFileExtension(filepath)
		let tree : Parser.Tree = parser.parse(doc.getText()) 
		switch(language) {
			case PolicyModelsLanguage.DecisionGraph:
				return (cacheVersion) ? new DecisionGraphFileManagerWithCache(tree, filepath) : new DecisionGraphFileManagerNaive(tree, filepath)

			case PolicyModelsLanguage.PolicySpace:
				return (cacheVersion) ? new PolicySpaceFileManagerWithCache(tree, filepath) : new PolicySpaceFileManagerNaive(tree, filepath)	
						
			case PolicyModelsLanguage.ValueInference:
				return (cacheVersion) ? new ValueInferenceFileManagerWithCache(tree, filepath) : new ValueInferenceFileManagerNaive(tree, filepath)
				
			default:
				return null
		}
	}
}

export class DecisionGraphFileManagerNaive extends FileManager {
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

export class PolicySpaceFileManagerNaive extends FileManager {
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

export class ValueInferenceFileManagerNaive extends FileManager {
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
			if(fm instanceof PolicySpaceFileManagerNaive) {
				pspaceCompletionList = Utils.mergeCompletionLists(pspaceCompletionList, fm.getAutoComplete(null, null))
			}
		})

		let result : CompletionList = pspaceCompletionList
		switch(true){
			case fm instanceof DecisionGraphFileManagerNaive: 
				let caches : PolicyModelEntity[] = []
				Array.from(this.fileManagers.values()).map(fm => {
					caches = caches.concat(fm.getCache())
				})

				//let caches : PolicyModelEntity[] = 
				// Utils.uniqueArray(Utils.flatten(
				// 	Array.from(this.fileManagers.values())
				// 		.map((fm: FileManager) => fm.getCache())))
				result = Utils.mergeCompletionLists(result,fm.getAutoComplete(location, caches))
				result.items = result.items.concat(DecisionGraphKeywords)
				break;	
	
			case fm instanceof PolicySpaceFileManagerNaive: 
				result.items = result.items.concat(PolicySpaceKeywords)
				break;

			case fm instanceof ValueInferenceFileManagerNaive: 
				result.items = result.items.concat(ValueInferenceKeywords)
				break;

			default:
				result = {isIncomplete: false, items: []}
				break;
		}

		return result
	}
}

export class DecisionGraphFileManagerWithCache extends DecisionGraphFileManagerNaive {
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

	createPolicyModelEntity(location : Location): PolicyModelEntity | null {
		let node : Parser.SyntaxNode = this.getNodeFromLocation(location)
		if(isNullOrUndefined(node)) {return null}
		return DecisionGraphServices.createEntityFromNode(node, location.uri, this.importMap)
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

export class PolicySpaceFileManagerWithCache extends PolicySpaceFileManagerNaive {
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

export class ValueInferenceFileManagerWithCache extends ValueInferenceFileManagerNaive {
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

	/**
	 * @deprecated
	 */
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