const axios = require('axios');
const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}`;
axios.defaults.timeout = 10000;
// var spawn = require('child_process').spawn, child;
import * as path from 'path';



const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

export class PolicyModelLibApi {
  _rootPath: string;

  constructor(rootPath) {
    this._rootPath = rootPath;
  }

  async _buildEnviroment() {
    let isSucceed: boolean = true;
    isSucceed = isSucceed && await this._startServer();

    isSucceed = isSucceed && await this._loadModel();
    return isSucceed;
  }

  _startServer() {
    const JavaServerJar: string = path.join(__dirname, "/../../../cli/JarCommunicatingTool.jar");
    var child = require('child_process').spawn(
      'java', ['-jar', `${JavaServerJar}`, 'argument to pass in']
    );
    child.stdout.on('data', function(data) {
      console.log(data.toString());
      child.kill('SIGINT');

      child.stderr.on("data", function (data) {
        console.log(data.toString());
    });
  });
    // child = spawn(`java -jar "${JavaServerJar}"`,{async:true,silent:true});
      // function (error, stdout, stderr) {
      //   console.log('stdout: ' + stdout);
      //   console.log('stderr: ' + stderr);
      //   if (error !== null) {
      //     console.log('exec error: ' + error);
      //   }
      // });
    return true;
  }

  _loadModel = () => axiosInstance.get(`/load?${this._rootPath}`).then(res => res == 'true');

  async createNewLocalization(name: string): Promise<boolean> {
    return await this._loadModel().then((isSucceed: boolean) =>
      isSucceed ?
        axiosInstance.get(`/loc/new?${name}`).then((res: string) => res == 'true') :
        false);
  }
}
