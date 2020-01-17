import {CompletionItemKind , CompletionItem} from 'vscode-languageserver'

export function getInitialCompleteItems(): CompletionItem[] {
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

export function getCompleteItemsAdditionalInformation(item: CompletionItem) :CompletionItem {
  if (item.data === 1) {
    item.detail = 'PolicyModels details';
    item.documentation = 'PolicyModels documentation';
  } else if (item.data === 2) {
    item.detail = 'DecisionGraph details';
    item.documentation = 'DecisionGraph documentation';
  } else if (item.data === 3) {
    item.detail = 'PolicySpace details';
    item.documentation = 'PolicySpace documentation';
  }
  return item;
 }