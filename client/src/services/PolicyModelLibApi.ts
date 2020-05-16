const axios = require('axios');
axios.defaults.timeout = 10000;
const SUCCESS = true;
const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}`;
import * as path from 'path';
import { ChildProcess } from 'child_process';




const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

export class PolicyModelLibApi {
  _rootPath: string;
  child: ChildProcess;
  _printToScreenCallback: any;

  constructor(rootPath,printToScreenCallback) {
    this._rootPath = rootPath;
    this._printToScreenCallback = printToScreenCallback;
    this.child;
  }

  async _buildEnvironment() {
    let isSucceed: boolean = true;
    isSucceed = isSucceed && await this._startServer();
    isSucceed = isSucceed && await this._loadModel();
    return isSucceed;
  }

  async _startServer(): Promise<boolean> {
    const JavaServerJar: string = path.join(__dirname, "/../../../cli/LibServiceApp.jar");
    this.child = require('child_process').spawn(
      'java', ['-jar', `${JavaServerJar}`,null]
    );

  const serverIsReady = async (): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      this.child.stdout.on('data', data => {
        const message:string = data.toString();
        message === 'ready' ?
         resolve(true):
         this.printToScreen(message);
      });

      this.child.stderr.on("data", data =>  {
            this.printToScreen(data.toString());
            this.terminateProcess();
            resolve(false);

        });
    });
};

    return  await serverIsReady();
  }

  async _loadModel(){
    return await axiosInstance.get(`/load?${this._rootPath}`).then((res:any ) => {
      return res.data === SUCCESS;
    });
  }

  async createNewLocalization(name: string): Promise<boolean> {
    const buildSucceeded = await this._buildEnvironment();
    let isCreateLocalizationSucceeded = false;
    if(buildSucceeded){
      isCreateLocalizationSucceeded =  await axiosInstance.get(`/loc/new?${name}`).then((res: any) => res.data === SUCCESS);
    }
    return isCreateLocalizationSucceeded;
  }

  printToScreen(message:string): void {
    this._printToScreenCallback(message);
  }

  terminateProcess(): void {
    this.child.kill('SIGINT');
  }
}
