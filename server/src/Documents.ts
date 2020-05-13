import { DocumentUri,
		 Range,
		 Position,
		 TextDocumentContentChangeEvent,
		 TextDocumentItem
		} from 'vscode-languageserver';
import { languagesIds, newRange } from './Utils';
import { getLogger, logSources } from './Logger';


export interface changeInfo{
	oldRange: Range,
	newRange: Range
}

export interface PMTextDocument {
    /**
     * The associated URI for this document. Most documents have the __file__-scheme, indicating that they
     * represent files on disk. However, some documents may have other schemes indicating that they are not
     * available on disk.
     *
     * @readonly
     */
    readonly uri: DocumentUri;
    /**
     * The identifier of the language associated with this document.
     *
     * @readonly
     */
    readonly languageId: languagesIds;
    /**
     * The version number of this document (it will increase after each
     * change, including undo/redo).
     */
    version: number;
    /**
     * Get the text of this document. A substring can be retrieved by
     * providing a range.
     *
     * @param range (optional) An range within the document to return.
     * If no range is passed, the full content is returned.
     * Invalid range positions are adjusted as described in [Position.line](#Position.line)
     * and [Position.character](#Position.character).
     * If the start range position is greater than the end range position,
     * then the effect of getText is as if the two positions were swapped.

     * @return The text of this document or a substring of the text if a
     *         range is provided.
     */
    getText(range?: Range): string;
    /**
     * Converts a zero-based offset to a position.
     *
     * @param offset A zero-based offset.
     * @return A valid [position](#Position).
     */
    positionAt(offset: number): Position;
    /**
     * Converts the position to a zero-based offset.
     * Invalid positions are adjusted as described in [Position.line](#Position.line)
     * and [Position.character](#Position.character).
     *
     * @param position A position.
     * @return A valid zero-based offset.
     */
    offsetAt(position: Position): number;
    /**
     * The number of lines in this document.
     *
     * @readonly
     */
	readonly lineCount: number;

	/**
	 * @param other 
	 * @returns true if both files have identical infromation
	 */
	isEqual(other:PMTextDocument): boolean;

	/**
	 * updates file text and version according to changes
	 * this supports both incremental and full change
	 * @param changes array of changes
	 * @param version version to set to file after change
	 * @returns array of the ranges of the changed text, this is array of the new text range, not the old
	 */
	update(changes: TextDocumentContentChangeEvent[], version: number): changeInfo[];

	/**
	 * array of the last changes range made to the file
	 */
	lastChanges: changeInfo[]
}

class FullTextDocument implements PMTextDocument {

	private _uri: DocumentUri;
	private _languageId: languagesIds;
	private _version: number;
	private _content: string;
	private _lineOffsets: number[] | undefined; // only use getter for this, this value is lazy
	private _lastChanges: changeInfo[];

	public constructor(uri: DocumentUri, languageId: languagesIds, version: number, content: string) {
		this._uri = uri;
		this._languageId = languageId;
		this._version = version;
		this._content = content;
		this._lineOffsets = undefined;
		this._lastChanges = [];
	}

	public get lastChanges(): changeInfo[] {
		return this._lastChanges;
	}

	public get uri(): string {
		return this._uri;
	}

	public get languageId(): languagesIds {
		return this._languageId;
	}

	public get version(): number {
		return this._version;
	}

	public set version(version: number){
		this._version = version;
	}

	public getText(range?: Range): string {
		if (range) {
			const start = this.offsetAt(range.start);
			const end = this.offsetAt(range.end);
			return this._content.substring(start, end);
		}
		return this._content;
	}

	public update(changes: TextDocumentContentChangeEvent[], version: number): changeInfo[] {
		let changesRange: changeInfo[] = []; // keeps all the changes Range
		for (let change of changes) {
			if (FullTextDocument.isIncremental(change)) {
				// makes sure start is before end
				const range = getWellformedRange(change.range);

				// update content
				const startOffset = this.offsetAt(range.start);
				const endOffset = this.offsetAt(range.end);
				this._content = this._content.substring(0, startOffset) + change.text + this._content.substring(endOffset, this._content.length);

				// update the offsets
				const startLine = Math.max(range.start.line, 0);
				const endLine = Math.max(range.end.line, 0);
				let lineOffsets = this._lineOffsets!;
				const addedLineOffsets = computeLineOffsets(change.text, false, startOffset);
				if (endLine - startLine === addedLineOffsets.length) { //this updates the _linesOffset array with the new values
					for (let i = 0, len = addedLineOffsets.length; i < len; i++) { // this updates in case no new lines were added and only existing lines end offset was changed
						lineOffsets[i + startLine + 1] = addedLineOffsets[i];
					}
				} else { //this is in case new lines were added or lines were removed
					if (addedLineOffsets.length < 10000) { 
						lineOffsets.splice(startLine + 1, endLine - startLine, ...addedLineOffsets);
					} else { // avoid too many arguments for splice
						this._lineOffsets = lineOffsets = lineOffsets.slice(0, startLine + 1).concat(addedLineOffsets, lineOffsets.slice(endLine + 1));
					}
				}
				const diff = change.text.length - (endOffset - startOffset);
				if (diff !== 0) { //this updates all the lines offset after the change lines
					for (let i = startLine + 1 + addedLineOffsets.length, len = lineOffsets.length; i < len; i++) {
						lineOffsets[i] = lineOffsets[i] + diff;
					}
				}
				//change.text.length + startOffset = offset of the end of change
				//addedLineOffsets this can give the new offset of lines if needed this represent all the lines that were changed
				// made longer/ shorter / added/ removed
				let newChangePosition: Range = {
					start: change.range.start,
					end: this.positionAt(change.text.length + startOffset)
				}
				changesRange.push({
					oldRange: change.range,
					newRange: newChangePosition
				});
			} else if (FullTextDocument.isFull(change)) {
				let oldRange: Range = {start: this.positionAt(0), end: this.positionAt(this._content.length) }
				this._content = change.text;
				this._lineOffsets = undefined;
				changesRange.push({
					oldRange: oldRange,
					newRange : {
					start: this.positionAt(0),
					end: this.positionAt(change.text.length)
					}
				});

			} else {
				getLogger(logSources.documents).error('wrong update type');
				return undefined;
			}
		}

		this._version = version;
		this._lastChanges = changesRange;
		return changesRange;
	}

	private getLineOffsets(): number[] {
		if (this._lineOffsets === undefined) {
			this._lineOffsets = computeLineOffsets(this._content, true);
		}
		return this._lineOffsets;
	}

	public positionAt(offset: number): Position {
		offset = Math.max(Math.min(offset, this._content.length), 0);

		let lineOffsets = this.getLineOffsets();
		let low = 0, high = lineOffsets.length;
		if (high === 0) {
			return { line: 0, character: offset };
		}
		while (low < high) {
			let mid = Math.floor((low + high) / 2);
			if (lineOffsets[mid] > offset) {
				high = mid;
			} else {
				low = mid + 1;
			}
		}
		// low is the least x for which the line offset is larger than the current offset
		// or array.length if no line offset is larger than the current offset
		let line = low - 1;
		return { line, character: offset - lineOffsets[line] };
	}

	public offsetAt(position: Position) {
		let lineOffsets = this.getLineOffsets();
		if (position.line >= lineOffsets.length) {
			return this._content.length;
		} else if (position.line < 0) {
			return 0;
		}
		let lineOffset = lineOffsets[position.line];
		let nextLineOffset = (position.line + 1 < lineOffsets.length) ? lineOffsets[position.line + 1] : this._content.length;
		return Math.max(Math.min(lineOffset + position.character, nextLineOffset), lineOffset);
	}

	public get lineCount(): number {
		return this.getLineOffsets().length;
	}

	private static isIncremental(event: TextDocumentContentChangeEvent): event is { range: Range; rangeLength?: number; text: string; } {
		let candidate: { range: Range; rangeLength?: number; text: string; } = event as any;
		return candidate !== undefined && candidate !== null &&
			typeof candidate.text === 'string' && candidate.range !== undefined &&
			(candidate.rangeLength === undefined || typeof candidate.rangeLength === 'number');
	}

	private static isFull(event: TextDocumentContentChangeEvent): event is { text: string; } {
		let candidate: { range?: Range; rangeLength?: number; text: string; } = event as any;
		return candidate !== undefined && candidate !== null &&
			typeof candidate.text === 'string' && candidate.range === undefined && candidate.rangeLength === undefined;
	}

	public isEqual(other:PMTextDocument): boolean {
		if (! (other instanceof FullTextDocument)) {
			return false;
		}

		if (this._uri !== other._uri || this._version !== other.version || this._languageId !== other._languageId || 
			this.getLineOffsets() !== other.getLineOffsets() || this._content !== other._content ) {
				return false;
		}

		return true;
	}
}



const enum CharCode {
	/**
	 * The `\n` character.
	 */
	LineFeed = 10,
	/**
	 * The `\r` character.
	 */
	CarriageReturn = 13,
}

function computeLineOffsets(text: string, isAtLineStart: boolean, textOffset = 0): number[] {
	const result: number[] = isAtLineStart ? [textOffset] : [];
	for (let i = 0; i < text.length; i++) {
		let ch = text.charCodeAt(i);
		if (ch === CharCode.CarriageReturn || ch === CharCode.LineFeed) {
			if (ch === CharCode.CarriageReturn && i + 1 < text.length && text.charCodeAt(i + 1) === CharCode.LineFeed) {
				i++;
			}
			result.push(textOffset + i + 1);
		}
	}
	return result;
}

function getWellformedRange(range: Range): Range {
	const start = range.start;
	const end = range.end;
	if (start.line > end.line || (start.line === end.line && start.character > end.character)) {
		return { start: end, end: start };
	}
	return range;
}




// export function createNewTextDocument(uri: string, languageId: languagesIds, version: number, content: string): PMTextDocument;
// export function createNewTextDocument(uri: string, languageId: string, version: number, content: string): PMTextDocument;
export function createNewTextDocument(uri: string, languageId: any, version: number = - 1, content: string = ""): PMTextDocument {
	if (typeof languageId === 'string') {
		return new FullTextDocument(uri, languagesIds[languageId],version, content);
	}else{
		return new FullTextDocument(uri, languageId,version, content);
	}
}

export function createFromTextDocumentItem (textDocument: TextDocumentItem): PMTextDocument {
	return createNewTextDocument(textDocument.uri,languagesIds[textDocument.languageId],textDocument.version,textDocument.text);
}

