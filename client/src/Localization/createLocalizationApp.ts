
import * as vscode from 'vscode';
import LocalizationController from './LocalizationController';
import FileService from './FileService';
import { InputBoxOptions } from 'vscode';
import PolicyModelLibApi from '../services/PolicyModelLibApi';

const localizationRootFolder = '/languages';
let _extensionPath, _localizationPath, _onError;

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
		const localization = new LocalizationController({ extensionPath: _extensionPath }, _localizationPath, _onError);
		try {
			localization.activateLocalization();
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
	const openLocalizationAppButton = 'Open';
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
			selection = await vscode.window.showInformationMessage(`Localization successfully created.`, openLocalizationAppButton)
			if (selection === openLocalizationAppButton) {
				activeLocalization();
			}

		} else {
			selection = await vscode.window.showInformationMessage(`Some problem occurred. `, tryAgainButton)
			if (selection === tryAgainButton) {
				tryCreateLocalizationFiles();
			}
		}
	}
}


export default createLocalizationApp;