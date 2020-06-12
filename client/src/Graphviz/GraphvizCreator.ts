import * as vscode from 'vscode';
import PolicyModelLibApi from '../services/PolicyModelLibApi';
import {GraphvizUIController} from './GraphvizUIController';
import {GRAPHVIZ_CONF_PATH} from './GraphvizController';
import FileService from '../services/FileService';


const graphvizOutputFolder = '/visualization';
const PSOutputFolder = '/PolicySpace';
const DGOutputFolder = '/DecisionGraph';

const defaultFileName = 'ps'
const defaulFileFormat = '.svg'

const badNameException = "bad name"
const badDotException = "bad dot"
const globalDotInfo = "global dot"


// graphviz Dot windows example => 'C:/Program Files (x86)/Graphviz2.38/bin/dot.exe'

class GraphvizCreator{
	_outputFolderPath: string;
	_policyModelLibApi: PolicyModelLibApi;

	constructor(innerOutputFolder: string) {
		let outputFolderPath = vscode.workspace.rootPath + graphvizOutputFolder;
		this._outputFolderPath = outputFolderPath.replace(/\\/g, '/');
		this._policyModelLibApi = PolicyModelLibApi.getInstance();

		this._createOutputFolder(this._outputFolderPath, innerOutputFolder)
	}


	async visualize(graphvizUIController: GraphvizUIController){} //this method is overwitten with classes below

	_createOutputFolder(outputFolderPath: string, innerOutputFolder: string){
		if(!FileService.isExist(outputFolderPath)){
			FileService.createDirectory(outputFolderPath);
		}
		this._outputFolderPath = this._outputFolderPath + innerOutputFolder;
		if(!FileService.isExist(this._outputFolderPath)){
			FileService.createDirectory(outputFolderPath + innerOutputFolder);
		}
	}

	_concatFilePath(graphvizUIController: GraphvizUIController){
		let fileName =  graphvizUIController.fileName?  graphvizUIController.fileName : defaultFileName;
		let postfix = graphvizUIController.fileFormat? graphvizUIController.fileFormat : defaulFileFormat;
		return this._outputFolderPath  + '/' + fileName + "." + postfix;
	}

	_resolveDot(outputGraphvizPath: string, graphvizUIController: GraphvizUIController){
		if(FileService.isExist(outputGraphvizPath)){
			FileService.writeToFile(GRAPHVIZ_CONF_PATH, graphvizUIController.dotPath)
		} else if(FileService.isExist(GRAPHVIZ_CONF_PATH) && FileService.readFromFile(GRAPHVIZ_CONF_PATH)){
			FileService.deleteFileInPath(GRAPHVIZ_CONF_PATH);
			this._graphvizMessageToUser("something went wrong, dot path is requiered again")
		}
	}

	_resolveDotBadDot(){
		if(FileService.isExist(GRAPHVIZ_CONF_PATH) && FileService.readFromFile(GRAPHVIZ_CONF_PATH)){
			FileService.deleteFileInPath(GRAPHVIZ_CONF_PATH);
		}
		this._graphvizMessageToUser("bad dot path, you need to enter dot path again")
	}

	_resolveDotBadName(graphvizUIController: GraphvizUIController){
		this._graphvizMessageToUser("bad output file name: '" + graphvizUIController.fileName +"'")
	}

	_graphvizMessageToUser(message: string){
		vscode.window.showInformationMessage("GRAPHVIZ integration: " + message);
	}

	_afterServerRequestHandler(result: any, graphvizUIController: GraphvizUIController, outputGraphvizPath:string){
		if(result == undefined){
			this._graphvizMessageToUser("Something went worng, check for errors when loading model.")
			return;
		}

		else if (result == true){
			this._resolveDot(outputGraphvizPath, graphvizUIController)
			return;
		}

		if(!(typeof result === 'string')){
			let msg = "Something went worng! unexpected server response, check logs for more information"
			this._graphvizMessageToUser(msg)
			console.log(msg);
			console.log("server response: " + result);
			return;
		}

		else if(result === badNameException)
			this._resolveDotBadName(graphvizUIController);

		else if(result === badDotException)
			this._resolveDotBadDot();

		else if(result.startsWith(globalDotInfo)){
			graphvizUIController.dotPath =
				"Your graphviz dot path is Global.\n"+
				"Don't delete this file so you won't need to provie dot path ever again.\n"+
				"GLOBAL PATH = " + result.substring(result.indexOf("$"))

			this._resolveDot(outputGraphvizPath, graphvizUIController)

		} else {
			this._resolveDot(outputGraphvizPath, graphvizUIController)
		}
	}
}


export class PSGraphvizCreator extends GraphvizCreator{
	constructor() {
		super(PSOutputFolder);
	}

	async visualize(graphvizUIController: GraphvizUIController){
		var outputGraphvizPath = this._concatFilePath(graphvizUIController);
		var result: any = await this._policyModelLibApi.visualizePolicySpace(
			outputGraphvizPath,
			graphvizUIController.dotPath,
			badNameException,
			badDotException,
			globalDotInfo);

		this._afterServerRequestHandler(result, graphvizUIController, outputGraphvizPath);
	}

}

export class DGGraphvizCreator extends GraphvizCreator{
	constructor() {
		super(DGOutputFolder);
	}

	async visualize(graphvizUIController){
		var outputGraphvizPath = this._concatFilePath(graphvizUIController);
		var result: any = await this._policyModelLibApi.visualizeDecisionGraph(
			outputGraphvizPath,
			graphvizUIController.dotPath,
			badNameException,
			badDotException,
			globalDotInfo);

		this._afterServerRequestHandler(result, graphvizUIController, outputGraphvizPath);
	}

}
