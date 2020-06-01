import * as vscode from 'vscode';
import { GraphvizUIController, PSGraphvizUIController, DGGraphvizUIController } from './GraphvizUIController';
import FileService from '../services/FileService';

export const GRAPHVIZ_CONF_PATH = (vscode.workspace.rootPath + "/graphvizConfig.txt").replace(/\\/g, '/'); //TODO
export const POLICY_SPACE_TYPE = "ps";
export const DECISION_GRAPH_TYPE = "dg";


export class GraphvizController{
	_ui: GraphvizUIController;

	constructor(type: string){
		var fileService = new FileService()
		var dot = "";
		try{
			dot = fileService.readFromFile(GRAPHVIZ_CONF_PATH)
		} catch (e){}
		this._chooseGraphvizUIController(type, dot);
	}
	
	visualizePolicySpace(){
		this._policyModelLibApi.visualizePolicySpace(this._outputFolderPath + policySpacePostfix, graphvizDot)
		.catch(rej => {
			console.log("can't create visualization for Policy Space\n" + rej);
		})
	}

	visualizeDecisionGraph(){
		this._policyModelLibApi.visualizeDecisionGraph(this._outputFolderPath + decisionGraphPostix, graphvizDot)
		.catch(rej => {
			console.log("can't create visualization fot Decision Graph\n" + rej);
		})
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
