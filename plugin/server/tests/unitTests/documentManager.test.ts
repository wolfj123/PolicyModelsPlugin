import * as mocha from 'mocha';
import {TextDocumentManager, documentManagerResult, documentManagerResultTypes} from '../../src/DocumentManager'
import { expect, assert } from 'chai';
import { URI } from 'vscode-uri';
import { TextDocumentItem, DidChangeTextDocumentParams, Range, Position } from 'vscode-languageserver';
import * as fs from 'fs';
import { PMTextDocument } from '../../src/Documents';
import { languagesIds } from '../../src/Utils';


mocha.suite('document Manager test suite', ()=>{

	let testFolder: string;
	let testFolderSuffix: string = "/server/tests/sample directory";

	let allPMFiles: {folderUri:string ,folder:string, files:string []}[] = 
	[
		{	// 0
			folderUri: "InferrerExample",
			folder:"InferrerExample",
			files: 
			[   
				"decision-graph.dg",
				"policy-space.pspace",
				"valueInference.vi",
				"emptyText.ps"
			]
		},
		{  	// 1
			folderUri:"dg-large-modular",
			folder:"dg-large-modular",
			files:
			[	
				"dppa.dg",
				"ferpa.dg",
				"government-records.dg",
				"medical.dg",
				"ppra.dg",
				"questionnaire.dg",
				"test.pspace"
			]
		},
		{	//2
			folderUri:"a/Recursive-Sections",
			folder:"a/Recursive-Sections",
			files:
			[	
				"decision-graph.dg",
				"policy-space.pspace"
			],
		},
		{	//3
			folderUri:"a/a/Find-Runs-playground",
			folder:"a/a/Find-Runs-playground",
			files:
			[	
				"decision-graph.dg",
				"policy-space.ps",
				"valueInference.vi"
			]
		}
	]
	
	mocha.before(()=>{
		let cwd: string = process.cwd();
		testFolder = cwd+testFolderSuffix;
		console.log("testDir " + testFolder);
	});

	function genericTextUpdateTest (documentManager: TextDocumentManager) {
		const promiseCreator = (fileIdx: number,DidChangeTextDocumentParams: DidChangeTextDocumentParams, expectedNewText:string ,expectedChangeRange): Promise<any> => {
			return new Promise(async (resolve,reject)=>{
				let docManagerAns = documentManager.changeTextDocument(DidChangeTextDocumentParams);
				try {
					await docManagerAns.then (ans =>{
						expect(ans.type).equals(documentManagerResultTypes.updateFile,"expected type of update on file: " + fileIdx)
						expect(ans.result.length).equals(1,"expected to have only 1 change range on file: " + fileIdx);
						expect(ans.result[0]).deep.equals(expectedChangeRange,"change range is incorrect on file: "+fileIdx)
					})
					let newTextDocumnet: PMTextDocument = documentManager.allDocumnets[fileIdx];
					expect(newTextDocumnet.version).equals(DidChangeTextDocumentParams.textDocument.version,"expected to update version on file: "+fileIdx);
					expect(newTextDocumnet.getText()).equals(expectedNewText,"expected text on file "+ fileIdx);
					expect(newTextDocumnet.lastChanges[0]).deep.equals(expectedChangeRange, "change wasn't update in documnet object on file " + fileIdx);
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
				version:2
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
				version:3
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
		let changeLine = text2EndPosition.line + 1;

		allPromisesToCheck.push(promiseCreator(1,changeParams2,text2Orig + text2New, {start:text2EndPosition, end: {line: changeLine, character: text2New.length-1}}))

		// text 2 replace adde bla bla bla with ab bla ab but in 2 changes
		let change3NewText = "ab";
		
		let chage3Parmas:DidChangeTextDocumentParams = {
			textDocument: {
				uri:allDocs[1].uri,
				version:3
			},
			contentChanges:
				[
					{
						text:change3NewText,
						rangeLength:3,
						range:{ 
							start:{line:changeLine,character:8},
							end: {line:changeLine,character:11}
						}
					},
					{ 
						text:change3NewText,
						rangeLength:3,
						range:{
								start:{line:changeLine,character:0},
								end: {line:changeLine,character:3}
						}
					}
				]
		}
		
		return finalPromiseCreator(allPromisesToCheck);
	}

	function genericTwoChangeUpdateTest (documentManager: TextDocumentManager){
		// text 2 replace adde bla bla bla with ab bla ab but in 2 changes
		let allPromisesToCheck:Promise<any>[]= [];
		let allDocs = documentManager.allDocumnets;
		let text2Orig = allDocs[1].getText();
		let text2EndPosition: Position = allDocs[1].positionAt(text2Orig.length);
		let changeLine = text2EndPosition.line + 1;
		
		
		let change3NewText = "ab";
		
		let chage3Parmas:DidChangeTextDocumentParams = {
			textDocument: {
				uri:allDocs[1].uri,
				version:3
			},
			contentChanges:
				[
					{
						text:change3NewText,
						rangeLength:3,
						range:{ 
							start:{line:changeLine,character:8},
							end: {line:changeLine,character:11}
						}
					},
					{ 
						text:change3NewText,
						rangeLength:3,
						range:{
								start:{line:changeLine,character:0},
								end: {line:changeLine,character:3}
						}
					}
				]
		}

		let doubelChangeFinalText = text2Orig + "\nab bla ab";

		let expectedChangeRange: Range [] = [
			{start:{line:changeLine,character:8},
			end: {line:changeLine,character:10}},
			{start:{line:changeLine,character:0},
			end: {line:changeLine,character:2}}
		]

		let twoChangesPromise = 
			new Promise(async (resolve,reject)=>{
			let docManagerAns = documentManager.changeTextDocument(chage3Parmas);
			
			try {
				await docManagerAns.then (ans =>{
					expect(ans.type).equals(documentManagerResultTypes.updateFile,"expected type of update on  2 changes")
					expect(ans.result.length).equals(2,"expected to have 2 change range on  2 changes");
					expect(ans.result).deep.equals(expectedChangeRange, "changes are incorrect for 2 files changes");
				})
				let newTextDocumnet: PMTextDocument = documentManager.allDocumnets[1];
				expect(newTextDocumnet.version).equals(chage3Parmas.textDocument.version,"expected to update version on 2 changes");
				expect(newTextDocumnet.getText()).equals(doubelChangeFinalText,"expected text on 2 changes");
				expect(newTextDocumnet.lastChanges[0]).deep.equals(expectedChangeRange, "change wasn't update in documnet for 2 changes" );
				resolve();
			} catch (error) {
				reject (error);
			}
		});

		return finalPromiseCreator([twoChangesPromise]);
	}

	context('no folder mode tests', ()=>{
		let documentManager: TextDocumentManager;
		let listOfOpnedFiles: {folderName: string, fileName: string } [] = [];

		mocha.before( ()=>{
			documentManager = new TextDocumentManager();
		});

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
			return genericTextUpdateTest(documentManager);
		});

		it ('update 2 changes on text file', ()=>{
			//return genericTwoChangeUpdateTest(documentManager);
		});

	});

	context('folder mode', ()=>{
		let documentManager: TextDocumentManager;
		let listOfOpnedFiles: number [][];
		let fakeFileUri:string;

		mocha.before( ()=>{
			documentManager = new TextDocumentManager();
			fakeFileUri = pathToURI(testFolder + "/fake-file.ps");
		});
		
		it ('test open folder worked',()=>{
			documentManager.openedFolder(pathToURI(testFolder));
			expect(documentManager.folderMode).equals(true,"expected to be in folder mode");
			//test for file amount
			let totalFiles = 0;
			allPMFiles.forEach(curr => totalFiles+= curr.files.length);
			expect(documentManager.allDocumnets.length).equals(totalFiles, "the amount of opend files is incorrect")

			//test for files text and version
			documentManager.allDocumnets.forEach(opendFile=>{
				let filePath: string = URI.parse(opendFile.uri).fsPath;
				let fileText: string = fs.readFileSync(filePath,"utf-8");
				expect(opendFile.getText()).equals(fileText,`file ${filePath} text isn't equal to text read from file`);
				expect(opendFile.version).equals(-1,`file ${opendFile.uri} version isn't -1 after reading from folder`);
			});

			//check for empty text file
			let emptyText: string = documentManager.allDocumnets.find(currFile => currFile.uri.includes(allPMFiles[0].files[3])).getText();
			expect(emptyText).equals("", `empty text file text is incorrect`);
			
		});

		it ('open files in Client',()=> {		
			
			listOfOpnedFiles = [
				[1,1],[2,0],[0,2],[3,1]
			]

			const promiseCreator: (folderIdx: number,fileIdx: number , newVersion: number)=> Promise<any> =
			(folderIdx: number,fileIdx: number , newVersion: number): Promise<any> => {
				return new Promise(async (resolve,reject) => {
					try {
						let folder = allPMFiles[folderIdx].folder;
						let folderUri = allPMFiles[folderIdx].folderUri;
						let file = allPMFiles[folderIdx].files[fileIdx];
						let openParams: TextDocumentItem = createTextDocumentItem(getFileFullPath(folder,file),newVersion);
						let docManagerAns = documentManager.openedDocumentInClient(openParams);
						await docManagerAns.then(ans=>{
							expect(ans.length).equals(1,`expected to recieve only 1 result from document manager when opening ${getFileFullPath(folder,file)}`);
							expect(ans[0].type).equals(documentManagerResultTypes.noChange, `opening file read from folder should return no change for file ${getFileFullPath(folder,file)}`);
						});
						let doc: PMTextDocument = documentManager.allDocumnets.find(curr=> curr.uri.includes(folderUri) && curr.uri.includes(file));
						expect(doc).not.equals(undefined,`${folderUri} , ${file}`)
						expect(doc.version).equals(newVersion,`version in all docs is incorrecte after open for file ${getFileFullPath(folder,file)}`);

						resolve();
					} catch (error) {
						reject(error);
					}
				});
			}

			let allPromisesToCheck: Promise<any>[] = listOfOpnedFiles.map((curr)=>promiseCreator(curr[0],curr[1],1));

			let lastIdx = [3,2];
			listOfOpnedFiles.push(lastIdx);
			allPromisesToCheck.push(new Promise (async (resolve,reject)=> {
				let folder = allPMFiles[lastIdx[0]].folder;
				let folderUri = allPMFiles[lastIdx[0]].folderUri;
				let file = allPMFiles[lastIdx[0]].files[lastIdx[1]];
				try{
					let openParams: TextDocumentItem = createTextDocumentItem(getFileFullPath(folder,file),1);
					openParams.text = "";
					let docManagerAns = documentManager.openedDocumentInClient(openParams);
					await docManagerAns.then(ans=>{
						expect(ans.length).equals(2,`expected to recieve  2 result from document manager for diff text when opening ${getFileFullPath(folder,file)}`);
						expect(ans[0].type).equals(documentManagerResultTypes.removeFile, `opening diff text should return remove  for file ${getFileFullPath(folder,file)}`);
						expect(ans[1].type).equals(documentManagerResultTypes.newFile, `opening diff text should return new file  for file ${getFileFullPath(folder,file)}`);
					});

					let doc: PMTextDocument = documentManager.allDocumnets.find(curr=> curr.uri.includes(folderUri) && curr.uri.includes(file));
					expect(doc).not.equals(undefined,`${folderUri} , ${file}`)
					expect(doc.version).equals(1 ,`version in all docs is incorrecte after open for file ${getFileFullPath(folder,file)}`);

					resolve();
				} catch (error){
					reject(error);
				}
			}))

			return finalPromiseCreator(allPromisesToCheck);

		});
		
		it ('close files ',()=>{
			let allPromisesToCheck: Promise<any>[] = [];

			const promiseCreatetor = (folderIdx: number,fileIdx: number ): Promise<any> => {
				return new Promise(async (resolve,reject) =>{
					try {
						let folder:string = allPMFiles[folderIdx].folder;
						let file:string = allPMFiles[folderIdx].files[fileIdx];
						let folderUri:string = allPMFiles[folderIdx].folderUri;
						let closeParams= {uri: getFileURI(folder,file)}
						let docManagerAns = documentManager.closedDocumentInClient(closeParams);
						await docManagerAns.then(ans =>{
							expect(ans.type).equals(documentManagerResultTypes.noChange,`when closing should have no change for file: ${getFileFullPath(folder,file)}`);
						})
						let doc: PMTextDocument = documentManager.allDocumnets.find(curr=> curr.uri.includes(folderUri) && curr.uri.includes(file));
						expect(doc).not.equals(undefined,`${folder} , ${file}`)
						expect(doc.version).equals(-1 ,`after close version error for file ${getFileFullPath(folder,file)}`);
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			}

			allPromisesToCheck.push(promiseCreatetor(listOfOpnedFiles[listOfOpnedFiles.length-1][0],listOfOpnedFiles[listOfOpnedFiles.length-1][1] ))
			allPromisesToCheck.push(promiseCreatetor(listOfOpnedFiles[listOfOpnedFiles.length-1][0],listOfOpnedFiles[listOfOpnedFiles.length-1][1] ))

			return finalPromiseCreator(allPromisesToCheck);
		});

		it ('create and remove non existing files', ()=>{
			let allPromisesToCheck: Promise<any>[] = [];
			
			const noCreation = new Promise( async (resolve,reject)=>{
				let oldAmount: number = documentManager.allDocumnets.length;
				let uri:string =  getFileURI(allPMFiles[0].folder,allPMFiles[0].files[0]);
				try{
					await documentManager.clientCreatedNewFile(uri).then(ans =>{
						expect(ans.type).equals(documentManagerResultTypes.noChange," in no real creation not expecte to create file");
					});
					expect(documentManager.allDocumnets.length).equals(oldAmount,"changed amount of files in no creation");
					resolve();
				}catch (error){
					reject(error);
				}
			});

			const noDeletion = new Promise( async (resolve,reject)=>{
				let oldAmount: number = documentManager.allDocumnets.length;
				let uri:string =  getFileURI(allPMFiles[0].folder,allPMFiles[1].files[1]);
				try{
					await documentManager.deletedDocument(uri).then(ans =>{
						expect(ans.type).equals(documentManagerResultTypes.noChange," in no deletion expected not to delete the file");
					});
					expect(documentManager.allDocumnets.length).equals(oldAmount,"changed amount of files in no deletion ");
					resolve();
				}catch (error){
					reject(error);
				}
			});



			allPromisesToCheck.push(noCreation);
			allPromisesToCheck.push(noDeletion);
			

			return finalPromiseCreator(allPromisesToCheck);
		});

		it ('create new file',()=>{
			const successfulCreation = new Promise(async (resolve,reject) => {
				let oldAmount = documentManager.allDocumnets.length;
				try{
					await documentManager.clientCreatedNewFile(fakeFileUri).then(ans =>{
						expect(ans.type).equals(documentManagerResultTypes.newFile," in creation expected to create a file");
						expect(ans.result.uri).equals(fakeFileUri,"created files uri don't match")
					});
					expect(documentManager.allDocumnets.length).equals(oldAmount + 1,"didn't increase amount of files in creation");
					resolve();
				}catch (error){
					reject(error);
				}
			});			

			return finalPromiseCreator([successfulCreation]);
		});
		
		it ('remove real file', ()=>{
			const successfullDeletion = new Promise(async (resolve,reject) => {
				let oldAmount = documentManager.allDocumnets.length;
				try{
					await documentManager.deletedDocument (fakeFileUri).then( ans =>{
						expect(ans.type).equals(documentManagerResultTypes.removeFile," in remove didn't removed file");
						expect(ans.result).equals(fakeFileUri,"removed files uri don't match")
					});
					expect(documentManager.allDocumnets.length).equals(oldAmount - 1,"didn't decrease amoutn of files in deletion");
					resolve();
				}catch (error){
					reject(error);
				}
			});

			return finalPromiseCreator([successfullDeletion]);			
		})

		it ('update text on files', ()=>{
			return genericTextUpdateTest(documentManager);
		});

		it ('update 2 changes on text file', ()=>{
			//return genericTwoChangeUpdateTest(documentManager);
		});

	});


	function getFileFullPath(folderName: string, fileName: string): string {
		return testFolder + "/" + folderName +"/"+ fileName;
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


