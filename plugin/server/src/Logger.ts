import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

/*
  interface LoggerOptions {
    levels?: Config.AbstractConfigSetLevels;
    silent?: boolean;
    format?: logform.Format;
    level?: string;
    exitOnError?: Function | boolean;
    defaultMeta?: any;
    transports?: Transport[] | Transport;
    exceptionHandlers?: any;
  }

*/

const logFolder:string = 'Logs/'
const serverLogFileName:string =   'serverLog.log';
const serverHttpFileName: string =  'serverHttp.log';
const documentMangerFileName: string = 'documents.log'
const parserFileName: string = 'parser.log'

export enum logSources {
	server = 0,
	serverHttp = 1,
	documents = 2,
	parser = 3
}

const allLogs: {[id:number]: string}={
	 0:	serverLogFileName,
	 1: serverHttpFileName,
	 2: documentMangerFileName,
	 3: parserFileName
}

const printFormat = winston.format.printf(({ level, message, timestamp}) => {
	return `${timestamp} ${level}: ${message}`;
  });

const logsFormat = winston.format.combine(
	winston.format.timestamp(),
	printFormat
)

let globalLog: winston.Logger = undefined;

export function initLogger(source: logSources, pluginDir: string): Logger {	
	if (globalLog === undefined){
		try {
			fs.unlinkSync
		}catch (err){
			console.log(err);
		}
		globalLog = winston.createLogger({
			level:'info',
			format: winston.format.combine(
				winston.format.timestamp(),
				printFormat
			),
			transports: [new winston.transports.File({filename: path.join(pluginDir, logFolder,"globalLog.log")})]
		});

		globalLog.info(`the plugin dir is: ${pluginDir}`);
	}

	//delete old Log
	try {
		fs.unlinkSync(path.join(pluginDir,logFolder,allLogs[source]));
	} catch (error) {
		globalLog.error(`can't delet log ${source.toString()}`);
	}
	
	return new Logger1(source,pluginDir);
}

export interface Logger {
	error (msg: string, moreData?: any);
	warn (msg: string, moreData?: any);
	info (msg: string, moreData?: any);
	/**
	 * this log is only for writing the requests info sent between the client and server
	 */
	http (funcName:string, funcParmas?: any);
}

class Logger1 implements Logger {
	private _log: winston.Logger;
	private _type: logSources;
	
	constructor(source: logSources, pluginDir:string){
		this._type = source;
		let fileName: string = allLogs[source];
		
		if (fileName === undefined) {
			globalLog.error(`can't find the requeseted log type: ${source.toString()}`);
			return;
		}

		this._log = winston.createLogger({
			level: source !== logSources.serverHttp ? 'info' : 'http',
			format: logsFormat,
			transports:[
				new winston.transports.Console (),
				new winston.transports.File({filename: fileName})]
		})

		console.log('created logs in: ' + fileName);
	}

	async error (msg: string, moreData?: any){
		setTimeout(()=>{
			this._log.error(`${msg}\ndata:\n${JSON.stringify(moreData)}`);
			globalLog.error(`[${this._type.toString()}]  ${msg}\ndata:\n${JSON.stringify(moreData)}`);
		},0);
	}

	async warn (msg: string, moreData?: any){
		setTimeout(()=>{
			this._log.warn(`${msg}\ndata:\n${JSON.stringify(moreData)}`);
			globalLog.warn(`[${this._type.toString()}]  ${msg}\ndata:\n${JSON.stringify(moreData)}`);
		},0);
	}

	async info (msg: string, moreData?: any){
		setTimeout(()=>{
			this._log.info(`${msg}\ndata:\n${JSON.stringify(moreData)}`);
			globalLog.info(`[${this._type.toString()}]  ${msg}\ndata:\n${JSON.stringify(moreData)}`);
		},0);
	}

	async http (funcName:string, funcParmas?: any){
		setTimeout(()=>{
			this._log.http(`${funcName}\ndata: ${JSON.stringify(funcParmas)}\n`)
		}, 0);
	}
}