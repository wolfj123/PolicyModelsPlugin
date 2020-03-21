class currnetFileState {
	private lines: string[];
	private fileUri: string;

	public constructor(fileUri:string, content: string) {
		this.lines = content.split(/\r?\n/);
		this.fileUri = fileUri;
	}

	public getWordAt(lineNumber: number, charPos: number): string {
		let str = this.lines[lineNumber];
		let pos = charPos >>> 0;
		// Search for the word's beginning and end.
		let left = str.slice(0, pos + 1).search(/\S+$/);
		let right = str.slice(pos).search(/\s/);
		// The last word in the string is a special case.
		if (right < 0) {
			return str.slice(left);
		}

		// Return the word, using the located bounds to extract it from the string.
		return str.slice(left, right + pos);
	}

	//todo update contents

}