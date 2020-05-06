var fs = require('fs');


export default class FileService {
  _onError: any;

  constructor(onError) {
    this._onError = onError;
  }

  getDirectoryContent(dirPath) {
    let direntFiles;
    try {
      direntFiles = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch (err) {
        throw Error('Cannot read directory on path '+ dirPath);
		}
	return direntFiles;
  }
}
