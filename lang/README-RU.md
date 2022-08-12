# web-soft-server

Пакет для создания API серверов на NodeJS. Сервер может использовать два вида транспортных протоколов: WebSocket и HTTP, поддерживает механизм подписок и простю авторизацию/аутентификацию пользователей на основе сессий. Для взаимодействия с сервером используется протокол [JSON-RPC 2.0](https://www.jsonrpc.org/specification).
<!-- =====





---TOC---





===== -->
# Содержание

- [Требования](#requirements)
- [Установка](#install)
- [Использование](#how.to.use)
- [Классы](#classes)
  - [Server](#server)
    - [new Server([config])](#new.server)
    - [server.start([modules])](#server.start)
    - [server.close()](#server.close)
  - [ConnectionError](#connection.error)
    - [new ConnectionError(meta, [data])](#new.connection.error)
    - [code](#connection.error.code)
    - [data](#connection.error.data)
    - [internal](#connection.error.internal)
    - [pass](#connection.error.pass)
  - [Client](#request.client)
    - [id](#request.client.id)
    - [user](#request.client.user)
    - [session](#request.client.session)
    - [client.emit(event, data)](#request.client.emit)
    - [client.startSession(user)](#request.client.startSession)
    - [client.deleteSession()](#request.client.deleteSession)
- [Объекты сервисы](#service.objects)
  - [validator](#validator)
    - [validator.compile(schema)](#validator.compile)
  - [userService](#user.service)
    - [userService.save(username, hashPassword)](#user.service.save)
    - [userService.getByUsername(username)](#user.service.getByUsername)
    - [userService.updatePassword(username, password)](#user.service.updatePassword)
  - [sessionService](#session.service)
    - [sessionService.restoreSession(request)](#session.service.restoreSession)
    - [sessionService.startSession(request, response, username)](#session.service.startSession)
    - [sessionService.endSession(request, response)](#session.service.endSession)
  - [logger](#logger)
    - [logger.setSettings(settings)](#logger.setSettings)
    - [logger.setTransport(transport)](#logger.setTransport)
    - [logger.info(...data)](#logger.info)
    - [logger.debug(...data)](#logger.debug)
    - [logger.warn(...data)](#logger.warn)
    - [logger.sql(...data)](#logger.sql)
    - [logger.error(error)](#logger.error)
    - [logger.fatal(error)](#logger.fatal)
  - [database](#database)
    - [database.query(text, [params])](#database.query)
    - [database.insert(table, data, [returning])](#database.insert)
    - [database.select(table[[[[, fields], conditions], orderFields], itemsOnPage, page])](#database.select)
    - [database.update(table, delta, conditions[, returning])](d#atabase.update)
    - [database.delete(table, conditions[, returning])](#database.delete)
- [Интерфейсы](#interfaces)
  - [ServerConfig](#server.config)
  - [ServerModule](#server.module)
  - [MethodSchema](#method.schema)
  - [MethodDataSchema](#method.data.schema)
  - [User](#user)
  - [UserRole](#user.role)
  - [Session](#session)
  - [LoggerSettings](#logger.settings)
  - [LoggerTransport](#logger.transport)
  - [LoggerMessage](#logger.message)
  - [ErrorMetaData](#error.meta.data)
  - [DatabaseData](#database.data)
- [Список встроенных ошибок и кодов](#errors)
- [Готовые модули](#ready.modules)
  - [AuthModule](#auth)
    - [auth.register({ username, password}, client)](#auth.register)
    - [auth.login({ username, password}, client)](#auth.login)
    - [auth.logout(data, client)](#auth.logout)
    - [auth.me(data, client)](#auth.me)
    - [auth.changePassword({username, oldPassword, newPassword}, client)](#auth.changePassword)
<!-- =====





---REQUIREMENTS---





===== -->
# Требования<a name="requirements"></a>

- Версия Node.js >= 16
- Работающий сервис PostgreSQL. И определенные переменные окружения необходимые для работы пакета [pg](https://node-postgres.com/).
- Для корректной работы авторизации и аутентификации на основе сессий структура базы данных должна соответствовать [представленной](db/structure.sql).
<!-- =====





---INSTALLATION---





===== -->
# Установка<a name="install"></a>

```
npm i web-soft-server
```
<!-- =====





---HOW OT USE---





===== -->
# Использование<a name="how.to.use"></a>

Ниже представлен пример использования пакета web-soft-server.

**index.js**

```
const { Server, logger } = require('web-soft-server');
const modules = require('./modules');

const start = async () => {
  try {
    let server = new Server(modules, { host: 'localhost', port: 80, cors: false });
  } catch (error) {
    logger.fatal(error);
  }
};

start();
```
При создании экземпляра класса Server передаём ему модули приложения, пример модуля представлен ниже, и настройки.

**modules.js**

```
class Example {
  method(data, client) {
    return "Hello!";
  }
}

module.exports = {
  example: {
    schema: {
      method: {
        description: 'Test method for example.',
        public: true,
        params: {
          description: 'Params for test method.',
          required: ['param1'],
          properties: {
            param1: {
              type: 'Number',
              description: 'Param1 is number.'
            }
          }
        }
      }
    },
    Module: Example
  }
};
```
Интерфейс модуля - [ServerModule](#server.module) представлен ниже. Каждый метод модуля получает два параметра:
- data: any
- client: [Client](#request.client)

Где data - параметры переданные клиентом серверу согласно спецификации [JSON-RPC 2.0](https://www.jsonrpc.org/specification).  
<!-- =====




---CLASSES---





===== -->
# Классы<a name="classes"></a>



## Server<a name="server"></a>

### new Server( [config: [ServerConfig](#server.config)] )<a name="new.server"></a>
Конструктор класса Server. Принимает оснонвые параметры для создания сервера.
### start( [modules?: { [name: string]: [ServerModule](#server.module) }] ) : void <a name="server.start"></a>
Метод запускает сервер. Сервер запускается согласно конфигурации и принимает как http, так и WebScoket соединения. Для работы методу передаётся объект с доступными модулями. По умолчанию сервер загружает модуль Introspection, который отдаёт клиенту схему текущего доступного API. 
### close() : void <a name="server.close"></a>
Прекращает приём входящих соединений. И прерывает текущие соединения после указанного в конфигурации интервала времени.



## ConnectionError<a name="connection.error"></a>

### new ConnectionError(meta: [ErrorMetaData](#error.meta.data)[, data: any])<a name="new.connection.error"></a>

Класс расширяет стандартный тип Error.

### code: number<a name="connection.error.code"></a>

Код ошибки. [Список встроенных ошибок и кодов.](#errors)

### data: any<a name="connection.error.data"></a>

В объект ошибки могут быть вложены дополнительные данные, необходимые для дальнейшего анализа этой ошибки. Тип данных может быть любым, так как не используется внутри пакета.

### internal: string<a name="connection.error.internal"></a>

Сообщение предназначенное исключительно для внутренних нужд сервера или анализа разработчиком. Не будет отправлено в ответе клиенту.

### pass: boolean<a name="connection.error.pass"></a>

Флаг отвечающий за отправку ошибки в ответе клиенту. По умолчанию: true. Чтобы одновременно отправить ошибку клиенту и сокрыть некоторую информацию используется свойство internal. Если свойство pass установлено в false, клиенту будет отправлено стандартное сообщение о внутренний ошибке сервера.



## Client<a name="request.client"></a>

### id: number<a name="request.client.id"></a>
Идентификатор текущего запроса согласно спецификации [JSON-RPC 2.0](https://www.jsonrpc.org/specification).

### user: [User](#user)<a name="request.client.user"></a>
Пользователь, инициировавший запрос. Определяется если клиент авторизован.

### session: [Session](#session)<a name="request.client.session"></a>
Если клиент авторизован, в поле содержится объект с текущей сессией клиента.

### client.emit(event: string, data: any): void<a name="request.client.emit"></a>

Метод для отправки уведомления клиенту. Можно использовать только в случае подключения клиента по протоколу WebSocket. Также следует указать в [MethodSchema](#method.schema) формат отправляемых данных в поле emit.

### client.startSession(user: [User](#user)): void<a name="request.client.startSession"></a>

Начинает новую сессию для пользователя. Возможно использовать только при запросе по протоколу HTTP.

### client.deleteSession(): void<a name="request.client.deleteSession"></a>

Удаляет текущую сессию пользователя.

<!-- =====




---SERVICES---





===== -->
# Объекты сервисы <a name="service.objects"></a>



## validator<a name="validator"></a>

Используется для проверки входящих и исходящих данных сервера.

### validator.compile(schema : [MethodDataSchema](#method.data.schema)) : (data: any) => boolean<a name="validator.compile"></a>

Генерирует и возвращает функцию для валидации данных, согласно переданной схеме.



## userService <a name="user.service"></a>

Вспомогательный объект для взаимодействия с данными пользователей. В основном используется для авторизации/аутентификации.

### userService.save(username: string, hashPassword: string): Promise<[UserRole](#user.role)><a name="user.service.save"></a>

Добавляет нового пользователя в базу данных.

### userService.getByUsername(username: string): Promise<[User](#user)><a name="user.service.getByUsername"></a>

Возвращает информацию о пользователе из базы данных.

### userService.updatePassword(username: string, password: string): Promise<[UserRole](#user.role)><a name="user.service.updatePassword"></a>

Меняет пароль пользователя на новый.



## sessionService <a name="session.service"></a>

Сессии используют данные cookie пользователя, куда помещается уникальный ключ в формате uuid4.

### sessionService.restoreSession(request: [IncomingMessage](https://nodejs.org/docs/latest/api/http.html#class-httpincomingmessage)): Promise<[Session](#session)> <a name="session.service.restoreSession"></a>

Восстанавливает сессию из базы дынных на основе coockie данных запроса клиента.

### sessionService.startSession(request: [IncomingMessage](https://nodejs.org/docs/latest/api/http.html#class-httpincomingmessage), response: [ServerResponse](https://nodejs.org/docs/latest/api/http.html#class-httpserverresponse), username: string): Promise<[Session](#session)><a name="session.service.startSession"></a>

Создаёт новую сессию для клиента. Сохраняет уникальный ключ сессиии в cookie.

### sessionService.endSession(request: [IncomingMessage](https://nodejs.org/docs/latest/api/http.html#class-httpincomingmessage), response: [ServerResponse](https://nodejs.org/docs/latest/api/http.html#class-httpserverresponse)): Promise<[Session](#session)><a name="session.service.endSession"></a>

Удаляет сессию клиента из базы данных, если сессия будет обнаружена.



## logger <a name="logger"></a>

### logger.setSettings(settings: [LoggerSettings](#logger.settings)): void <a name="logger.setSettings"></a>

Установка настроек для управления выводом различных типов сообщений.

### logger.setTransport(transport: [LoggerTransport](#logger.transport)): void <a name="logger.setTransport"></a>

Замена консольного транспорта по умолчанию.

### logger.info(...data: any[]): void <a name="logger.info"></a>

Вывод информационного сообщения.

### logger.debug(...data: any[]): void <a name="logger.debug"></a>

Вывод отладочного сообщения.

### logger.warn(...data: any[]): void <a name="logger.warn"></a>

Вывод предупреждения.

### logger.sql(...data: any[]): void <a name="logger.sql"></a>

Сообщение с информацией о взаимодействии с базой данных.

### logger.error(error: Error): void <a name="logger.error"></a>

Сообщение об ошибке.

### logger.fatal(error: Error): void <a name="logger.fatal"></a>

Сообщение о критической ошибке, приводящей к перезапуску сервера.



## database <a name="database"></a>

Вспомогательный объект для взаимодействия с базой данных PostgreSQL. Имеет несколько заготовленных методов для упрощённого использование CRUD операций, а также метод для написания произвольных запросов.

### database.query(text: string[, params: Array<any>]): Promise<any[]><a name="database.query"></a>

Метод для отправки произвольных запросов в базу данных. Первый параметр отвечает за текст SQL запроса, второй за список параметров запроса. Возвращает список строк.

### database.insert(table: string, data: [DatabaseData](#database.data)[, returning: Array<string>]): Promise<any><a name="database.insert"></a>

Метод операции вставки в базу данных. Параметр data задаёт значения вставляемого в базу данных кортежа, returning позволяет перечислить значения, которые необходимо вернуть после успешной вставки.

### database.select(table: string[[[[, fields: Array<string>], conditions: [DatabaseData](#database.data)], orderFields: Array<string>], itemsOnPage: number, page: number]): Promise<any[]><a name="database.select"></a>

Метод операции выборки из базы данных. Параметр conditions задаёт значения условий, согласно которым будет выбран кортеж, fields - поля которые должны присутствовать в выборке, orderFields - поля по которым должна быть отсортирована выборка, itemsOnPage - количество элементов на странице выборки и page - номер необходимой страницы.

### database.update(table: string, delta: [DatabaseData](#database.data), conditions: [DatabaseData](#database.data)[, returning: Array<string>]): Promise<any[]><a name="database.update"></a>

Метод операции обновления кортежа в базе данных. Параметр delta задаёт значения, которые должны быть изменены, conditions задаёт значения условий, согласно которым будет выбран кортеж, returning позволяет перечислить значения, которые необходимо вернуть после успешной операции изменения.

### database.delete(table: string, conditions: [DatabaseData](#database.data)[, returning: Array<string>]): Promise<any[]><a name="database.delete"></a>

Метод операции удаления кортежа из базы данных. Параметр conditions задаёт значения условий, согласно которым будет выбран кортеж, returning позволяет перечислить значения, которые необходимо вернуть после успешной операции удаления.
<!-- =====





---INTERFACES---





===== -->
# Интерфейсы <a name="interfaces"></a>



## ServerConfig<a name="server.config"></a>

| Name | Type | Description |
| --- | --- | --- |
| [port] | number | Порт для прослушивания сервером. По умолчанию: 80 |
| [host] | string | IP адрес. По умолчанию: localhost |
| [cors] | boolean | True - разрешить запрос из любых источников, иначе запретить. По умолчанию: true |
| [serverCloseTimeout] | number | Количество миллисекуд, которое сервер ожидает перед принудительным закрытием соединений. По умолчанию: 500 |



## ServerModule<a name="server.module"></a>

| Name | Type | Description |
| --- | --- | --- |
| schema | { [method: string]: [MethodSchema](#method.schema) } | Схема с параметрами метода |
| Module | Class<T> | Класс модуля. Инстанцированием объектов класса занимается сервер. |



## MethodSchema<a name="method.schema"></a>

| Name | Type | Description |
| --- | --- | --- |
| [public] | boolean | Доступность метода для неавторизованных пользователей. По умолчанию: false |
| [description] | string | Описание метода. По умолчанию: '' |
| [params] | [MethodDataSchema](#method.data.schema) | Схема параметров метода. |
| [result] | [MethodDataSchema](#method.data.schema) | Схема данных, возвращаемых методом. |
| [emit] | [MethodDataSchema](#method.data.schema) | Схема данных, отправляемых методом при срабатывании события. Присутствие данного параметра является индикатором того, что при вызове метода пользователь подписывается на событие, соответственно должно использоваться WebSocket соединение. |
| [roles] | Array<string> | Массив со списком ролей пользователей, которым доступен вызов метода. При пустом массиве вызов метода разрешён всем пользователям. По умолчанию: [].|
| [transport] | 'http' | 'ws' | Указывает клиенту на то, какой транспортный протокол требуется для обращения к методу. Не используется сервером. |



## MethodDataSchema<a name="method.data.schema"></a>

Схема данных отправляемых или принимаемых сервером. Испольуется в том числе и для валидации данных отправляемых и принимаемых сервером. Для валидации используется [Ajv JSON schema validator](https://ajv.js.org/) со спецификацией [JSON Schema](https://json-schema.org/). Здесь описаны основные параметры, полных список доступных свойств можно найти на [странице](https://ajv.js.org/json-schema.html).

| Name | Type | Description |
| --- | --- | --- |
| [type] | string | Тип данных. По умолчанию: object|
| description? | string | Дополнительня информация о данных. |
| [required] | Array<string> | При указании типа данных object, можно перечислить свойства, который обязательно должны быть представлены в объекте данных. |
| [properties] | { [property: string]: MethodDataSchema } | При указании типа данных object, перечисляются возможные поля объекта, каждое поле описывается по аналогичной схеме данных. |
| [items] | MethodDataSchema | При указании типа данных array, описывается аналогичная схема данных для элементов массива. |
| [additionalProperties] | MethodDataSchema | При указании типа данных object, указывается возможность присутствия в объекте дополнительных свойсв. True - дополнительные свойства, не описанные в схеме могут присутствовать. По умолчанию: false.|



## User<a name="user"></a>

| Name | Type | Description |
| --- | --- | --- |
| username | string | Имя пользователя. |
| password | string | Пароль. При использовании модуля Авторизации/Аутентификации сервера, хранится ввиде хэша. |
| role | string | Роль пользователя. По умолчанию: user |
| createdTime | string | Время добавления пользователя в базу данных. |



## UserRole<a name="user.role"></a>

| Name | Type | Description |
| --- | --- | --- |
| role | string | Роль пользователя. По умолчанию: user |
| createdTime | string | Время добавления пользователя в базу данных. |



## Session<a name="session"></a>

| Name | Type | Description |
| --- | --- | --- |
| username | string | Имя пользователя, для которого создаётся сессия. |
| token | string | Уникальный ключ сессии. |
| createdTime | string | Время создание сессии. |



## LoggerSettings<a name="logger.settings"></a>

| Name | Type | Description |
| --- | --- | --- |
| [info] | boolean | Включает вывод информационных сообщений. |
| [debug] | boolean | Включает вывод отладочных сообщений. |
| [warn] | boolean | Включает вывод предупреждающих сообщений. |
| [error] | boolean | Включает вывод сообщений об ошибках. |
| [fatal] | boolean | Включает вывод сообщений о критических ошибках. |
| [sql] | boolean | Включает вывод сообщений о взаимодействии с базой данных. |



## LoggerTransport<a name="logger.transport"></a>

Интерфейс, которым должен обладать траспорт для вывода логов. Logger будет вызывать метод log у траспорта и передавать ему объект с сообщением.

| Name | Type | Description |
| --- | --- | --- |
| log | (data: [LoggerMessage](#logger.message)) => void | Отправляет сообщение в поток вывода. |



## LoggerMessage<a name="logger.message"></a>

| Name | Type | Description |
| --- | --- | --- |
| type | string | Тип сообщения. |
| message | string | Текст сообщения. |
| [stack] | string | Stack trace ошибки. Передаётся только для типов сообщений error и fatal|



## ErrorMetaData<a name="error.meta.data"></a>

| Name | Type | Description |
| --- | --- | --- |
| code | number | Код ошибки. |
| message | string | Стандартное сообщение об ошибке. |
| [internal] | string | Сообщение об ошибке для внутреннего использования. |



## DatabaseData<a name="database.data"></a>

| Name | Type | Description |
| --- | --- | --- |
|  [key: string] | number \| string \| boolean | Объект с данными для базы данных. Может использовать для добавления данных и задания условий поиска. Должен состоять из строковых ключей и значений указанных типов. В случае если объект задаёт условия поиска, строковые значения полей могут дополняться в начале следующими операторами сравнения: >=, <=, <>, >, <. |
<!-- =====





---ERRORS---





===== -->
# Список встроенных ошибок и кодов<a name="errors"></a>

При добавление и определении иных типов ошибок необходимо свериться со спецификацией [JSON-RPC 2.0](https://www.jsonrpc.org/specification).

| Error | Code | Message |
| --- | --- | --- |
| INVALID_REQUEST | -32600 | The JSON sent is not a valid Request object. |
| METHOD_NOT_FOUND | -32601 | The method does not exist / is not available. |
| INVALID_PARAMS | -32602 | Invalid method parameter(s). |
| INTERNAL_ERROR | -32603 | Internal server error. |
| PARSE_ERROR | -32700 | Invalid JSON was received by the server. |
| AUTHENTICATION_FAILED | -40300 | Authentication failed. |
| UNAUTHORIZED | -40401 | Authentication credentials required. |
| FORBIDDEN | -40403 | Permission denied. |
| DATA_CONFLICT | -40409 | Conflict error. |
| DATA_ERROR | -40410 | Data error. 
| SERVICE_UNAVAILABEL | -40503 | Service temporarily unavailable. |
| INVALID_HTTP_METHOD | -50400 | Request method must be POST. |
| BAD_TRASPORT | -50405 | Inappropriate transport protocol. ||
<!-- =====





---READY TO USE MODULES--





===== -->
# Готовые модули<a name="ready.modules"></a>

## AuthModule<a name="auth"></a>

Простой модуль авторизации/аутентификации/регистрации пользователей. Используется аутентификация по паролю и сессии для сохранения состояния.

### auth.register({ username: string, password: string }, client: [Client](#client)): Promise<{username: string, role: string, createdTime: string}><a name="auth.register"></a>

Регистрация нового пользователя.

### auth.login({ username: string, password: string }, client: [Client](#client)): Promise<{username: string, role: string, createdTime: string}><a name="auth.login"></a>

Аутентификация пользователя по паролю.

### auth.logout(data: any, client: [Client](#client)): void<a name="auth.logout"></a>

Удаление сессии пользователя.

### auth.me(data: any, client: [Client](#client)): Promise<{username: string, role: string, createdTime: string}><a name="auth.me"></a>

Получение информации о текущем пользователе.

### auth.changePassword({ username: string, oldPassword: string, newPassword: string }, client: [Client](#client)): Promise<{username: string, role: string, createdTime: string}><a name="auth.changePassword"></a>

Смена пароля пользователя.
