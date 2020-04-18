
export interface AdditionalInfo {
  path: string;
}

export interface ICommand {
  action: CommandAction;
  content: JSON;
  additionalInfo?: AdditionalInfo;
}

export enum CommandAction {
  Save,
  Respone
}

export interface File {
	name: string;
	content: string;
	extension: string;
	path: string;
	id: string;
}

export interface LanguageData {
  files: File[];
  language: string;
}

export interface ItemMenuData{
  isSelected: boolean;
  onClick(): void;
  text:string
}
