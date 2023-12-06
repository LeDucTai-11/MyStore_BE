import * as winston from 'winston';
const { combine, timestamp, json } = winston.format;

const consoleTransport: winston.transport = new winston.transports.Console();
export const logger = winston.createLogger({
  format: combine(timestamp(), json({ space: 1 })),
  transports: [consoleTransport],
});
