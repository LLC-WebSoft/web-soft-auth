# Версия 2.0.2

# Требования

- Версия Node.js >= 16
- Работающий сервис PostgreSQL. И определенные переменные окружения необходимые для работы пакета [pg](https://node-postgres.com/).

# Установка

```
npm i web-soft-server
```

# Содержание

- [web-soft-server](#web-soft-server)
  - [Class: web-soft-server.Server](#server-class)
    - [new Server([config])](#new-server)
    - [server.start([modules])](#server-start)
    - [server.close()](#server-close)
  - [Class: web-soft-server.ConnectionError](#connection-error-class)
    - [new ConnectionError(meta[, data])](#new-connection-error)
    - [connectionError.pass](#connection-error-pass)
  - [Class: web-soft-server.Client](#client-class)
    - [client.id](#client-id)
    - [client.user](#client-user)
    - [client.session](#client-session)
    - [client.emit(event[, data])](#client-emit)
    - [client.startSession(user)](#client-start-session)
    - [client.deleteSession()](#client-delete-session)
  - [Class: web-soft-server.Validator](#validator-class)
    - [validator.compile(schema)](#validator-compile)
  - [Class: web-soft-server.Database](#database-class)
    - [database.query(text[, params])](#database-query)
    - [database.insert(table, data[, returning])](#database-insert)
    - [database.select(table[[[[, fields], conditions], orderFields], itemsOnPage, page])](#database-select)
    - [database.update(table, delta, conditions[, returning])](#database-update)
  - [Class: web-soft-server.UserService](#user-service-class)
    - [userService.save(username, hashPassword)](#user-service-save)
    - [userService.getByUsername(username)](#user-service-get-by-username)
    - [userService.updatePassword(username, password)](#user-service-update-password)
  - [Class: web-soft-server.SessionService](#session-service-class)
    - [sessionService.restoreSession(request)](#session-service-restore-session)
    - [sessionService.startSession(request, response, username)](#session-service-start-session)
    - [sessionService.endSession(request, response)](#session-service-end-session)
  - [Class: web-soft-server.Logger](#logger-class)
    - [logger.setSettings(settings)](#logger-set-settings)
    - [logger.setTransport(transport)](#logger-set-transport)
    - [logger.info(...data)](#logger-info)
    - [logger.debug(...data)](#logger-debug)
    - [logger.warn(...data)](#logger-warn)
    - [logger.sql(...data)](#logger-sql)
    - [logger.error(error)](#logger-error)
    - [logger.fatal(error)](#logger-fatal)
  - [Class: web-soft-server.Sanitizer](#sanitizer-class)
    - [sanitizer.setFilter(filter)](#sanitizer-set-filter)
    - [sanitizer.sanitize(data)](#sanitizer-sanitize)
  - [Module: web-soft-server.Introspection](#introspection-module)
    - [introspection.getModules()](#introspection-get-modules)
    - [introspection.getErrors()](#introspection-get-errors)
  - [Interface: web-soft-server.ServerModule](#server-module-interface)
  - [Interface: web-soft-server.MethodSchema](#method-schema-interface)
  - [Interface: web-soft-server.MethodDataSchema](#method-data-schema-interface)
  - [Interface: web-soft-server.User](#user-interface)
  - [Interface: web-soft-server.Session](#session-interface)
  - [Interface: web-soft-server.LoggerTransport](#logger-transport-interface)
  - [Interface: web-soft-server.DatabaseData](#database-data-interface)
  - [web-soft-server.validator](#validator)
  - [web-soft-server.userService](#user-service)
  - [web-soft-server.sessionService](#session-service)
  - [web-soft-server.logger](#logger)
  - [web-soft-server.database](#database)
  - [web-soft-server.sanitizer](#sanitizer)
  - [web-soft-server.registerError(label, code[, message])](#register-error)
  - [web-soft-server error codes](#error-codes)
    - [INVALID_REQUEST](#invalid-request-error)
    - [METHOD_NOT_FOUND](#method-not-found-error)
    - [INVALID_PARAMS](#invalid-params-error)
    - [INTERNAL_ERROR](#internal-error)
    - [PARSE_ERROR](#parse-error)
    - [AUTHENTICATION_FAILED](#authentication-failed-error)
    - [UNAUTHORIZED](#unauthorized-error)
    - [FORBIDDEN](#forbidden-error)
    - [DATA_CONFLICT](#data-conflict-error)
    - [DATA_ERROR](#data-error)
    - [SERVICE_UNAVAILABEL](#service-unavailabel-error)
    - [INVALID_HTTP_METHOD](#invalid-http-method-error)
    - [BAD_TRASPORT](#invalid-http-method-error)
    - [MAX_PAYLOAD_SIZE_EXCEEDED](#max-payload-size-exceeded-error)
    - [BODY_RECIEVE_ERROR](#body-recieve-error)

# web-soft-server<a name="web-soft-server"></a>

Пакет для создания API серверов на NodeJS. Сервер может использовать два вида транспортных протоколов: WebSocket и HTTP, поддерживает механизм подписок и простю авторизацию/аутентификацию пользователей на основе сессий. Для взаимодействия с сервером используется протокол [JSON-RPC 2.0](https://www.jsonrpc.org/specification).
Протоколы: HTTP/S, WebSocket.

**index.js**

```
const fs = require('fs');
const { Server, logger } = require('web-soft-server');
const modules = require('./modules');

const key = fs.readFileSync('private.key');
const cert = fs.readFileSync('cert.crt');

const start = async () => {
  try {
    const server = new Server({ host: 'localhost', port: 443, cors: false, key, cert, secure: true });
    server.start(modules);
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
  method() {
    return { message: 'Hello from server!' };
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
              type: 'number',
              description: 'Param1 is number.'
            }
          }
        },
        result: {
          description: 'Value that server must return.',
          type: 'object',
          properties: {
            message: {
              type: 'string'
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

## **Class: web-soft-server.Server<a name="server-class"></a>**

### **new Server([config])<a name="new-server"></a>**

- `config` <[object](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%BE%D0%B1%D1%8A%D0%B5%D0%BA%D1%82%D1%8B)> Объект с параметрами сервера:
  - `port` <[number](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%87%D0%B8%D1%81%D0%BB%D0%B0)> Порт для прослушивания сервером. **По умолчанию:** 80
  - `host` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> IP адрес. **По умолчанию:** localhost
  - `cors` <[boolean](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%B1%D1%83%D0%BB%D0%B5%D0%B2%D1%8B%D0%B9_%D1%82%D0%B8%D0%BF_%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85)> True - запретить запрос из любых источников, иначе разрешить. **По умолчанию:** true
  - `serverCloseTimeout` <[number](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%87%D0%B8%D1%81%D0%BB%D0%B0)> Количество миллисекуд, которое сервер ожидает перед принудительным закрытием соединений. **По умолчанию:** 500
  - `secure` <[boolean](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%B1%D1%83%D0%BB%D0%B5%D0%B2%D1%8B%D0%B9_%D1%82%D0%B8%D0%BF_%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85)> Нужно ли использовать защищённое HTTPS соединение. При установке значения true необходимо передать параметры key и cert. **По умолчанию:** false
  - `key` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> Приветный ключ.
  - `cert` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> Сертификат.
  - `maxPayload` <[number](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%87%D0%B8%D1%81%D0%BB%D0%B0)> максимальный размер тела запроса. **По умолчанию:** 1024 байт.
  - `allowOrigin` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)[]> список источников, из которых разрешены запросы серверу, этот параметр не работает, если значение `cors` установлено в `false`. **По умолчанию:** [].

Конструктор класса Server. Принимает оснонвые параметры для создания сервера.

### **server.start([modules])<a name="server-start">**

- `modules` <[object](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%BE%D0%B1%D1%8A%D0%B5%D0%BA%D1%82%D1%8B)> объект, содержащий модули сервера, ключи объекта - названия модулей, значения - объекты, реализующие интерфейс [ServerModule](#server-module-interface).

Метод запускает сервер. Сервер запускается согласно конфигурации и принимает как http, так и WebScoket соединения. Для работы методу передаётся объект с доступными модулями. По умолчанию сервер загружает модуль Introspection, который отдаёт клиенту схему текущего доступного API.

### **server.close()<a name="server-close"></a>**

- Returns <[Promise](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Server](#server-class)>>

Прекращает приём входящих соединений. И прерывает текущие соединения после указанного в конфигурации интервала времени.

## **Class: web-soft-server.ConnectionError<a name="connection-error-class"></a>**

Класс расширяет стандартный тип Error.

### **new ConnectionError(meta[, data])<a name="new-connection-error"></a>**

- `meta` <[object](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%BE%D0%B1%D1%8A%D0%B5%D0%BA%D1%82%D1%8B)> Объект с информацией об ошибке:
  - `code` <[number](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%87%D0%B8%D1%81%D0%BB%D0%B0)> Код ошибки.
  - `message` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> Сообщение ошибки. **По умолчанию:** ''.
  - `internal` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> Сообщение предназначенное исключительно для внутренних нужд сервера или анализа разработчиком. Не будет отправлено в ответе клиенту. **По умолчанию:** ''.
- `data` <[any](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Data_types)> В объект ошибки могут быть вложены дополнительные данные, необходимые для дальнейшего анализа этой ошибки. Тип данных может быть любым, так как не используется внутри пакета.

### **connectionError.pass<a name="connection-error-pass"></a>**

- <[boolean](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%B1%D1%83%D0%BB%D0%B5%D0%B2%D1%8B%D0%B9_%D1%82%D0%B8%D0%BF_%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85)>

Флаг отвечающий за отправку ошибки в ответе клиенту. По умолчанию: true. Чтобы одновременно отправить ошибку клиенту и сокрыть некоторую информацию используется свойство internal. Если свойство pass установлено в false, клиенту будет отправлено стандартное сообщение о внутренний ошибке сервера.

## **Class: web-soft-server.Client<a name="client-class"></a>**

Содержит методы для управления соединением.

### **client.id<a name="client-id"></a>**

- <[number](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%87%D0%B8%D1%81%D0%BB%D0%B0)>

Идентификатор текущего запроса согласно спецификации [JSON-RPC 2.0](https://www.jsonrpc.org/specification).

### **client.user<a name="client-user"></a>**

- <[User](#user-interface)>

Пользователь, инициировавший запрос. Определяется если клиент авторизован.

### **client.session<a name="client-session"></a>**

- <[Session](#session-interface)>

Если клиент авторизован, в поле содержится объект с текущей сессией клиента.

### **client.emit(event[, data])<a name="client-emit"></a>**

- `event` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> название эмитируемого события.
- `data` <[any](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Data_types)> данные, отправляемые клиентам, подписанным на событие.

Метод для отправки уведомления клиенту. Можно использовать только в случае подключения клиента по протоколу WebSocket. Также следует указать в [MethodSchema](#method.schema) формат отправляемых данных в поле emit.

### **client.startSession(user)<a name="client-start-session"></a>**

- `user` <[User](#user-interface)> пользователь, для которого нужно начать сессию.

Начинает новую сессию для пользователя. Возможно использовать только при запросе по протоколу HTTP.

### **client.deleteSession()<a name="client-delete-session"></a>**

Удаляет текущую сессию пользователя.

## **Class: web-soft-server.Validator<a name="validator-class"></a>**

Отвечает за проверку данных поступающих серверу на соответствие описанным схемам и спецификации [JSON-RPC 2.0](https://www.jsonrpc.org/specification). Использует пакет [Ajv](https://www.npmjs.com/package/ajv).

### **validator.compile(schema)<a name="validator-compile"></a>**

- `schema` <[MethodDataSchema](#method-data-schema-interface)> схема, на соответствие которой результирующая функция должна проверять данные.
- Returning <[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions)>

Генерирует и возвращает функцию для валидации данных, согласно переданной схеме.

## **Class: web-soft-server.Database<a name="database-class"></a>**

Отвечает за взаимодействие с базой данных PostgreSQL. Имеет несколько заготовленных методов для упрощённого использования простых CRUD операций, а также метод для написания произвольных запросов. Не является ORM и не является QueryBuilder, может использоваться исключительно как обёртка над пакетом [pg](https://www.npmjs.com/package/pg). На данный момент не поддерживается механизм транзакций, для их использования необъодимо обращаться напрямую к пакету [pg](https://www.npmjs.com/package/pg).

### **database.query(text[, params])<a name="database-query"></a>**

- `text` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> текст SQL запроса.
- `params` <[any](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Data_types)[]> параметры SQL запроса.
- Returns: <[Promise](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[any](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Data_types)[]>>

Метод для отправки произвольных запросов в базу данных. Первый параметр отвечает за текст SQL запроса, второй за список параметров запроса. Возвращает список строк.

### **database.insert(table, data[, returning])<a name="database-insert"></a>**

- `table` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> таблица для вставки.
- `data` <[DatabaseData](#database-data-interface)> данные для вставки.
- `returning` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)[]> список полей, которые необходимо вернуть после успешной вставки.
- Returns: <[Promise](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[any](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Data_types)[]>>

Метод операции вставки в базу данных. Параметр data задаёт значения вставляемого в базу данных кортежа, returning позволяет перечислить значения, которые необходимо вернуть после успешной вставки.

### **database.select(table[[[[, fields], conditions], orderFields], itemsOnPage, page])<a name="database-select"></a>**

- `table` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> таблица выборки.
- `fields` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)[]> список полей, которые необходимо вернуть.
- `conditions` <[DatabaseData](#database-data-interface)> условия выборки.
- `orderFields` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)[]> список полей, по которым необходимо выполнить сортировку.
- `itemsOnPage` <[number](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%87%D0%B8%D1%81%D0%BB%D0%B0)> количество элементов на странице.
- `page` <[number](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%87%D0%B8%D1%81%D0%BB%D0%B0)> номер страницы.
- Returns: <[Promise](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[any](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Data_types)[]>>

Метод операции выборки из базы данных. Параметр conditions задаёт значения условий, согласно которым будет выбран кортеж, fields - поля которые должны присутствовать в выборке, orderFields - поля по которым должна быть отсортирована выборка, itemsOnPage - количество элементов на странице выборки и page - номер необходимой страницы.

### **database.update(table, delta, conditions[, returning])<a name="database-update"></a>**

- `table` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> таблица.
- `delta` <[DatabaseData](#database-data-interface)> значения, которые необходимо изменить.
- `conditions` <[DatabaseData](#database-data-interface)> условия выборки.
- `orderFields` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)[]> список полей, по которым необходимо выполнить сортировку.
- `returning` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)[]> список полей, которые необходимо вернуть после успешной операции.
- Returns: <[Promise](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[any](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Data_types)[]>>

Метод операции обновления кортежа в базе данных. Параметр delta задаёт значения, которые должны быть изменены, conditions задаёт значения условий, согласно которым будет выбран кортеж, returning позволяет перечислить значения, которые необходимо вернуть после успешной операции изменения.

### **database.delete(table, conditions[, returning])<a name="database-delete"></a>**

- `table` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> таблица.
- `conditions` <[DatabaseData](#database-data-interface)> условия выборки.
- `returning` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)[]> список полей, которые необходимо вернуть после успешной операции.
- Returns: <[Promise](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[any](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Data_types)[]>>

Метод операции удаления кортежа из базы данных. Параметр conditions задаёт значения условий, согласно которым будет выбран кортеж, returning позволяет перечислить значения, которые необходимо вернуть после успешной операции удаления.

## **Class: web-soft-server.UserService<a name="user-service-class"></a>**

Отвечает за взаимодействие с данными пользователей. В основном используется для авторизации/аутентификации.

### **userService.save(username, hashPassword)<a name="user-service-save"></a>**

- `username` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> имя пользователя.
- `hashPassword` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> хэш пароля.
- Returns: <[Promise](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[object](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%BE%D0%B1%D1%8A%D0%B5%D0%BA%D1%82%D1%8B)>>
  - `role` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> роль пользователя.
  - `createdTime` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> время добавления пользователя.

Добавляет нового пользователя.

### **userService.getByUsername(username)<a name="user-service-get-by-username"></a>**

- `username` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> имя пользователя.
- Returns: <[Promise](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[User](#user-interface)>>

Возвращает информацию о пользователе.

### **userService.updatePassword(username, password)<a name="user-service-update-password"></a>**

- `username` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> имя пользователя.
- `password` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> хэш пароля.
- Returns: <[Promise](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[object](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%BE%D0%B1%D1%8A%D0%B5%D0%BA%D1%82%D1%8B)>>
  - `role` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> роль пользователя.
  - `createdTime` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> время добавления пользователя.

Меняет пароль пользователя на новый.

## **Class: web-soft-server.SessionService<a name="session-service-class"></a>**

Отвечает за взаимодействие с данными сессий. Сессии используют данные cookie пользователя, куда помещается уникальный ключ в формате uuid4.

### **sessionService.restoreSession(request)<a name="session-service-restore-session"></a>**

- `request` <[IncomingMessage](https://nodejs.org/docs/latest/api/http.html#class-httpincomingmessage)> объект http запроса.
- Returns: <[Promise](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Session](#session-interface)>>

Восстанавливает сессию на основе coockie данных запроса клиента.

### **sessionService.startSession(request, response, username)<a name="session-service-start-session"></a>**

- `request` <[IncomingMessage](https://nodejs.org/docs/latest/api/http.html#class-httpincomingmessage)> объект http запроса.
- `response` <[ServerResponse](https://nodejs.org/docs/latest/api/http.html#class-httpserverresponse)> объект http ответа.
- `username` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> имя пользователя.
- Returns: <[Promise](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Session](#session-interface)>>

Создаёт новую сессию для клиента. Сохраняет уникальный ключ сессиии в cookie.

### **sessionService.endSession(request, response)<a name="session-service-end-session"></a>**

- `request` <[IncomingMessage](https://nodejs.org/docs/latest/api/http.html#class-httpincomingmessage)> объект http запроса.
- `response` <[ServerResponse](https://nodejs.org/docs/latest/api/http.html#class-httpserverresponse)> объект http ответа.
- Returns: <[Promise](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Session](#session-interface)>>

Удаляет сессию клиента, если сессия будет обнаружена.

## **Class: web-soft-server.Logger<a name="logger-class"></a>**

Отвечает за журналирование информации. Способ вывода информации настраивается с помощью передачи объекта транспорта. По умолчанию используется вывод информации в консоль.

### **logger.setSettings(settings)<a name="logger-set-settings"></a>**

- `settings` <[object](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%BE%D0%B1%D1%8A%D0%B5%D0%BA%D1%82%D1%8B)> объект c параметрами:
  - `info` <[boolean](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%B1%D1%83%D0%BB%D0%B5%D0%B2%D1%8B%D0%B9_%D1%82%D0%B8%D0%BF_%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85)> включает вывод информационных сообщений. **По умолчанию:** true.
  - `debug` <[boolean](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%B1%D1%83%D0%BB%D0%B5%D0%B2%D1%8B%D0%B9_%D1%82%D0%B8%D0%BF_%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85)> включает вывод отладочных сообщений. **По умолчанию:** true.
  - `warn` <[boolean](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%B1%D1%83%D0%BB%D0%B5%D0%B2%D1%8B%D0%B9_%D1%82%D0%B8%D0%BF_%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85)> включает вывод предупреждающих сообщений. **По умолчанию:** true.
  - `error` <[boolean](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%B1%D1%83%D0%BB%D0%B5%D0%B2%D1%8B%D0%B9_%D1%82%D0%B8%D0%BF_%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85)> включает вывод сообщений об ошибках. **По умолчанию:** true.
  - `fatal` <[boolean](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%B1%D1%83%D0%BB%D0%B5%D0%B2%D1%8B%D0%B9_%D1%82%D0%B8%D0%BF_%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85)> включает вывод сообщений о критических ошибках. **По умолчанию:** true.
  - `sql` <[boolean](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%B1%D1%83%D0%BB%D0%B5%D0%B2%D1%8B%D0%B9_%D1%82%D0%B8%D0%BF_%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85)> включает вывод сообщений о взаимодействии с базой данных. **По умолчанию:** true.

Установка настроек для управления выводом различных типов сообщений.

### **logger.setTransport(transport)<a name="logger-set-transport"></a>**

- `transport` <[LoggerTransport](#logger-transport-interface)> объект, отвечающий за вывод информации.

Замена консольного транспорта по умолчанию.

### **logger.info(...data)<a name="logger-info"></a>**

- `...data` <[any](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Data_types)> информация для вывода.

Вывод информационного сообщения.

### **logger.debug(...data)<a name="logger-debug"></a>**

- `...data` <[any](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Data_types)> информация для вывода.

Вывод отладочного сообщения.

### **logger.warn(...data)<a name="logger-warn"></a>**

- `...data` <[any](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Data_types)> информация для вывода.

Вывод предупреждения.

### **logger.sql(...data)<a name="logger-sql"></a>**

- `...data` <[any](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Data_types)> информация для вывода.

Сообщение с информацией о взаимодействии с базой данных.

### **logger.error(error)<a name="logger-error"></a>**

- `error` <[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)> объект ошибки.

Сообщение об ошибке.

### **logger.fatal(error)<a name="logger-fatal"></a>**

- `error` <[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)> объект ошибки.

Сообщение о критической ошибке, приводящей к перезапуску сервера.

## **Class: web-soft-server.Sanitizer<a name="sanitizer-class"></a>**

Отвечает за экранирование строк от XSS.

### **sanitizer.setFilter(filter)<a name="sanitizer-set-filter"></a>**

- `filter` <[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions)> функция фильтрации, принимает строку и возвращает экранированный результат.

Метод для замены функции фильтрации по умолчанию. Изначально используется пакет [xss](https://www.npmjs.com/package/xss).

### **sanitizer.sanitize(data)<a name="sanitizer-sanitize"></a>**

- `data` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> строка для экранирования.
- Returns: <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)>

Производит экранирование спец. символов в переданной строке.

## **Module: web-soft-server.Introspection<a name="introspection-module"></a>**

Модуль предоставляет функции для получения схемы API сервера, а также списка ошибок, встроенных в пакет и зарегистрированных пользователем. Основное назначение модуля - генерация API вызовов на стороне клиента, примером является пакет [web-soft-client](https://github.com/web-soft-llc/web-soft-client).

### **introspection.getModules()<a name="introspection-get-modules"></a>**

- Returns: <[object](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%BE%D0%B1%D1%8A%D0%B5%D0%BA%D1%82%D1%8B)> ключи объекта - названия модулей, значения - объекты реализующие интерфейс [ServerModule](#server-module-interface).

Возвращает схему API сервера.

### **introspection.getErrors()<a name="introspection-get-errors"></a>**

- Returns: <[object](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%BE%D0%B1%D1%8A%D0%B5%D0%BA%D1%82%D1%8B)> ключи объекта - сокращенное наименование ошибки, значения - объекты, содержащие поля `code` и `message`, соответственно код и сообщение ошибки.

Возвращает словарь, содержащий типы ошибок, используемых сервером.

## **Interface: web-soft-server.ServerModule<a name="server-module-interface"></a>**

- `schema` <[object](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%BE%D0%B1%D1%8A%D0%B5%D0%BA%D1%82%D1%8B)> объект cхемы, ключи объекта представляют собой названия методов модуля, значения - объекты реализующие интерфейс [MethodSchema](#method-schema-interface).
- `Module` <[Class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)> класс модуля. Инстанцированием объектов класса занимается сервер.

## **Interface: web-soft-server.MethodSchema<a name="method-schema-interface"></a>**

- `public` <[boolean](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%B1%D1%83%D0%BB%D0%B5%D0%B2%D1%8B%D0%B9_%D1%82%D0%B8%D0%BF_%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85)> доступность метода для неавторизованных пользователей.
- `description` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> описание метода.
- `params` <[MethodDataSchema](#method-data-schema-interface)> cхема параметров метода.
- `result` <[MethodDataSchema](#method-data-schema-interface)> cхема данных, возвращаемых методом.
- `emit` <[MethodDataSchema](#method-data-schema-interface)> cхема данных, отправляемых методом при срабатывании события. Присутствие данного параметра является индикатором того, что при вызове метода пользователь подписывается на событие, соответственно должно использоваться WebSocket соединение.
- `roles` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)[]> массив со списком ролей пользователей, которым доступен вызов метода. При пустом массиве вызов метода разрешён всем пользователям.
- `transport` <'http' | 'ws'> Указывает клиенту на то, какой транспортный протокол требуется для обращения к методу. Не используется сервером.

## **Interface: web-soft-server.MethodDataSchema<a name="method-data-schema-interface"></a>**

Схема данных отправляемых или принимаемых сервером. Испольуется в том числе и для валидации данных отправляемых и принимаемых сервером. Для валидации используется [Ajv JSON schema validator](https://ajv.js.org/) со спецификацией [JSON Schema](https://json-schema.org/). Здесь описаны основные параметры, полных список доступных свойств можно найти на [странице](https://ajv.js.org/json-schema.html).

- `type` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> тип данных.
- `description` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> дополнительня информация о данных.
- `required` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)[]> при указании типа данных `object`, можно перечислить свойства, который обязательно должны быть представлены в объекте данных.
- `properties` <[object](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%BE%D0%B1%D1%8A%D0%B5%D0%BA%D1%82%D1%8B)> при указании типа данных `object`, перечисляются возможные поля объекта, каждое поле описывается по аналогичной схеме данных. Ключи - названия поля, значения - объекты, реализующие интерфейс [MethodDataSchema](#method-data-schema-interface).
- `items` <[MethodDataSchema](#method-data-schema-interface)> при указании типа данных `array`, описывается аналогичная схема данных для элементов массива.
- `additionalProperties` <[boolean](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%B1%D1%83%D0%BB%D0%B5%D0%B2%D1%8B%D0%B9_%D1%82%D0%B8%D0%BF_%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85)> при указании типа данных `object`, указывается возможность присутствия в объекте дополнительных свойсв. `true` - дополнительные свойства, не описанные в схеме могут присутствовать.

## **Interface: web-soft-server.User<a name="user-interface"></a>**

- `username` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> имя аккаунта пользователя.
- `password` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> пароль или его хэш.
- `role` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> роль пользователя.
- `createdTime` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> время добавления пользователя.

## **Interface: web-soft-server.Session<a name="session-interface"></a>**

- `username` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> имя аккаунта пользователя.
- `token` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> уникальный ключ сессии.
- `createdTime` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> время добавления сессии.

## **Interface: web-soft-server.LoggerTransport<a name="logger-transport-interface"></a>**

Интерфейс, которым должен обладать траспорт для вывода логов. Logger будет вызывать метод log у траспорта и передавать ему объект с сообщением.

- `log` <[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions)> метод для вывода сообщения. Должен принимать параметр `data` - объект с полями `type`, `message`, [`stack`], соответственно тип сообщения, сообщение и, опционально, стек трейс объекта ошибки.

## **Interface: web-soft-server.DatabaseData<a name="database-data-interface"></a>**

- <[object](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%BE%D0%B1%D1%8A%D0%B5%D0%BA%D1%82%D1%8B)>

Ключи объекта - названия полей в базе данных, значения могут принимать один из типов: `number` \| `string` \| `boolean`.

Может использовать для добавления данных и задания условий поиска. Должен состоять из строковых ключей и значений указанных типов. В случае если объект задаёт условия поиска, строковые значения полей могут дополняться в начале следующими операторами сравнения: >=, <=, <>, >, <.

## **web-soft-server.validator<a name="validator"></a>**

- <[Validator](#validator-class)>

Глобальный экземпляр класса Validator, используемый пакетом.

## **web-soft-server.userService <a name="user-service"></a>**

- <[UserService](#user-service-class)>

Глобальный экземпляр класса UserService, используемый пакетом.

## **web-soft-server.sessionService <a name="session-service"></a>**

- <[SessionService](#session-service-class)>

Глобальный экземпляр класса SessionService, используемый пакетом.

## **web-soft-server.logger <a name="logger"></a>**

- <[Logger](#logger-class)>

Глобальный экземпляр класса Logger, используемый пакетом.

## **web-soft-server.database <a name="database"></a>**

- <[Database](#database-class)>

Глобальный экземпляр класса Database, используемый пакетом.

## **web-soft-server.sanitizer <a name="sanitizer"></a>**

- <[Sanitizer](#sanitizer-class)>

Глобальный экземпляр класса Sanitizer, используемый пакетом.

## **web-soft-server.registerError(label, code[, message])<a name="register-error"></a>**

- `label` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> краткое наименование ошибки.
- `code` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Numbers_and_dates)> краткое наименование ошибки.
- `message` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> сообщение ошибки.
- Returns: <[object](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D0%BE%D0%B1%D1%8A%D0%B5%D0%BA%D1%82%D1%8B)>
  - `code` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Numbers_and_dates)> краткое наименование ошибки.
  - `message` <[string](https://developer.mozilla.org/ru/docs/Web/JavaScript/Data_structures#%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%BE%D0%B2%D1%8B%D0%B5_%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B8)> сообщение ошибки.

Добавляет новый тип ошибки в словарь ошибок используемых сервером. Регистрировать новый тип ошибки необходимо, если клиент использует метод [getErrors()](#introspection-get-errors) стандартного модуля [Introspection](#introspection-module).

## **web-soft-server error codes<a name="error-codes"></a>**

Коды ошибок, использованные в пакете web-soft-server. При добавление и определении иных типов ошибок необходимо свериться со спецификацией [JSON-RPC 2.0](https://www.jsonrpc.org/specification).

### **INVALID_REQUEST<a name="invalid-request-error"></a>**

- `code` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> -32600.
- `message` <[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> The JSON sent is not a valid Request object.

### **METHOD_NOT_FOUND<a name="method-not-found-error"></a>**

- `code` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> -32601.
- `message` <[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> The method does not exist / is not available.

### **INVALID_PARAMS<a name="invalid-params-error"></a>**

- `code` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> -32602.
- `message` <[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> Invalid method parameter(s).

### **INTERNAL_ERROR<a name="internal-error"></a>**

- `code` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> -32603.
- `message` <[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> Internal server error.

### **PARSE_ERROR<a name="parse-error"></a>**

- `code` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> -32700.
- `message` <[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> Invalid JSON was received by the server.

### **AUTHENTICATION_FAILED<a name="authentication-failed-error"></a>**

- `code` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> -40300.
- `message` <[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> Authentication failed.

### **UNAUTHORIZED<a name="unauthorized-error"></a>**

- `code` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> -40401.
- `message` <[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> Authentication credentials required.

### **FORBIDDEN<a name="forbidden-error"></a>**

- `code` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> -40403.
- `message` <[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> Permission denied.

### **DATA_CONFLICT<a name="data-conflict-error"></a>**

- `code` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> -40409.
- `message` <[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> Conflict error.

### **DATA_ERROR<a name="data-error"></a>**

- `code` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> -40410.
- `message` <[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> Data error.

### **SERVICE_UNAVAILABEL<a name="service-unavailabel-error"></a>**

- `code` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> -40503.
- `message` <[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> Service temporarily unavailable.

### **INVALID_HTTP_METHOD<a name="invalid-http-method-error"></a>**

- `code` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> -50400.
- `message` <[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> Request method must be POST.

### **BAD_TRASPORT<a name="invalid-http-method-error"></a>**

- `code` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> -50405.
- `message` <[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> Inappropriate transport protocol.

### **MAX_PAYLOAD_SIZE_EXCEEDED<a name="max-payload-size-exceeded-error"></a>**

- `code` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> -50406.
- `message` <[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> Exceeded the size of the data.

### **BODY_RECIEVE_ERROR<a name="body-recieve-error"></a>**

- `code` <[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> -50407.
- `message` <[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type)> An error occurred while retrieving body data.
