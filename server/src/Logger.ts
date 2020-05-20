import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { FileTransportInstance } from 'winston/lib/winston/transports';

const logFolder:string = 'Logs/'
const serverLogFileName:string =   'serverLog.log';
const serverHttpFileName: string =  'serverHttp.log';
const documentsFileName: string = 'documents.log'
const parserFileName: string = 'parser.log'

export enum logSources {
	server = 0,
	serverHttp = 1,
	documents = 2,
	parser = 3
}

const allLogs: {source: logSources, name: string} [] =[
	{
		source:logSources.server,
		name:serverLogFileName
	},
	{
		source:logSources.serverHttp,
		name:serverHttpFileName
	},
	{
		source:logSources.documents,
		name:documentsFileName
	},
	{
		source:logSources.parser,
		name:parserFileName
	},
]

let allLoggers: {source: logSources, log: Logger} [] = [];

const printFormat = winston.format.printf(({ level, message, timestamp}) => {
	return `${timestamp} ${level}: ${message}`;
  });

const logsFormat = winston.format.combine(
	winston.format.timestamp(),
	printFormat
)

let globalLog: winston.Logger = undefined;

export function getLogger(source: logSources): Logger {
	let logger = allLoggers.find(curr => curr.source === source);
	if (logger === undefined){
		globalLog.error(`requested bad Logger ${source}`);
		return globalLog;
	}
	return logger.log;
}

export function initLogger(pluginDir: string): void {
	
	if (globalLog === undefined){
		try {
			fs.unlinkSync(path.join(pluginDir, logFolder,"globalLog.log"));
		}catch (err){
			console.log(`this should show \n` + err);
		}

		let fileForLog: FileTransportInstance = new winston.transports.File({filename: path.join(pluginDir, logFolder,"globalLog.log")});
		globalLog = winston.createLogger({
			level:'info',
			format: winston.format.combine(
				winston.format.timestamp(),
				printFormat
			),
			exitOnError: false,
			transports: [
				fileForLog,
				//new winston.transports.Console({ handleExceptions: true })
			]
		});

		globalLog.info(`the plugin dir is: ${pluginDir}`);
	}

	// globalLog.add(new winston.transports.File({
	// 	filename:  path.join(pluginDir, logFolder,"unhandeled_exceptions.log"),
	// 	handleExceptions: true
	// }))

	allLogs.forEach(currLog => {
		try {
			fs.unlinkSync(path.join(pluginDir,logFolder,currLog.name));
		} catch (error) {
			globalLog.error(`can't delete log ${currLog.name}, error msg: ${error}`);
		}

		allLoggers.push({
			source:currLog.source,
			log: new Logger1(currLog.source, currLog.name,pluginDir)
		});
	});
	
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
	
	constructor(source: logSources, fileName: string,pluginDir:string){
		this._type = source;

		this._log = winston.createLogger({
			level: source !== logSources.serverHttp ? 'info' : 'http',
			format: logsFormat,
			transports:[
				//new winston.transports.Console (),
				new winston.transports.File({filename: path.join(pluginDir,logFolder,fileName)})]
		})
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