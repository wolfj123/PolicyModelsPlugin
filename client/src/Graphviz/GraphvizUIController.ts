import * as vscode from 'vscode';
import GraphvizCreator from './GraphvizCreator';


export class GraphvizUIController{
	_isDotExist: boolean;
	_totalSteps: number;
	_step: number;
	dotPath: string;
	fileName: string;
	fileFormat: string;
	
	constructor(dotPath: string) {
		if (dotPath)
			this.dotPath = dotPath;
		this._isDotExist = dotPath !== "";
		this._totalSteps = this._isDotExist? 2 : 3;
		this._step = 1;
	}

	activate(){
		this._stepPromot();
	}

	_stepPromot(){
		let skip = this._isDotExist? 1 : 0;
		switch (this._step + skip){
			case 1:
				this._dotPathStep();
				break
			case 2:
				this._fileNameStep();
				break
			case 3:
				this._fileFormatStep();
				break
		}
	}

	_dotPathStep(){
		var inputBox: vscode.InputBox = vscode.window.createInputBox();
		inputBox.title = "Please give the path of your Graphviz dot.exe"
		inputBox.placeholder = "windows example: C:/Program Files (x86)/Graphviz2.38/bin/dot.exe"
		this._configItem(inputBox);

		inputBox.onDidAccept(()=>{
			this.dotPath = inputBox.value;
			console.log(`dot path step received answer ${this.fileName}`);
			console.log(`step: ${inputBox.step}`);
			this._step++;
			this._onFinish(inputBox);
			this._stepPromot();
		});

		inputBox.show()
	}

	_fileNameStep(){
		var inputBox: vscode.InputBox = vscode.window.createInputBox();
		this._configItem(inputBox);
		inputBox.title = "Please write output file name";
		inputBox.placeholder = "example: myGraph";


		inputBox.onDidAccept(()=>{
			this.fileName = inputBox.value;
			console.log(`file name step received answer ${this.fileName}`);
			console.log(`step: ${inputBox.step}`);
			this._step++;
			this._onFinish(inputBox);
			this._stepPromot();
		});

		inputBox.show();
	}

	_fileFormatStep(){
		var quickPick : vscode.QuickPick<vscode.QuickPickItem> = vscode.window.createQuickPick();
		this._configItem(quickPick);
		quickPick.title = "Please choose file format";
		quickPick.placeholder = "example: pdf";
		const vals = [
						{label: 'pdf'}, 
						{label: 'svg'},
						{label: 'dot'},
					]
		quickPick.items = vals;
		
		quickPick.onDidChangeSelection(selection => {
			this.fileFormat = selection[0].label;
			console.log(`file format step received answer ${this.fileName}`);
			console.log(`step: ${quickPick.step}`);
			this._step++;

			this._createFile();
			this._onFinish(quickPick);
		});

		quickPick.show();
	}

	_createFile(){}; //this method is overwitten with classes below

	_configItem(item: vscode.InputBox | vscode.QuickPick<vscode.QuickPickItem>){
		if(this._step!= 1){
			const back: vscode.QuickInputButton = vscode.QuickInputButtons.Back;
			item.buttons = [back];
		} else {
			item.buttons = []
		}
		item.totalSteps = this._totalSteps;
		item.step = this._step;
		item.ignoreFocusOut = true;

		this._defineDefaultHandlers(item);
	}

	_defineDefaultHandlers(item: vscode.InputBox | vscode.QuickPick<vscode.QuickPickItem>){
		const disposables = [];
		disposables.push(
		item.onDidTriggerButton((button)=>{
			this._step--;
			console.log(`step: ${item.step}`);
			console.log(`${button}`);
			disposables.forEach(d => d.dispose());
			this._defineDefaultHandlers(item)
			this._stepPromot();
		}));

		disposables.push(
		item.onDidHide(()=>{
			console.log("cancel event");
			item.dispose();
		}));
	}

	_onFinish(item: vscode.InputBox | vscode.QuickPick<vscode.QuickPickItem>){
		item.dispose();
	}
}

export class PSGraphvizUIController extends GraphvizUIController{
	constructor(dotPath: string) {
		super(dotPath);
	}

	_createFile(){
		const graphvizCreator = new GraphvizCreator();
		graphvizCreator.visualizePolicySpace(this);
	}
}

export class DGGraphvizUIController extends GraphvizUIController{
	constructor(dotPath: string) {
		super(dotPath);
	}

	_createFile(){
		const graphvizCreator = new GraphvizCreator();
		graphvizCreator.visualizeDecisionGraph(this);
	}
}
