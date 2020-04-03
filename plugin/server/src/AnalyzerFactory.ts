import { TextDocWithChanges } from './DocumentChangesManager';
import { Analyzer, PolicySpaceAnalyzer, DecisionGraphAnalyzer, ValueInferenceAnalyzer } from './Analyzer';
import { langugeIds } from './Utils';
import { TextDocument } from 'vscode-languageserver-textdocument';


export function CreateAnalyzer(textDoc: TextDocWithChanges): Analyzer {	

	let analyzer: Analyzer;
	switch(langugeIds[textDoc.textDocument.languageId]){
		case langugeIds.policyspace:
			analyzer = new PolicySpaceAnalyzer(textDoc);
			break;	
		case langugeIds.decisionGraph:
			analyzer = new DecisionGraphAnalyzer(textDoc);
			break;
		case langugeIds.valueInference:
			analyzer = new ValueInferenceAnalyzer(textDoc);
		default:
			analyzer = undefined;
	}

	if (analyzer === undefined){
		//TODO throw error / log
		return null;
	}

	return analyzer;
}