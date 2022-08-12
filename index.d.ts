import { IncomingMessage, ServerResponse } from 'http';

export interface ServerConfig {
  port?: number;
  host?: string;
  cors?: boolean;
  serverCloseTimeout?: number;
}

export interface MethodDataSchema {
  type: string;
  description?: string;
  required?: Array<string>;
  properties?: { [property: string]: MethodDataSchema };
  items?: MethodDataSchema;
  additionalProperties?: boolean;
}

export interface MethodSchema {
  public?: boolean;
  description?: string;
  params?: MethodDataSchema;
  result?: MethodDataSchema;
  emit?: MethodDataSchema;
  roles?: Array<string>;
  transport?: 'http' | 'ws';
}

export interface ServerModule {
  schema: { [method: string]: MethodSchema };
  Module: Class<T>;
}

export interface User {
  username: string;
  password: string;
  role: string;
  createdTime: string;
}

export interface UserRole {
  role: string;
  createdTime: string;
}

export interface Session {
  username: string;
  token: string;
  createdTime: string;
}

export interface LoggerSettings {
  info: boolean;
  debug: boolean;
  warn: boolean;
  error: boolean;
  fatal: boolean;
  sql: boolean;
}

export interface LoggerMessage {
  type: string;
  message: string;
  stack?: string;
}

export interface LoggerTransport {
  log: (data: LoggerMessage) => void;
}

export interface ErrorMetaData {
  code: number;
  message: string;
  internal: string;
}

export interface DatabaseData {
  [key: string]: number | string | boolean;
}

export class Server {
  constructor(config?: ServerConfig);
  start(modules: { [name: string]: ServerModule }): void;
  close(): void;
}

export class ConnectionError extends Error {
  constructor(meta: ErrorMetaData, data: any);
  code?: number;
  data?: any;
  internal?: string;
  pass: boolean;
}

export declare namespace validator {
  function compile(schema: MethodDataSchema): (data: any) => boolean;
}

export declare namespace userService {
  function save(username: string, hashPassword: string): Promise<UserRole>;
  function getByUsername(username: string): Promise<User>;
  function updatePassword(username: string, password: string): Promise<UserRole>;
}

export declare namespace sessionService {
  function restoreSession(request: IncomingMessage): Promise<Session>;
  function startSession(request: IncomingMessage, response: ServerResponse, username: string): Promise<Session>;
  function endSession(request: IncomingMessage, response: ServerResponse): Promise<Session>;
}

export declare namespace logger {
  function setSettings(settings: LoggerSettings): void;
  function setTransport(transport: LoggerTransport): void;
  function info(...data: any[]): void;
  function debug(...data: any[]): void;
  function warn(...data: any[]): void;
  function sql(...data: any[]): void;
  function error(error: Error): void;
  function fatal(error: Error): void;
}

export declare namespace database {
  function query(text: string, params: Array<any>): Promise<any[]>;
  function insert(table: string, data: DatabaseData, returning: Array<string>): Promise<any>;
  function select(
    table: string,
    fields: Array<string>,
    conditions: DatabaseData,
    orderFields: Array<string>,
    itemsOnPage: number,
    page: number
  ): Promise<any[]>;
  function update(
    table: string,
    delta: DatabaseData,
    conditions: DatabaseData,
    returning: Array<string>
  ): Promise<any[]>;
  function _delete(table: string, conditions: DatabaseData, returning: Array<string>): Promise<any[]>;
  export { _delete as delete, query, insert, select, update };
}
