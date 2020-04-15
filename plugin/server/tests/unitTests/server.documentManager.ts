import * as mocha from 'mocha';
import {TextDocumentManager, documentManagerResult, documentManagerResultTypes} from '../../src/DocumentManager'
import { expect, assert } from 'chai';
import { URI } from 'vscode-uri';
import { TextDocumentItem, VersionedTextDocumentIdentifier, TextDocumentContentChangeEvent, DidChangeTextDocumentParams, Range, Position } from 'vscode-languageserver';
import * as fs from 'fs';
import { PMTextDocument, createNewTextDocument } from '../../src/Documents';
import { languagesIds } from '../../src/Utils';

mocha.suite('document Manager test suite', ()=>{

	let testFolder: string;
	let testFolderSuffix: string = "\\tests\\sample directory";

	let allPMFiles: {folder:string, files:string []}[] = 
	[
		{
			folder:"InferrerExample",
			files: 
			[ "decision-graph.dg",
				"policy-space.pspace",
				"value-inferrence.vi"
			]
		},
		{
			folder:"dg-large-modular",
			files:
			[	
				"dppa.dg",
				"ferpa.dg",
				"medical.dg",
				"ppra.dg",
				"questionnaire.dg",
				"test.pspace"
			]
		},
		{
			folder:"a\\Recursive-Sections",
			files:
			[	
				"decision-graph.dg",
				"policy-space.pspace"
			],
		},
		{
			folder:"a\\a\\Find-Runs-playground",
			files:
			[	
				"decision-graph.dg",
				"policy-space.ps"
			]
		}
	]
	
	mocha.before(()=>{
		let cwd: string = process.cwd();
		testFolder = cwd+testFolderSuffix;
		console.log("testDir " + testFolder);
	});

	context('no folder mode tests', ()=>{
		let documentManager: TextDocumentManager = new TextDocumentManager();
		let listOfOpnedFiles: {folderName: string, fileName: string } [] = [];

		it('check mode', ()=>{
			documentManager.openedFolder(null);
			expect(documentManager.folderMode).equals(false,"expected to be in no folder mode");
		})


		it ('open existing files', () => {

			const promiseCreatetor = async (folderName,fileName,expecteAmountOfOpenDocuments): Promise<any> => {
				return new Promise (async (resolve,reject) => {
					let dgItem: TextDocumentItem= createTextDocumentItem(getFileFullPath(folderName,fileName));
					let docManagerAns: Promise<documentManagerResult []>  = documentManager.openedDocumentInClient(dgItem);
					let allDocs:PMTextDocument [] = documentManager.allDocumnets;
					try{
						expect(allDocs.length).equals(expecteAmountOfOpenDocuments, "expected to have " + expecteAmountOfOpenDocuments + " document in manager, actual: " + allDocs.length);
						expect(allDocs[expecteAmountOfOpenDocuments-1].getText()).equals(dgItem.text,"expected to to have same text for " + allDocs[expecteAmountOfOpenDocuments-1].uri);
						expect(allDocs[expecteAmountOfOpenDocuments-1].version === 1);
						await docManagerAns.then(ans=> {
							expect(ans.length).equals(1,"expected to recieve only 1 result from document manager");
							expect(ans[0].type).equals(documentManagerResultTypes.newFile, "expected the result type of document manager to be new file")
							//TODO add check for result of text doc
						});
						resolve ();
					}catch (error){
						reject (error);
					}
				})
			}

			let params: {folderName: string, fileName: string } [] =
			[
				{
					folderName: allPMFiles[0].folder,
					fileName: allPMFiles[0].files[0],
				},
				{
					folderName: allPMFiles[0].folder,
					fileName: allPMFiles[0].files[1],
				},
				{
					folderName:allPMFiles[3].folder,
					fileName:allPMFiles[3].files[1],
				},
				{
					folderName:allPMFiles[1].folder,
					fileName:allPMFiles[1].files[3],
				},
				{
					folderName:allPMFiles[1].folder,
					fileName:allPMFiles[1].files[2],
				}
			]

			let allPromisesToCheck: Promise<any>[] = params.map( (curr,idx ) => promiseCreatetor(curr.folderName, curr.fileName, idx+ 1));	

			let checkForDiffText: Promise<any> = new Promise (async (resolve,reject)=>{
				//test opening file with different text
				let diffTextItem: TextDocumentItem= createTextDocumentItem(getFileFullPath(params[4].folderName,params[4].fileName));
				diffTextItem.text = "bla bla";
				let docManagerAns: Promise<documentManagerResult []>  =documentManager.openedDocumentInClient(diffTextItem);
				let allDocs:PMTextDocument [] = documentManager.allDocumnets;
				try{
					expect(allDocs.length).equals(5, "expected to have 5 opened documents after diff open");
					expect(allDocs[allDocs.length-1].getText()).equals(diffTextItem.text,"expected to to have same text for " + allDocs[allDocs.length-1].uri);
					expect(allDocs[allDocs.length-1].version === 1);
					await docManagerAns.then(ans=> {
						expect(ans.length).equals(2,"expected to recieve 2 changes from documnet manager");
						expect(ans[0].type).equals(documentManagerResultTypes.removeFile, "first result should be remove")
						expect(ans[1].type).equals(documentManagerResultTypes.newFile, "second result should be new file")
						//TODO add check for result in ans
					});
					resolve ();
				}catch (error){
					reject (error);
				}
			});


			listOfOpnedFiles = params;

			allPromisesToCheck.push(checkForDiffText);

			return finalPromiseCreator(allPromisesToCheck);
		});

		it ('close files', ()=>{
			const promiseCreator = (folderName,fileName,expectedAmountOfDocuments): Promise<any> => {
				return new Promise (async (resolve,reject) => {
					let fileIdentifier = {uri: getFileURI(folderName,fileName)}
					let docManagerAns = documentManager.closedDocumentInClient(fileIdentifier);
					let allDocs = documentManager.allDocumnets;
					try {
						expect(allDocs.length).equals(expectedAmountOfDocuments, "after removing a file length should be shorte by 1");
						await docManagerAns.then(ans=> {
							expect(ans.type).equals(documentManagerResultTypes.removeFile, "expected to have remove type");
							expect(ans.result).equals(fileIdentifier.uri,"expected to return the uri of the removed file")
						});
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			}

			let allPromisesToCheck:Promise<any>[]= [];
						
			for (let i = 0 ; i<2 ; i ++){
				let toRemove = listOfOpnedFiles.pop();
				allPromisesToCheck.push(promiseCreator(toRemove.folderName,toRemove.fileName,listOfOpnedFiles.length));
			}
			
			return finalPromiseCreator(allPromisesToCheck);
		});

		it ('update text on files', ()=>{

			const promiseCreator = (fileIdx: number,DidChangeTextDocumentParams: DidChangeTextDocumentParams, expectedNewText:string ,expectedChangeRange): Promise<any> => {
				return new Promise(async (resolve,reject)=>{
					let docManagerAns = documentManager.changeTextDocument(DidChangeTextDocumentParams);
					let newTextDocumnet: PMTextDocument = documentManager.allDocumnets[fileIdx];
					try {
						expect(newTextDocumnet.version).equals(DidChangeTextDocumentParams.textDocument.version,"expected to update version on file: "+fileIdx);
						expect(newTextDocumnet.getText()).equals(expectedNewText,"expected text on file "+ fileIdx);
						await docManagerAns.then (ans =>{
							expect(ans.type).equals(documentManagerResultTypes.updateFile,"expected type of update on file: "+fileIdx)
							expect(ans.result.length).equals(1,"expected to have only 1 change range on file: "+fileIdx);
							expect(ans.result[0]).deep.equals(expectedChangeRange,"change range is incorrect on file: "+fileIdx)
						})
						resolve();
					} catch (error) {
						reject (error);
					}
				});
			}

			let allPromisesToCheck:Promise<any>[]= [];

			let allDocs = documentManager.allDocumnets;

			// delte all text 1
			let text1Orig = allDocs[0].getText();
			let text1New = "";
			let text1AllDocRange: Range = {
				start:{line: 0 , character: 0},
				end: allDocs[0].positionAt(text1Orig.length)
			}
			let changeParams1:DidChangeTextDocumentParams = {
				textDocument:{
					uri:allDocs[0].uri,
					version:allDocs[0].version + 1
				},
				contentChanges:
				[
					{
						text:text1New,
						range:text1AllDocRange,
						rangeLength:text1Orig.length
					}
				]
			}
			allPromisesToCheck.push(promiseCreator(0,changeParams1,text1New,{start:{line: 0 , character: 0},end:{line: 0 , character: 0}}))


			//apend \n bla bla bla to text 2
			let text2Orig = allDocs[1].getText();
			let text2New = "\nbla bla bla";
			let text2EndPosition: Position = allDocs[1].positionAt(text2Orig.length);

			let changeParams2:DidChangeTextDocumentParams ={
				textDocument:{
					uri:allDocs[1].uri,
					version:allDocs[1].version + 1
				},
				contentChanges:
				[
					{
						text:text2New,
						range:{
							start: text2EndPosition,
							end: text2EndPosition
						},
						rangeLength:0
					}
				]
			}

			allPromisesToCheck.push(promiseCreator(1,changeParams2,text2Orig + text2New, {start:text2EndPosition, end: {line: 4, character: text2New.length-1}}))

			// text 2 replace adde bla bla bla with ab bla ab but in 2 changes
			let change3NewText = "ab";
			let chage3Parmas:DidChangeTextDocumentParams = {
				textDocument: {
					uri:allDocs[1].uri,
					version:allDocs[1].version + 1
				},
				contentChanges:
					[
						{
							text:change3NewText,
							rangeLength:3,
							range:{ 
								start:{line:4,character:8},
								end: {line:4,character:11}
							}
						},
						{ 
							text:change3NewText,
							rangeLength:3,
							range:{
									start:{line:4,character:0},
									end: {line:4,character:3}
							}
						}
					]
			}

			let doubelChangeFinalText = text2Orig + "\nab bla ab";

			let twoChangesPromise = 
				new Promise(async (resolve,reject)=>{
				let docManagerAns = documentManager.changeTextDocument(chage3Parmas);
				let newTextDocumnet: PMTextDocument = documentManager.allDocumnets[1];
				try {
					expect(newTextDocumnet.version).equals(chage3Parmas.textDocument.version,"expected to update version on 2 changes");
					expect(newTextDocumnet.getText()).equals(doubelChangeFinalText,"expected text on 2 changes");
					await docManagerAns.then (ans =>{
						expect(ans.type).equals(documentManagerResultTypes.updateFile,"expected type of update on  2 changes")
						expect(ans.result.length).equals(2,"expected to have 2 change range on  2 changes");
						
						expect(ans.result[0]).deep.equals({
							start:{line:4,character:8},
							end: {line:4,character:10}
						},"first change range is incorrect on 2 changes")

						expect(ans.result[0]).deep.equals({
							start:{line:4,character:0},
							end: {line:4,character:2}
						},"second change range is incorrect on 2 changes")
					})
					resolve();
				} catch (error) {
					reject (error);
				}
			});


			//allPromisesToCheck.push(twoChangesPromise);
			//TODO fix this
			
			return finalPromiseCreator(allPromisesToCheck);
		});

	});

	describe('check delay',()=>{

		it('dealay in no folder mode',()=>{});

		it('check in folder mode',()=>{});

	})

	context('folder mode', ()=>{
		let documentManager: TextDocumentManager = new TextDocumentManager();

		it ('test open folder worked',()=>{
			documentManager.openedFolder(testFolder);
			expect(documentManager.folderMode).equals(true,"expected to be in folder mode");
		});

		it ('open files ',()=>{});
		
		it ('close files ',()=>{});

		it ('create and remove file', ()=>{});

		it ('update text on files', ()=>{});

	});


	function getFileFullPath(folderName: string, fileName: string): string {
		return testFolder + "\\" + folderName +"\\"+ fileName;
	}

	function getFileURI (folderName: string, fileName: string): string {
		return pathToURI(getFileFullPath(folderName,fileName));
	}
});


// -------------------- helper functions


function pathToURI (path: string){
	return URI.file(path).toString();
}

function createFakeTextDocumentItem (uri:string ="fake-text-uri.ps", langId:string = languagesIds[0],version: number = 1, content:string = "bla bla\n fake text\n in here"){
	return TextDocumentItem.create(uri, langId ,version ,content)
}

function createTextDocumentItem (path:string, version: number = 1): TextDocumentItem {
	let uri:string = pathToURI(path);
	let content:string = fs.readFileSync(path,"utf-8");
	let langId = "" //TODO
	return TextDocumentItem.create(uri, langId ,version ,content)
}

function finalPromiseCreator (allPromisesToCheck:Promise<any> []):Promise<any> {
	return new Promise ((resolve ,reject)=>{
		Promise.all(allPromisesToCheck)
		.catch(rej => reject(rej))
		.then(_ => resolve())
	})
	.then(_ => assert.isOk(true,""))
	.catch(err => {throw err});
}

function createTextDocumentChangeParams(uri, document:PMTextDocument,newText: string): DidChangeTextDocumentParams {
	let docIdentifier: VersionedTextDocumentIdentifier = {
		uri: uri,
		version: document.version + 1
	};

	let rangeLength: number = 0;
	let range: Range;

	if (newText = ""){
		rangeLength = document.getText().length;
		let endOfDocument:Position =  document.positionAt(rangeLength);
		range = {
			start: {line:0, character:0},
			end: endOfDocument
		}
	}

	let chagneEvent: TextDocumentContentChangeEvent = {
		range: range,
		text: newText,
		rangeLength: rangeLength
	}

	return {
		textDocument: docIdentifier,
		contentChanges:[chagneEvent]

	}

}


