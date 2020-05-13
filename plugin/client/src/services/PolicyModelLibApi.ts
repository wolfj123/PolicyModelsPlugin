const axios = require('axios');
axios.defaults.timeout = 10000;
const SUCCESS = "true";
const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}`;
import * as path from 'path';



const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

export class PolicyModelLibApi {
  _rootPath: string;
  child: any;


  constructor(rootPath) {
    this._rootPath = rootPath;
    this.child;
  }

  async _buildEnvironment() {
    let isSucceed: boolean = true;
    isSucceed = isSucceed && await this._startServer();
    isSucceed = isSucceed && await this._loadModel();
    this.terminateProcess();
    return isSucceed;
  }

  async _startServer() {
    const JavaServerJar: string = path.join(__dirname, "/../../../cli/LibServiceApp.jar");
    this.child = require('child_process').spawn(
      'java', ['-jar', `${JavaServerJar}`,null]
    );

  const serverIsReady = await new Promise( (resolve, reject) => {
    this.child.stdout.on('data', data => {
        const message:string = data.toString();
        message === 'ready\n' ?
         resolve():
         this.printToScreen(message);
      });

      this.child.stderr.on("data", data =>  {
            console.log(data.toString());
            this.terminateProcess();
        });
  });

    return true;
  }

  async _loadModel(){
    return await axiosInstance.get(`/load?${this._rootPath}`).then((res) => {
      return res.data === SUCCESS;
    });
  }

  async createNewLocalization(name: string): Promise<boolean> {
    return await this._loadModel().then((isSucceed: boolean) =>
      isSucceed ?
        axiosInstance.get(`/loc/new?${name}`).then((res: string) => res == 'true') :
        false);
  }

  printToScreen(message:string): void {
    console.log(message);
  }

  terminateProcess(): void {
    this.child.kill('SIGINT');

  }
}
