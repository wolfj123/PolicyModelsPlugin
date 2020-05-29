var fs = require('fs');

export default class FileService {
  static getDirectoryContent(dirPath) {
    let direntFiles;
    try {
      direntFiles = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch (err) {
      throw Error('Cannot read directory on path ' + dirPath);
    }
    return direntFiles;
  }

  static writeToFile(path, newData) {
    try {
      fs.writeFileSync(path, newData);
    } catch (err) {
      throw new Error('Cant write to File: ' + path);
    }
  }

  static readFromFile(path) {
    try {
      const content = fs.readFileSync(path, 'utf8');
      return content;
    } catch (e) {
      throw new Error(`Cannot read file ${path}`);
    }
  }

  static isFolderExist(path: string): boolean {
    return fs.existsSync(path);
  }
}
