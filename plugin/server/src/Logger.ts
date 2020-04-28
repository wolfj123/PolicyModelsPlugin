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
const clinetLogFileName:string = 'clientLog.log';
const serverLogFileName:string =   'serverLog.log';
const clientHttpFileName: string =  'clientHttp.log';
const serverHttpFileName: string =  'serverHttp.log';
const globalErrosFileName: string =  'allErrors.log';
const combinedLogFileName: string =  'combinedLog.log';

const allLogs = [
	clinetLogFileName, serverLogFileName, clientHttpFileName, serverHttpFileName, globalErrosFileName, combinedLogFileName
]

const printFormat = winston.format.printf(({ level, message, timestamp}) => {
	return `${timestamp} ${level}: ${message}`;
  });

const labelPrintFomrat = winston.format.printf (({ level, message, label, timestamp }) => {
	return `${timestamp} [${label}] ${level}: ${message}`;
  });

const globalFormat = winston.format.combine(
	winston.format.timestamp(),
	printFormat
)

export enum logSources {
	client,
	server,
	clientHttp,
	serverHttp
}

let globalErros: winston.Logger; 

let combinedLog: winston.Logger;



export function initLogger(source: logSources, pluginDir: string): Logger {
	allLogs.forEach( currLog => {
		try {
			fs.unlinkSync(path.join(pluginDir, logFolder, currLog));
		}catch (err){
			console.log(err);
		}
	})
	
	// globalErros = winston.createLogger({
	// 	level: 'error',
	// 	format: globalFormat,
	// 	transports: [
	// 		new winston.transports.File({filename: globalErrosFileName})
	// 	]
	// });
	// combinedLog= winston.createLogger({
	// 	level: 'info',
	// 	transports: [
	// 		new winston.transports.File({filename: combinedLogFileName})
	// 	]
	// });

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
	
	constructor(source: logSources, pluginDir:string){
		let fileName:string;
		switch (source){
			case logSources.client:
				fileName = path.join(pluginDir,logFolder, clinetLogFileName);
				break;
			case logSources.server:
				fileName = path.join(pluginDir,logFolder, serverLogFileName);
				break;
			case logSources.clientHttp:
				fileName = path.join(pluginDir,logFolder, clientHttpFileName);
				break;
			case logSources.serverHttp:
				fileName = path.join(pluginDir,logFolder, serverHttpFileName);
				break;
		}


		this._log = winston.createLogger({
			level: (source === logSources.client || source === logSources.server ) ? 'info' : 'http',
			format: globalFormat,
			transports:[
				new winston.transports.Console (),
				new winston.transports.File({filename: fileName})]
		})

		console.log('created logs in: ' + fileName);

	}

	async error (msg: string, moreData?: any){
		setTimeout(()=>{
			this._log.error(`${msg}\ndata:\n${JSON.stringify(moreData)}`);
			globalErros.error(`${msg}\ndata:\n${JSON.stringify(moreData)}`);
			combinedLog.info(`${msg}\ndata:\n${JSON.stringify(moreData)}`);
		},0);
	}

	async info (msg: string, moreData?: any){
		setTimeout(()=>{
			this._log.info(`${msg}\ndata:\n${JSON.stringify(moreData)}`);
			combinedLog.info(`${msg}\ndata:\n${JSON.stringify(moreData)}`);
		},0);
	}

	async warn (msg: string, moreData?: any){
		setTimeout(()=>{
			this._log.warn(`${msg}\ndata:\n${JSON.stringify(moreData)}`);
			combinedLog.warn(`${msg}\ndata:\n${JSON.stringify(moreData)}`);
		},0);
	}

	async http (funcName:string, funcParmas?: any){
		setTimeout(()=>{
			this._log.http(`${funcName}\ndata: ${JSON.stringify(funcParmas)}\n`)
		}, 0);
	}
}