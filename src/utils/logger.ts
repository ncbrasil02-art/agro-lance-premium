 type LogLevel = 'info' | 'warn' | 'error' | 'debug';
 
 interface LogData {
   message: string;
   level: LogLevel;
   timestamp: string;
   context?: Record<string, any>;
 }
 
 class Logger {
   private static instance: Logger;
 
   private constructor() {}
 
   public static getInstance(): Logger {
     if (!Logger.instance) {
       Logger.instance = new Logger();
     }
     return Logger.instance;
   }
 
   private log(level: LogLevel, message: string, context?: Record<string, any>) {
     const data: LogData = {
       message,
       level,
       timestamp: new Date().toISOString(),
       context,
     };
 
     const formattedMessage = `[${data.timestamp}] [${data.level.toUpperCase()}] ${data.message}`;
 
     switch (level) {
       case 'error':
         console.error(formattedMessage, context || '');
         break;
       case 'warn':
         console.warn(formattedMessage, context || '');
         break;
       case 'debug':
         console.debug(formattedMessage, context || '');
         break;
       default:
         console.info(formattedMessage, context || '');
         break;
     }
   }
 
   public info(message: string, context?: Record<string, any>) {
     this.log('info', message, context);
   }
 
   public warn(message: string, context?: Record<string, any>) {
     this.log('warn', message, context);
   }
 
   public error(message: string, context?: Record<string, any>) {
     this.log('error', message, context);
   }
 
   public debug(message: string, context?: Record<string, any>) {
     this.log('debug', message, context);
   }
 }
 
 export const logger = Logger.getInstance();