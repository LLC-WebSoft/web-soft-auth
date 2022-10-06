import { IncomingMessage, ServerResponse } from 'http';

export interface ServerConfig {
  port?: number;
  host?: string;
  cors?: boolean;
  serverCloseTimeout?: number;
  secure: boolean;
  key: string | null;
  cert: string | null;
  maxPayload: number;
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

export declare class Validator {
  constructor();
  compile(schema: MethodDataSchema): (data: any) => boolean;
}

export declare class Database {
  constructor();
  query(text: string, params: Array<any>): Promise<any[]>;
  insert(table: string, data: DatabaseData, returning: Array<string>): Promise<any>;
  select(
    table: string,
    fields: Array<string>,
    conditions: DatabaseData,
    orderFields: Array<string>,
    itemsOnPage: number,
    page: number
  ): Promise<any[]>;
  update(table: string, delta: DatabaseData, conditions: DatabaseData, returning: Array<string>): Promise<any[]>;
  delete(table: string, conditions: DatabaseData, returning: Array<string>): Promise<any[]>;
}

declare class UserRepository {
  constructor();
  save(user: User, db: Database): Promise<User>;
  get(username: string, db: Database): Promise<User>;
  update(username: string, db: Database): Promise<User>;
}

export declare class UserService {
  constructor();
  userRepository: UserRepository;
  save(username: string, hashPassword: string): Promise<UserRole>;
  getByUsername(username: string): Promise<User>;
  updatePassword(username: string, password: string): Promise<UserRole>;
}

declare class SessionRepository {
  constructor();
  save(session: Session, db: Database): Promise<Session>;
  delete(token: string, db: Database): Promise<Session>;
  restore(token: string, db: Database): Promise<Session>;
}

export declare class SessionService {
  constructor();
  sessionRepository: SessionRepository;
  restoreSession(request: IncomingMessage): Promise<Session>;
  startSession(request: IncomingMessage, response: ServerResponse, username: string): Promise<Session>;
  endSession(request: IncomingMessage, response: ServerResponse): Promise<Session>;
}

export declare class Logger {
  constructor();
  transport: LoggerTransport;
  settings: LoggerSettings;
  setSettings(settings: LoggerSettings): void;
  setTransport(transport: LoggerTransport): void;
  info(...data: any[]): void;
  debug(...data: any[]): void;
  warn(...data: any[]): void;
  sql(...data: any[]): void;
  error(error: Error): void;
  fatal(error: Error): void;
}

export declare class Server {
  constructor(config?: ServerConfig);
  start(modules: { [name: string]: ServerModule }): void;
  close(): Promise<Server>;
}

export declare class ConnectionError extends Error {
  constructor(meta: ErrorMetaData, data: any);
  code?: number;
  data?: any;
  internal?: string;
  pass: boolean;
}

export declare class Sanitizer {
  constructor();
  setFilter(filter: (data: string) => string): void;
  sanitize(data: string): string;
}

export function registerError(label: string, code: number, message?: string): { code: number; message: string };

export const validator: Validator;
export const userService: UserService;
export const database: Database;
export const sessionService: SessionService;
export const logger: Logger;
export const sanitizer: Sanitizer;
