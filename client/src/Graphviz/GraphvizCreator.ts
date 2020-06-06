import * as vscode from 'vscode';
import PolicyModelLibApi from '../services/PolicyModelLibApi';
import {GraphvizUIController} from './GraphvizUIController';
import {GRAPHVIZ_CONF_PATH} from './GraphvizController';
import FileService from '../services/FileService';


const graphvizOutputFolder = '/visualization';
const defaultFileName = 'ps'
const defaulFileFormat = '.svg'
// const graphvizDot = 'C:/Program Files (x86)/Graphviz2.38/bin/dot.exe'

export default class GraphvizCreator{
	_outputFolderPath: string;
	_policyModelLibApi: PolicyModelLibApi;

	constructor() {
		let outputFolderPath = vscode.workspace.rootPath + graphvizOutputFolder;
		this._outputFolderPath = outputFolderPath.replace(/\\/g, '/');
		this._policyModelLibApi = PolicyModelLibApi.getInstance();

		this._createOutputFolder(this._outputFolderPath)
	}
	
	async visualizePolicySpace(graphvizUIController: GraphvizUIController){
		var outputGraphvizPath = this._concatFilePath(graphvizUIController);
		await this._policyModelLibApi.visualizePolicySpace(
			outputGraphvizPath,
			graphvizUIController.dotPath);

		this._resolveDot(outputGraphvizPath, graphvizUIController);
	}

	async visualizeDecisionGraph(graphvizUIController){
		var outputGraphvizPath = this._concatFilePath(graphvizUIController);
		await this._policyModelLibApi.visualizeDecisionGraph(
			outputGraphvizPath,
			graphvizUIController.dotPath);
		
		this._resolveDot(outputGraphvizPath, graphvizUIController);
	}

	_createOutputFolder(outputFolderPath: string){
		if(!FileService.isExist(outputFolderPath)){
			FileService.createDirectory(outputFolderPath);
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
		}
	}

}
