import PolicyModelLibApi from '../services/PolicyModelLibApi';

var fs = require('fs');

const graphvizOutputFolder = '/visualization';
const policySpacePostfix = '/ps.svg'
const decisionGraphPostix = '/dg.svg'
const graphvizDot = 'C:/Program Files (x86)/Graphviz2.38/bin/dot.exe'

export default class GraphvizController{
	_outputFolderPath: string;
	_policyModelLibApi: PolicyModelLibApi;

	constructor(rootPath: string) {
		let outputFolderPath = rootPath + graphvizOutputFolder;
		this._outputFolderPath = outputFolderPath.replace(/\\/g, '/');
		this.createOutputFolder(this._outputFolderPath)
		this._policyModelLibApi = PolicyModelLibApi.getInstance();
	}
	
	visualizePolicySpace(){
		this._policyModelLibApi.visualizePolicySpace(this._outputFolderPath + policySpacePostfix, graphvizDot)
	}

	visualizeDecisionGraph(){
		this._policyModelLibApi.visualizeDecisionGraph(this._outputFolderPath + decisionGraphPostix, graphvizDot)

	}

	createOutputFolder(outputFolderPath: string){
		if (!fs.existsSync(outputFolderPath)){
			fs.mkdirSync(outputFolderPath);
		}
	}
}
