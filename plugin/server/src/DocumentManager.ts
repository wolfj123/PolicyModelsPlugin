import { TextDocument, TextDocumentContentChangeEvent, DocumentUri, TextEdit } from 'vscode-languageserver-textdocument';

/**
 * Text documnet Manager used to extend vscode-languageserver-textdocument  TextDocument
 * we have this in order to save also the changes when file changes
 */
export interface TextDocWithChanges {
	TextDocument: TextDocument,
	changes: TextDocumentContentChangeEvent[] | undefined
}

export namespace TextDocWithChanges {
	/**
	 * Creates a new text document manger object
	 * 
     * @param uri The document's uri.
     * @param languageId  The document's language Id.
     * @param version The document's initial version number.
     * @param content The document's content.
	 */
	export function create(uri: DocumentUri, languageId: string, version: number, content: string): TextDocWithChanges{
		let doc:TextDocument = TextDocument.create(uri,languageId,version,content);
		return{
			TextDocument: doc,
			changes: undefined
		}
	}

	/**
	 * 
	 * @param document document the document to update. Only documents created by DocManager.create are valid inputs.
	 * @param changes changes the changes to apply to the document.
	 * @param version document version after chage
	 * @returns The updated DocManager. Note: That's the same document manager instance passed in as first parameter.
	 */
	export function update(document: TextDocWithChanges, changes: TextDocumentContentChangeEvent[], version: number): TextDocWithChanges{
		let doc:TextDocument = TextDocument.update(document.TextDocument,changes,version);
		return{
			TextDocument: doc,
			changes: changes
		}
	}

	export function applyEdits(document: TextDocWithChanges, edits: TextEdit[]): string{
		return TextDocument.applyEdits(document.TextDocument,edits);
	}
}