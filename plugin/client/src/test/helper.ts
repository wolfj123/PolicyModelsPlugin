/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import * as path from 'path';

export let doc: vscode.TextDocument;
export let editor: vscode.TextEditor;
export let documentEol: string;
export let platformEol: string;

export let defaultRange = new vscode.Range(new vscode.Position(0,0), new vscode.Position(0,0));

/**
 * Activates the vscode.lsp-sample extension
 */
export async function activate(docUri: vscode.Uri) {
	// The extensionId is `publisher.name` from package.json
	const ext = vscode.extensions.getExtension('policymodels-lsp.policymodels-lsp')!;
	await ext.activate();
	try {
		doc = await vscode.workspace.openTextDocument(docUri);
		editor = await vscode.window.showTextDocument(doc);
		await sleep(2000); // Wait for server activation
	} catch (e) {
		console.error(e);
	}
}

export async function openFileForEditing(docPath : string) : Promise<vscode.TextEditor>{
	try {
		const docUri = getDocUri(docPath);
		doc = await vscode.workspace.openTextDocument(docUri);
		editor = await vscode.window.showTextDocument(doc);
		await sleep(2000); // Wait for server activation
		return editor;
	} catch (e) {
		console.error(e);
		return undefined;
	}
}

export async function appendTextToEndOfFile (editor : vscode.TextEditor, txt: string){
	let lineCount:number = editor.document.lineCount;
	return editor.edit(e=>{
		e.insert(new vscode.Position(lineCount,0),txt);
	});
}

export async function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export const getDocPath = (p: string) => {
	return path.resolve(__dirname, '../../testFixture', p);
};

export const getDocUri = (p: string) => {
	return vscode.Uri.file(getDocPath(p));
};

export async function setTestContent(content: string): Promise<boolean> {
	const all = new vscode.Range(
		doc.positionAt(0),
		doc.positionAt(doc.getText().length)
	);
	return editor.edit(eb => eb.replace(all, content));
}

export const getWordRangeFromLineInEditor = (word: string, line:number) : vscode.Range => {
	var firstLine = editor.document.lineAt(line);
	var wordStartPosition: vscode.Position = 
		editor.document.positionAt(editor.document.offsetAt(firstLine.range.start) + firstLine.text.indexOf(word));
	var wordEndPosition: vscode.Position = 
		editor.document.positionAt(editor.document.offsetAt(wordStartPosition) + word.length);
	return new vscode.Range(wordStartPosition, wordEndPosition);
}


export async function getWordRangeFromLineInFile(word: string, line:number, docUri:vscode.Uri) : Promise<vscode.Range> {
	let doc: vscode.TextDocument;
	try {
		doc = await vscode.workspace.openTextDocument(docUri);
	} catch (e) {
		console.error(e);
		return
	}
	var firstLine = doc.lineAt(line);
	if(firstLine.text.includes(word+" ") || firstLine.text.includes(" " + word) || firstLine.text.includes(">"+word)
		|| firstLine.text.includes(word+":")){
		var wordStartPosition: vscode.Position = 
			editor.document.positionAt(editor.document.offsetAt(firstLine.range.start) + firstLine.text.indexOf(word));
		var wordEndPosition: vscode.Position = 
			editor.document.positionAt(editor.document.offsetAt(wordStartPosition) + word.length);
		return new vscode.Range(wordStartPosition, wordEndPosition);
	}
	return defaultRange;
}

export async function getWordRangeFromLineInFile2(word: string, line:number, doc:vscode.TextDocument) : Promise<vscode.Range> {
	var currLine = doc.lineAt(line);
	word = word.toLowerCase();
	if(currLine.text.toLowerCase().includes(" "+word+" ") 
		|| currLine.text.toLowerCase().includes(">"+word+"<") 
		|| currLine.text.toLowerCase().includes(word+":")
		|| currLine.text.toLowerCase().includes(" "+word+"=")
		|| currLine.text.toLowerCase().includes(" "+word+".")
		|| currLine.text.toLowerCase().includes(" "+word+",")
		|| currLine.text.toLowerCase().includes("="+word+";")
		|| currLine.text.toLowerCase().includes("="+word+"]")
		|| currLine.text.toLowerCase().includes("="+word+" ")
		|| currLine.text.toLowerCase().includes(">"+word+"-")){
		let wordOffset = currLine.text.toLowerCase().indexOf(word);
		var wordStartPosition: vscode.Position = 
			editor.document.positionAt(doc.offsetAt(currLine.range.start) + wordOffset);
		var wordEndPosition: vscode.Position = 
			editor.document.positionAt(doc.offsetAt(wordStartPosition) + word.length);
		return new vscode.Range(wordStartPosition, wordEndPosition);
	}
	return;
}

export async function getAllWordRangeInFile(word: string, docUri:vscode.Uri){
	let result : vscode.Range[] = []
	let doc: vscode.TextDocument = await vscode.workspace.openTextDocument(docUri);
	editor = await vscode.window.showTextDocument(doc);
	sleep(2000)
	for(let i = 0; i < doc.lineCount; i++){
		let promise = await getWordRangeFromLineInFile2(word, i, doc);
		if (promise)
			result.push(promise);
	}
	return result;
}

export async function getAllWordLocationsFromFilesInDir(word: string, dir:string, folderAsPath:string){
	let files = readAllCodeFilesInDirectory(dir);
	let result = {}
	files.forEach(async (file) => {
		let uri = getDocUri(folderAsPath + file);
		let x = await getAllWordRangeInFile(word, uri);
		result[uri.toString()] = {"uri": uri, "ranges": x}
	})
	await sleep(2000 * files.length)
	return result;
}

export const getWordPositionFromLine = (word: string, line:number, shiftig = 0) : vscode.Position => {
	if(shiftig===undefined)
		shiftig=0;
	var firstLine = editor.document.lineAt(line);
	return editor.document.positionAt(editor.document.offsetAt(firstLine.range.start) + firstLine.text.indexOf(word) + 1 + shiftig);
}

export const getWordFinishPositionFromLine = (word: string, line:number, shiftig = 0) : vscode.Position => {
	if(shiftig===undefined)
		shiftig=0;
	var firstLine = editor.document.lineAt(line);
	return editor.document.positionAt(editor.document.offsetAt(firstLine.range.start) + firstLine.text.indexOf(word) + 1 + shiftig + word.length);
}
  
export function readAllCodeFilesInDirectory(dir:string) {
	const fs = require('fs');
	const files = [];
  
	fs.readdirSync(dir).forEach(filename => {
	  const ext = path.parse(filename).ext;
	  if(ext===".vi" || ext===".pspace" || ext===".dg")
	  	files.push(filename)
	});
  
	return files;
}
