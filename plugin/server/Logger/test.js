let winston = require('winston');

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
const clinetLogFileName = 'clientLog.log';
const serverLogFileName = 'serverLog.log';
const globalErrosFileName = 'allErrors.log';
const combinedLogFileName = 'combinedLog.log';
const globalFormat = winston.format.combine(
	winston.format.timestamp(),
	winston.format.prettyPrint({depth: 10, colorize:true}),	
)

const client = 0;

let globalErros = winston.createLogger({
	level: 'error',
	format: globalFormat,
	transports: [
		new winston.transports.File({filename: globalErrosFileName})
	]
});

let combinedLog = winston.createLogger({
	level: 'info',
	transports: []
});



function initLogger(source) {
	return new myLogger(source);
}

class myLogger {
	_initialized = false;
	_log;

	
	constructor(source){
		this._log = winston.createLogger({
			level: 'info',
			transports:[
				new winston.transports.File({
					filename: source === client ? clinetLogFileName : serverLogFileName
				})]
		})

		this._initialized = true;
	}

	async error (msg, moreData){
		if (! this._initialized){
			//write to global log
		}
	}

	async info (msg, moreData){
		if (! this._initialized){
			//write to global log
		}
		this._log.log('info',msg + "\ndata:\n"+ JSON.stringify(moreData));
	}

	async warn (msg, moreData){
		if (! this._initialized){
			//write to global log
		}
		this._log.log('warn',msg + "\ndata:\n"+ JSON.stringify(moreData));
	}

	async http (msg, moreData){
		if (! this._initialized){
			//write to global log
		}
		this._log.log('http',msg + "\ndata:\n"+ JSON.stringify(moreData));
	}
}

// console.log("start");


// let test = initLogger(client);

// test.info("test 1");
// test.warn("warn 1");
// test.error("error 1");
// test.info("test 2");
// test.warn("warn 2");
// test.error("error 2");
// test.info("test 3");
// test.warn("warn 3");
// test.error("error 3");

// console.log("end");

const printFormat = winston.format.printf(({ level, message, timestamp, data}) => {
	return `${timestamp} ${level}: ${message} \n ${JSON.stringify(data)}`;
  });

logger = winston.createLogger({
	format: winston.format.combine(
		winston.format.timestamp(),
		printFormat
	),
	transports: [
	  new (winston.transports.Console) (),
	  new (winston.transports.File) ({filename: 'test.log'})
	]
  });
  
  //logger.log('info','Hello world',"aaaa");
  logger.info("hello world",["x"])