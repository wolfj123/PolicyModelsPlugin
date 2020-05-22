const axios = require('axios');
const SUCCESS = true;
const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}`;
import * as path from 'path';
import { ChildProcess } from 'child_process';

// import * as axios from 'axios';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 1500,
});

export default class PolicyModelLibApi {
  _rootPath: string;
  child: ChildProcess;
  _printToScreenCallback: any;
  private static instance: PolicyModelLibApi;

  private constructor(rootPath: string, printToScreenCallback?: any) {
    this._rootPath = rootPath;
    this._printToScreenCallback = printToScreenCallback;
    this.child = null;
  }

  static buildInstance(rootPath?: string, printToScreenCallback?: any){
    PolicyModelLibApi.instance = new PolicyModelLibApi(rootPath, printToScreenCallback);
  }

  static getInstance(rootPath?: string, printToScreenCallback?: any): PolicyModelLibApi {
    if (!PolicyModelLibApi.instance) {
        throw new Error("Initialized instance does not exists");
    }
    return PolicyModelLibApi.instance;
  }

  async _buildEnvironment(loadModel:boolean) {
    let isSucceed: boolean = true;
    isSucceed = isSucceed && await this._startServer();
    if (loadModel){
      isSucceed = isSucceed && await this._loadModel();
    }
    return isSucceed;
  }

  async _startServer(): Promise<boolean> {
    const JavaServerJar: string = path.join(__dirname, "/../../../cli/LibServiceApp.jar");
    this.child = require('child_process').spawn(
      'java', ['-jar', `${JavaServerJar}`, null]
    );

    const serverIsReady = async (): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        this.child.stdout.on('data', data => {
          const message: string = data.toString();
          message === 'ready' ?
            resolve(true) :
            this._printToScreen(message);
        });

        this.child.stderr.on("data", data => {
          this._printToScreen(data.toString());
          this._terminateProcess();
          resolve(false);

        });
      });
    };

    return await serverIsReady();
  }


  async _loadModel() {
    return await axiosInstance.get(`/load?path=${this._rootPath}`).then((res: any) => {
      return res.data === SUCCESS;
    }).catch(this._handleConnectionRejection);
  }
  _printToScreen(message: string): void {
    this._printToScreenCallback(message);
  }

  _handleConnectionRejection(err: any): void {
    this._printToScreen(err.message);
  }

  _terminateProcess(): void {
    this.child.kill('SIGINT');
  }

  async _createNewLocalization(name: string): Promise<boolean> {
    return await axiosInstance.get(`/loc/new?name=${name}`).then((res: any) => res.data === SUCCESS).catch(this._handleConnectionRejection);
  }

  async _requestsWrapper(loadModel: boolean,requestCallback) {
    const buildSucceeded = await this._buildEnvironment(loadModel);
    let requestAnswer = false;
    if (buildSucceeded) {
      requestAnswer = await requestCallback();
    }
    this._terminateProcess();
    return requestAnswer;
  }


  setPrintToScreenCallback(callback) {
    this._printToScreenCallback = callback;
  }

  async createNewLocalization(name: string): Promise<boolean> {
    return await this._requestsWrapper(true, () => this.createNewLocalization(name));
  }

  public async createNewModel(){
    // return await this._requestsWrapper(false, () => {this._createNewModel()});

  }

  public async _createNewModel(par){
    // return await axiosInstance.get(`/loc/new?name=${name}`).then((res: any) => res.data === SUCCESS).catch(this._handleConnectionRejection);
    await axiosInstance.post(`/newModel`,JSON.stringify(par))
    .then(ans=>{
      console.log("success", ans);

    })
    .catch(rej=>{
      console.log(`new model rejected from server\n\n ${rej}\n\n`);

    });
    
  }


}

export interface newModleRequest {
  modelName: string,
  modelPath: string,
  dgFileName: string,
  psFileName: string,
  rootSlot: string,
  AuthorsInfo: {
    personOrGroup: string,
    AuthorName: string,
    authorContact: string
  }[]
}


