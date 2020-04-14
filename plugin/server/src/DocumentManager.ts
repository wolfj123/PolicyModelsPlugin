import { DidChangeTextDocumentParams,
		 TextDocumentItem,
		 TextDocumentIdentifier,
		 DocumentUri,
	} from 'vscode-languageserver';
import {URI} from 'vscode-uri';
import * as fs from 'fs';


import { languagesIds } from './Utils';
import { PMTextDocument, createFromTextDocumentItem, createNewTextDocument } from './Documents';

interface documentManagerResult {
	type: documentManagerResultTypes,
	result?: any;
}

enum documentManagerResultTypes {
	noChange,
	newFile,
	removeFile,
	updateFile
}

export class TextDocumentManager {
	private _finishedReadingFolder: boolean;
	private _noOpenFolderMode: boolean;	// indicate only a file is open and not a directory
	private _allDocuments: PMTextDocument[];

	constructor(){
		this._allDocuments = [];
		this._finishedReadingFolder = false;
		this._noOpenFolderMode = false;
	}

	/**
	 * when the user opens a new files syncs severt document to client and updates AST if needed
	 * @param params 
	 */
	public openedDocumentInClient(opendDocParam: TextDocumentItem): Promise<documentManagerResult []>  {
		if (! this._finishedReadingFolder){
			return new Promise(resolve =>
				setTimeout(() => resolve(this.openedDocumentInClient(opendDocParam)) , 0)
			);

			// setTimeout(() => {
			// 	this.openedDocumentInClient(opendDocParam);
			// }, 0);
			// return;
		}

		let openedTextDocument: PMTextDocument = this._allDocuments.find(currDoc => currDoc.uri === opendDocParam.uri);
		if (openedTextDocument === undefined ){
			//this can happen when:
			//1) I have an error in the code or understanding
			//2) we are in _noOpenFolderMode 
			//3) the user change a name of a file while it was open in the client

			let newDocument:PMTextDocument = this.createAndAddNewFile(undefined,opendDocParam);

			let ans: documentManagerResult []= [{
				type: documentManagerResultTypes.newFile,
				result: newDocument
			}];

			return Promise.resolve(ans);

		}else if (openedTextDocument.getText() !== opendDocParam.text){
			this.deletedDocument(opendDocParam.uri);
			let newDocument: PMTextDocument =  this.createAndAddNewFile(undefined,opendDocParam);
			let removeAns: documentManagerResult = {
				type: documentManagerResultTypes.removeFile,
				result: opendDocParam.uri
			};
			let addAns: documentManagerResult = {
				type: documentManagerResultTypes.newFile,
				result: newDocument
			};
			return Promise.resolve([removeAns,addAns]);
		}else{
			openedTextDocument.version = opendDocParam.version;
			return Promise.resolve([{type:documentManagerResultTypes.noChange}]);
		}
	}

	public closedDocumentInClient(closedDcoumentParams: TextDocumentIdentifier): Promise<documentManagerResult> {
		if (! this._finishedReadingFolder){

			return new Promise(resolve =>
				setTimeout(() => resolve(this.closedDocumentInClient(closedDcoumentParams)) , 0)
			);
			// setTimeout(() => {
			// 	this.closedDocumentInClient(closedDcoumentParams);
			// }, 0);
			// return;
		}

		let closedDocmentIdx: number = this._allDocuments.findIndex(currDoc => currDoc.uri === closedDcoumentParams.uri);
		if (closedDocmentIdx === -1 ){
			//log error
			return Promise.resolve({type:documentManagerResultTypes.noChange});
		}

		if (this._noOpenFolderMode){
			this._allDocuments.splice(closedDocmentIdx,1);
			let ans: documentManagerResult = {
				type: documentManagerResultTypes.removeFile,
				result: closedDcoumentParams.uri
			}
			return Promise.resolve(ans);
		}else{
			this._allDocuments[closedDocmentIdx].version = -1;
			return Promise.resolve({type:documentManagerResultTypes.noChange});
		}
	}


	public changeTextDocument(params: DidChangeTextDocumentParams): Promise<documentManagerResult []>{
		if (! this._finishedReadingFolder){
			return new Promise(resolve =>
					setTimeout(() => resolve(this.changeTextDocument(params)), 0)
				);
			// setTimeout(() => {
			// 	this.changeTextDocument(params);
			// }, 0);
			// return;
		}
		//TODO maybe not array
	}

	/**
	 * removes deleted files from _allDocuments
	 * @param params 
	 */
	public deletedDocument(deletedFile:DocumentUri): Promise<documentManagerResult> {
		if (! this._finishedReadingFolder){
			return new Promise(resolve=>
					setTimeout(() => resolve(this.deletedDocument(deletedFile)), 0)
				);
			// setTimeout(() => {
			// 	this.deletedDocument(deletedFile);
			// }, 0);
			// return;
		}

		let deletedIdx: number = this._allDocuments.findIndex(currDoc => currDoc .uri === deletedFile);
		if (deletedIdx === -1){
			// log error
			return Promise.resolve({type: documentManagerResultTypes.noChange});
		}

		this._allDocuments.splice(deletedIdx,1);
		let ans: documentManagerResult = {
			type: documentManagerResultTypes.removeFile,
			result: deletedFile
		}

		return Promise.resolve(ans);
	}

	public clientCreatedNewFile(newFileUri:DocumentUri): Promise<documentManagerResult>{
		if (! this._finishedReadingFolder){
			return new Promise(resolve =>
					setTimeout(()=> resolve(this.clientCreatedNewFile(newFileUri)) , 0)
				);
			// setTimeout(() => {
			// 	this.clientCreatedNewFile(newFileUri);
			// }, 0);
			// return;
		}

		// if the user changes the name of a file when it is opened in the client than openedDocumentInClient
		// happens before this function and there we already handle it and enter the file to _allDocuments
		if (this._allDocuments.findIndex(currDoc => currDoc.uri === newFileUri) !== -1){
			return Promise.resolve({type: documentManagerResultTypes.noChange});
		}
		let newDocumet = this.createAndAddNewFile(newFileUri);
		let ans: documentManagerResult = {
			type: documentManagerResultTypes.newFile,
			result: newDocumet
		}

		return Promise.resolve(ans);
	}

	private createAndAddNewFile(newFileUri:string = undefined  ,textDocument?: TextDocumentItem ) {
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

	public openedFolder(pathUri){
		let path = URI.parse(pathUri).fsPath;
		let filesToParse: {name: string, languageId: languagesIds} []= [];
		console.log(path);
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
			let currFilePath = path + "\\" + currDirEntry;
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





