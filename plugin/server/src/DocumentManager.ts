import { DidChangeTextDocumentParams,
		 TextDocumentItem,
		 TextDocumentIdentifier,
		 DocumentUri,
		 Range
	} from 'vscode-languageserver';
import {URI} from 'vscode-uri';
import * as fs from 'fs';


import { languagesIds } from './Utils';
import { PMTextDocument, createFromTextDocumentItem, createNewTextDocument, changeInfo } from './Documents';

export interface DocumentManagerResult {
	type: documentManagerResultTypes,
	result?: any;
}

export enum documentManagerResultTypes {
	noChange,
	newFile,
	removeFile,
	updateFile
}

export interface TextDocumentManagerInt{
	/**
	 * indicates if the clinet has a folder or only open files
	 */
	folderMode: boolean;

	/**
	 * sets a file to open, updates data structure to contanin file with text and version received in parameters,
	 * if it is needed it create a file in the Manager it, in case of difference between the file we already have and the parameters
	 * received the existing file in Manager will be updated to the params information
	 * use for onDidOpenTextDocument
	 * @param opendDocParam 
	 * @returns array of Promises that will resolve when we finished reading the folder, the promises can't reject
	 * possible types:
	 * 	* noChange - only version was updated, no result
	 *  * newFile - new file was added to manager, result is tnew newly create PMTextDocument
	 *  * removeFile - in case of difference between file and data in manager, result is removed URI
	 */
	openedDocumentInClient(opendDocParam: TextDocumentItem): Promise<DocumentManagerResult []>;

	/**
	 * sets a file to close this can be done only for files already opened in client(using openedDocumentInClient),
	 * use for onDidCloseTextDocument
	 * @param closedDcoumentParams 
	 * @returns Promise that will resolve when we finished reading the folder, the promises can't reject
	 * possible types:
	 *  * noChange - closed, only changed Version, no result
	 *  * removeFile - in case of no folder mode the file is removed from manager, result is remove URI
	 */
	closedDocumentInClient(closedDcoumentParams: TextDocumentIdentifier): Promise<DocumentManagerResult>;

	/**
	 * updates the text of a file already opened in client(using openedDocumentInClient)
	 * use for onDidChangeTextDocument
	 * this function updates the relevant files with the new text
	 * it only supports incremental change !!!!
	 * @param params 
	 * @returns Promise that will resolve when we finished reading the folder, the promises can't reject, will be resolved after folder scanning is finished
	 * possible types:
	 *  * noChange - in case of error, files wasn't found , no result
	 *  * updateFile - file was successfully updataetd, result is array of changeInfo
	 */ 
	changeTextDocument(params: DidChangeTextDocumentParams): Promise<DocumentManagerResult>;

	/**
	 * delets a file from the documnet manager
	 * use for onDidChangeWatchedFiles
	 * @param deletedFile 
	 * @returns Promise that will resolve when we finished reading the folder, the promises can't reject
	 * possible types:
	 *  * noChange - error, file wasn't found
	 *  * removeFile - removed the file, result is remove URI
	 */
	deletedDocument(deletedFile:DocumentUri): Promise<DocumentManagerResult>;

	/**
	 * this creates a new empty file in the manager, if the file already exists nothing will happen 
	 * use for onDidChangeWatchedFiles
	 * @param newFileUri 
	 * @returns Promise that will resolve when we finished reading the folder, the promises can't reject
	 * possible types:
	 *  * noChange - file already existed in manager, no result
	 *  * newFile - created and added new file to manager, result is the PMTextDocument created
	 */
	clientCreatedNewFile(newFileUri:DocumentUri): Promise<DocumentManagerResult>;

	/**
	 * this reads all the files in folder and sub folders, and create PMTextDocument object for all relevant 
	 * Policy Model files, this function is synchronic and must be called
	 * if this function isn't called the rest of the functions will not work, because they all wait for this function to finish its work
	 * @param pathUri null for no folder, string of the folder URI
	 */
	openedFolder(pathUri: string | null): void;

	/**
	 * returns a copy of PMTextDocument of the document with the requeste URI
	 * @param uri 
	 */
	getDocument(uri: string): PMTextDocument;

	/**
	 * @returns array of all documents managed by this class
	 */
	allDocumnets;
}

export class TextDocumentManager implements TextDocumentManagerInt {

	private _finishedReadingFolder: boolean;
	private _noOpenFolderMode: boolean;	// indicates if a folder was opened or just some files
	private _allDocuments: PMTextDocument[];

	constructor(){
		this._allDocuments = [];
		this._finishedReadingFolder = false;
		this._noOpenFolderMode = false;
	}

	public get folderMode(): boolean{
		return ! this._noOpenFolderMode
	}

	public getDocument(uri: string): PMTextDocument {
		return this._allDocuments.find(curr => curr.uri===uri);
	}

	public get allDocumnets(): PMTextDocument[] {
		return this._allDocuments.map(x=>x);
	}

	/**
	 * when the user opens a new files syncs severt document to client and updates AST if needed
	 * @param params 
	 */
	public openedDocumentInClient(opendDocParam: TextDocumentItem): Promise<DocumentManagerResult []>  {
		if (! this._finishedReadingFolder){
			return new Promise(resolve =>
				setTimeout(() => resolve(this.openedDocumentInClient(opendDocParam)) , 0)
			);
		}

		let openedTextDocument: PMTextDocument = this._allDocuments.find(currDoc => currDoc.uri === opendDocParam.uri);

		if (openedTextDocument === undefined ){
			//this can happen when:
			//1) I have an error in the code or understanding
			//2) we are in _noOpenFolderMode 
			//3) the user change a name of a file while it was open in the client

			let newDocument:PMTextDocument = this.createAndAddNewFile(undefined,opendDocParam);

			let ans: DocumentManagerResult []= [{
				type: documentManagerResultTypes.newFile,
				result: newDocument
			}];

			return Promise.resolve(ans);

		}else if (openedTextDocument.getText() !== opendDocParam.text){
			//in case the text of the file is different from text in our manager
			this.deletedDocument(opendDocParam.uri);
			let newDocument: PMTextDocument =  this.createAndAddNewFile(undefined,opendDocParam);
			let removeAns: DocumentManagerResult = {
				type: documentManagerResultTypes.removeFile,
				result: opendDocParam.uri
			};
			let addAns: DocumentManagerResult = {
				type: documentManagerResultTypes.newFile,
				result: newDocument
			};
			return Promise.resolve([removeAns,addAns]);
		}else {
			openedTextDocument.version = opendDocParam.version;
			return Promise.resolve([{type:documentManagerResultTypes.noChange}]);
		}
	}

	public closedDocumentInClient(closedDcoumentParams: TextDocumentIdentifier): Promise<DocumentManagerResult> {
		if (! this._finishedReadingFolder){

			return new Promise(resolve =>
				setTimeout(() => resolve(this.closedDocumentInClient(closedDcoumentParams)) , 0)
			);
		}

		let closedDocmentIdx: number = this._allDocuments.findIndex(currDoc => currDoc.uri === closedDcoumentParams.uri);
		if (closedDocmentIdx === -1 ){
			//log error
			return Promise.resolve({type:documentManagerResultTypes.noChange});
		}

		if (this._noOpenFolderMode){
			this._allDocuments.splice(closedDocmentIdx,1);
			let ans: DocumentManagerResult = {
				type: documentManagerResultTypes.removeFile,
				result: closedDcoumentParams.uri
			}
			return Promise.resolve(ans);
		}else{
			this._allDocuments[closedDocmentIdx].version = -1;
			return Promise.resolve({type:documentManagerResultTypes.noChange});
		}
	}


	public changeTextDocument(params: DidChangeTextDocumentParams): Promise<DocumentManagerResult>{
		if (! this._finishedReadingFolder){
			return new Promise(resolve =>
					setTimeout(() => resolve(this.changeTextDocument(params)), 0)
				);
		}
		let documentToUpdate: PMTextDocument = this._allDocuments.find(curr=> curr.uri === params.textDocument.uri);
		if (documentToUpdate === undefined){
			//Log error
			return Promise.resolve({type: documentManagerResultTypes.noChange});
		}

		let changesRanges: changeInfo []= documentToUpdate.update(params.contentChanges,params.textDocument.version);
		let ans:DocumentManagerResult = {
			type: documentManagerResultTypes.updateFile,
			result: changesRanges
		}
		return Promise.resolve(ans);
	}

	public deletedDocument(deletedFile:DocumentUri): Promise<DocumentManagerResult> {
		if (! this._finishedReadingFolder){
			return new Promise(resolve=>
					setTimeout(() => resolve(this.deletedDocument(deletedFile)), 0)
				);
		}

		let deletedIdx: number = this._allDocuments.findIndex(currDoc => currDoc .uri === deletedFile);
		if (deletedIdx === -1){
			// log error
			return Promise.resolve({type: documentManagerResultTypes.noChange});
		}

		this._allDocuments.splice(deletedIdx,1);
		let ans: DocumentManagerResult = {
			type: documentManagerResultTypes.removeFile,
			result: deletedFile
		}

		return Promise.resolve(ans);
	}

	public clientCreatedNewFile(newFileUri:DocumentUri): Promise<DocumentManagerResult>{
		if (! this._finishedReadingFolder){
			return new Promise(resolve =>
					setTimeout(()=> resolve(this.clientCreatedNewFile(newFileUri)) , 0)
				);
		}

		// if the user changes the name of a file when it is opened in the client than openedDocumentInClient
		// happens before this function and there we already handling it
		if (this._allDocuments.find(currDoc => currDoc.uri === newFileUri) !== undefined){
			return Promise.resolve({type: documentManagerResultTypes.noChange});
		}
		let newDocumet = this.createAndAddNewFile(newFileUri);
		let ans: DocumentManagerResult = {
			type: documentManagerResultTypes.newFile,
			result: newDocumet
		}

		return Promise.resolve(ans);
	}

	private createAndAddNewFile(newFileUri:string = undefined  ,textDocument?: TextDocumentItem ): PMTextDocument {
		let newDoc:PMTextDocument = undefined;
		if (newFileUri !== undefined){
			newDoc = createNewTextDocument(newFileUri,this.getLangugeIdFromUri(newFileUri));
		}else if (textDocument !== undefined){
			newDoc = createFromTextDocumentItem(textDocument);
		}
		if (newDoc === undefined){
			return;
		}
		this._allDocuments.push(newDoc);
		return newDoc;
	}

	public openedFolder(pathUri: string | null) : void {
		if (pathUri === null){
			this._noOpenFolderMode = true;
			this._finishedReadingFolder = true;
			return;
		}
		let path = URI.parse(pathUri).fsPath;
		let filesToParse: {name: string, languageId: languagesIds} []= [];
		//console.log(path);
		this.filesCollector(path,filesToParse);
		filesToParse.forEach(currFile => {
			let fileContent: string = fs.readFileSync(currFile.name,"utf-8");
			if (fileContent === undefined || fileContent === null){
				fileContent = "";
			}
			this._allDocuments.push (createNewTextDocument(URI.file(currFile.name).toString(),currFile.languageId,-1,fileContent));
		})

		this._finishedReadingFolder = true;
	}

	private filesCollector(path,filesToParse){
		let filesInDirectory: string[] = fs.readdirSync(path,"utf-8");
		filesInDirectory.forEach(currDirEntry => {
			let currFilePath = path + "/" + currDirEntry;
			if (fs.statSync(currFilePath).isDirectory()){
				this.filesCollector(currFilePath,filesToParse);
			}else{
				//check extension
				let langId = this.getLangugeIdFromUri(currFilePath);
				if (langId !== null){
					filesToParse.push({name: currFilePath, languageId: langId});
				}
			}
		});
	}

	/**
	 * @param uri file URI
	 * @returns language ID of a file based on its suffix, null if not a language suffix
	 */
	private getLangugeIdFromUri(uri:string): languagesIds {
		
		let dotIdx: number = uri.lastIndexOf(".");
		
		if (dotIdx === -1){
			// error no file suffix
			return null;
		}

		let fileEnding: string = uri.substring(dotIdx + 1);
		let result: languagesIds = -1;
		switch(fileEnding) {
			case 'ps':
			case 'pspace':
				result = languagesIds.policyspace;
				break;
			case 'dg':
				result = languagesIds.decisiongraph;
				break;
			case 'vi':
				result = languagesIds.valueinference;
				break;
			default:
				//error bad suffix
				return null;
		}

		return result;
	}


}




