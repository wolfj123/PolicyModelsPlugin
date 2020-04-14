import * as mocha from 'mocha';
import {TextDocumentManager} from '../../src/DocumentManager'
import { expect } from 'chai';

mocha.suite('document Manager test suite', ()=>{

	let testFolder: string;
	
	mocha.before(()=>{
		let cwd: string = process.cwd();
		testFolder = cwd+"\\tests\\sample directory";
		console.log("testDir " + testFolder);
	});

	context('no folder mode tests', ()=>{
		let documentManager: TextDocumentManager = new TextDocumentManager();

		it ('open existing files', ()=>{});

		it ('close files', ()=>{});

		it ('create and remove file', ()=>{});

		it ('update text on files', ()=>{});

	});

	describe('check dealy when no folder',()=>{

		it('dealay in no folder mode',()=>{});

		it('check in folder mode',()=>{});

	})

	context('folder mode', ()=>{
		let documentManager: TextDocumentManager = new TextDocumentManager();

		it ('test open folder worked',()=>{
			documentManager.openedFolder(testFolder);
		});

		it ('open files ',()=>{});
		
		it ('close files ',()=>{});

		it ('create and remove file', ()=>{});

		it ('update text on files', ()=>{});

	});



});

// describe('test test test', () => {

	
	

// 	it ('get Cwd',() => {
// 		console.log (process.cwd());
// 		console.log ("1111");
// 		expect(undefined,process.cwd()).equal(1,process.cwd());
// 	});
	
// });