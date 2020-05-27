const axios = require('axios');
const SUCCESS = true;
// const BASE_URL = `http://localhost:${PORT}`;
import * as path from 'path';
import { ChildProcess } from 'child_process';

// import * as axios from 'axios';
 
let axiosInstance;// axios.AxiosInstance;


const createAxiosInstace = async (url: string):Promise<any> =>{
  axiosInstance = axios.create({
    baseURL: url,
    timeout: 2000,
  });
  await axiosInstance.interceptors.request.use(function (config) {
    config.url = config.url.replace(/\\/g, '/');
    return config;
  }, function (error) {
    return Promise.reject(error);
  });
}

export default class PolicyModelLibApi {
  _rootPath: string;
  child: ChildProcess;
  _printToScreenCallback: any;
  private static instance: PolicyModelLibApi;

  private constructor(rootPath: string, printToScreenCallback?: any) {
    this._rootPath = rootPath.replace(/\\/g, '/');
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
    const JavaServerJar: string = path.join(__dirname, "/../../../cli/LibServiceApp.jar")

    this.child = require('child_process').spawn(
      //  `java`,[`-agentlib:jdwp=transport=dt_socket,address=*:8080,server=y,suspend=n`,`-jar`, JavaServerJar] // for debugging the server,
      'java', ['-jar', `${JavaServerJar}`, null]
    );

    const serverIsReady = async (): Promise<boolean> => {
      return new Promise<boolean>((resolve,reject) => {
        this.child.stdout.on('data', data => {
          const message: string = data.toString();
          if (message.startsWith('ready')){
            let port = message.substring('ready -port:'.length)
            createAxiosInstace(`http://localhost:${port}`)
            .catch(rejAns => reject(false));

            resolve(true);
          }
        });

        this.child.stderr.on("data", data => {
          this._printToScreen(data.toString());
          this._terminateProcess();
          reject(false);
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

  async _requestsWrapper(loadModel: boolean,requestCallback): Promise<any> {
    let myInstance = this;
    const buildSucceeded = await this._buildEnvironment(loadModel);

    const ans: Promise<any> = new Promise(async (res,rej) =>{
      let requestAnswer = false;
      if (buildSucceeded) {
        requestAnswer = await requestCallback()
        .then(resolveAns =>{
          myInstance._terminateProcess();
          res(resolveAns);
        })
        .catch(rejectAns =>{
          myInstance._terminateProcess();
          return rej(rejectAns);
        });
      }else{
        return rej(requestAnswer);
      }
    });

    return await ans;
  }
  async _visualizePolicySpace(outputPath: string, graphvizDot:string): Promise<boolean> {
    return await axiosInstance.get(`/visualize-ps?outputPath=${outputPath}&dotPath=${graphvizDot}`)
    .then((res: any) => res.data === SUCCESS)
    .catch(rej => this._handleConnectionRejection);
  }

  async _visualizeDecisionGraph(outputPath: string, graphvizDot:string): Promise<boolean> {
    return await axiosInstance.get(`/visualize-dg?outputPath=${outputPath}&dotPath=${graphvizDot}`)
    .then((res: any) => res.data === SUCCESS)
    .catch(rej => this._handleConnectionRejection);
  }

  setPrintToScreenCallback(callback) {
    this._printToScreenCallback = callback;
  }

  async createNewLocalization(name: string): Promise<boolean> {
    return await this._requestsWrapper(true, () => this._createNewLocalization(name));
  }

  public async createNewModel():Promise<string> {
    const JavaServerJar: string = path.join(__dirname, "/../../../cli/LibServiceApp.jar");
    let childProcess = require('child_process').spawn(
      'java', ['-jar', JavaServerJar, "new"]
    );

    const myInstance = this;
    
    const ans:Promise<string> = new Promise((res,rej)=>{
      childProcess.stdout.on('data',async  function(data) {
        const newModelAns: string = "res---new---"
        const cancelModelAns: string = "res---cancel---"
        let newModelDataAns:string = (data.toString());
        if (newModelDataAns.startsWith(newModelAns)){
          let modelInfo:string = newModelDataAns.substring(newModelAns.length).trim();
          // return res(myInstance._requestsWrapper(false, () => myInstance._createNewModel(modelInfo)));
          let modelCreationAns: Promise<string> = myInstance._requestsWrapper(false, () => myInstance._createNewModel(modelInfo));
          // let modelCreationAns: Promise<string> = myInstance._createNewModel(modelInfo);
          modelCreationAns.then(resAns=>{
            res(resAns);
          })
          .catch(rejAns=>{
            rej(rejAns);
          });

        }else{
          return rej("Canceled model creation");
        }
      });


      childProcess.stderr.on("data", function (data) {
        console.log(data.toString());
        return rej("Error in model creation");
      });
    });
    // return await this._requestsWrapper(false, () => {this._createNewModel()});

    return ans;
  }

  public async _createNewModel(par): Promise<string> {
    // return await axiosInstance.get(`/loc/new?name=${name}`).then((res: any) => res.data === SUCCESS).catch(this._handleConnectionRejection);
    const ans:Promise<string> =  new Promise(async (resolve,reject)=>{    
    return await axiosInstance.post(`/newModel`,par)
      .then(ans=>{
        if (ans.status === 200){
          return resolve(ans.data);
        }else if (ans.status >= 500){
          return reject(`Failed to create a new model \nadditional info: ${ans.data}`);
        }else{
          return reject(`Failed to create a new model unknown error`);
        }
      })
      .catch(rej=>{
        // console.log(`new model rejected from server\n\n ${rej}\n\n`);
        return reject(`Failed to create a new model \nadditional info: ${rej.response !== undefined ? rej.response.data : rej.message}`);
      });
    });
   
    return ans;
  }

  async visualizePolicySpace(outputPath: string, graphvizDot:string): Promise<boolean> {
    return await this._requestsWrapper(true, () => this._visualizePolicySpace(outputPath, graphvizDot));
  }

  async visualizeDecisionGraph(outputPath: string, graphvizDot:string): Promise<boolean> {
    return await this._requestsWrapper(true, () => this._visualizeDecisionGraph(outputPath, graphvizDot));
  }

}
