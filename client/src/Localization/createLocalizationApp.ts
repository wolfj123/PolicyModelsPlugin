
import * as vscode from 'vscode';
import LocalizationDomain from './LocalizationDomain';
import FileService from '../services/FileService';
import { InputBoxOptions } from 'vscode';
import PolicyModelLibApi from '../services/PolicyModelLibApi';

const localizationRootFolder = '/languages';
let _extensionPath, _localizationPath, _onError;

/**
 * The {@link createLocalizationApp} is the entry point of the localization app.
 * Its responsible to validate pre-conditions, and create the localization app.
 * In addition, Its use {@link PolicyModelLibApi} to excute 'update localization' action
 * and pass the results to the {@link LocalizationDomain}
*/


const createLocalizationApp = (extensionPath: string): void => {
	_extensionPath = extensionPath;
	const workspacePath = vscode.workspace.rootPath;
	_localizationPath = workspacePath + localizationRootFolder
	_onError = e => vscode.window.showErrorMessage(e);
	activeLocalization();
}

function activeLocalization() {

	const languagesFolderExist = FileService.isFolderExist(_localizationPath);
	if (languagesFolderExist) {
		const localization = new LocalizationDomain({ extensionPath: _extensionPath }, _localizationPath, _onError);
		try {
			PolicyModelLibApi.getInstance().updateLocalization().then(answersToRemove => {
				const updateResponse = { answersToRemove: answersToRemove||[] };
				localization.activateLocalization(updateResponse);
			});

		} catch (e) {
			_onError(e);
		}
	} else {
		handleNewLocalization();
	}
}

async function handleNewLocalization(): Promise<void> {
	const createLocalizationButton = 'Create New Localization';

	const selection = await vscode.window.showInformationMessage(`Localization doesn't exist.`, createLocalizationButton)
	if (selection === createLocalizationButton) {
		tryCreateLocalizationFiles()
	}
}

async function tryCreateLocalizationFiles() {
	let selection;
	const tryAgainButton = 'Try Again';

	let options: InputBoxOptions = {
		prompt: "Enter localization name",
		placeHolder: "e.g. en_US"
	}

	const name: string = await vscode.window.showInputBox(options)
	if (name === '') {
		selection = await vscode.window.showInformationMessage(`Please insert valid name. `, tryAgainButton)
		if (selection === tryAgainButton) {
			tryCreateLocalizationFiles();
		}
	} else if (!name) {
		return;
	} else {
		const api: PolicyModelLibApi = PolicyModelLibApi.getInstance();
		const created = await api.createNewLocalization(name);
		if (created) {
			activeLocalization();

		} else {
			selection = await vscode.window.showInformationMessage(`Some problem occurred. `, tryAgainButton)
			if (selection === tryAgainButton) {
				tryCreateLocalizationFiles();
			}
		}
	}
}


export default createLocalizationApp;