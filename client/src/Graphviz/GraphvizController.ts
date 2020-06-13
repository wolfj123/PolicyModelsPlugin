// import * as vscode from 'vscode';
import { GraphvizUIController, PSGraphvizUIController, DGGraphvizUIController } from './GraphvizUIController';
import FileService from '../services/FileService';


/**
 * GraphvizController is the Integration router interface.
 * It route between the user visualization choise and the correct UI copmponent.
 * 
 * GRAPHVIZ_CONF_PATH is the path to the place where the path of graphviz dot is save.
 * examples:
 * GRAPHVIZ_CONF_PATH = 'C:/Program Files (x86)/Graphviz2.38/bin/dot.exe' (Windows)
 * GRAPHVIZ_CONF_PATH = '/usr/local/bin/dot' (macOS)
 * 
 */


// export const GRAPHVIZ_CONF_PATH = (vscode.workspace.rootPath + "/graphvizConfig.txt").replace(/\\/g, '/'); // choose this to config locally in project folder
export const GRAPHVIZ_CONF_PATH = (_getConfigFolderPath() + "/graphvizConfig.txt").replace(/\\/g, '/'); // write config to project output directory

export const POLICY_SPACE_TYPE = "ps";
export const DECISION_GRAPH_TYPE = "dg";


export class GraphvizController{
	_ui: GraphvizUIController;

	constructor(type: string){
		var dot = "";
		try{
			dot = FileService.readFromFile(GRAPHVIZ_CONF_PATH)
		} catch (e){}
		this._chooseGraphvizUIController(type, dot);
	}

	activate(){
		this._ui.activate();
	}

	_chooseGraphvizUIController(type: string, dot: string){
		if(type == POLICY_SPACE_TYPE)
			this._ui = new PSGraphvizUIController(dot);
		else if(type == DECISION_GRAPH_TYPE)
			this._ui = new DGGraphvizUIController(dot);
		else 
			throw new Error(`${type} type of GraphvizUIController is not supported`)
	}
}

function _getConfigFolderPath(){
	// will return ".../clinet/Graphviz/out"
	let dirPath = __dirname
	console.log(dirPath);
	return dirPath;
	
}
