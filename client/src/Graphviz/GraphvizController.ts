import PolicyModelLibApi from '../services/PolicyModelLibApi';

const graphvizOutputFolder = '/visualization';
const policySpacePostfix = '/ps.svg'
const decisionGraphPostix = '/dg.svg'


export default class GraphvizController{
	_outputFolderPath: string;
	_policyModelLibApi: PolicyModelLibApi;

	constructor(rootPath: string) {
		let outputFolderPath = rootPath + graphvizOutputFolder;
		this._outputFolderPath = outputFolderPath.replace(/\\/g, '/');
		this._policyModelLibApi = PolicyModelLibApi.getInstance();
	}
	
	visualizePolicySpace(){
		this._policyModelLibApi.visualizePolicySpace(this._outputFolderPath + policySpacePostfix)
		// this._policyModelLibApi.createNewLocalization("loc");
	}

	visualizeDecisionGraph(){
		this._policyModelLibApi.visualizeDecisionGraph(this._outputFolderPath + decisionGraphPostix)

	}
}
