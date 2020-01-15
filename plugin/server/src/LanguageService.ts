import {CompletionItemKind} from 'vscode-languageserver'

export function getInitialCompleteItems(): {label: string, kind: CompletionItemKind, data: number}[] {
   	return [
    {
      label: 'PolicyModels',
      kind: CompletionItemKind.Text,
      data: 1
    },
    {
      label: 'DecisionGraph',
      kind: CompletionItemKind.Text,
      data: 2
    },
    {
      label: 'PolicySpace',
      kind: CompletionItemKind.Text,
      data: 3
    }
  ];
}