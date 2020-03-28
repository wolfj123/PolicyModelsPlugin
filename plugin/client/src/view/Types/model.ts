
export interface AdditionalInfo {
  path: string;
}

export interface ICommand {
  action: CommandAction;
  content: JSON;
  additionalInfo?: AdditionalInfo;
}

export enum CommandAction {
  Save
}
