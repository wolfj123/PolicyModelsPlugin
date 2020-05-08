var fs = require('fs');

export default class FileService {
  getDirectoryContent(dirPath) {
    let direntFiles;
    try {
      direntFiles = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch (err) {
      throw Error('Cannot read directory on path ' + dirPath);
    }
    return direntFiles;
  }

  writeToFile(path, newData) {
    try {
      fs.writeFileSync(path, newData);
    } catch (err) {
      throw new Error('Cant write to File: ' + path);
    }
  }

  readFromFile(path) {
    try {
      const content = fs.readFileSync(path, 'utf8');
      return content;
    } catch (e) {
      throw new Error(`Cannot read file ${path}`);
    }
  }
}
