// COMMON TESTING CASES:
// - SuccessfulRequest
// - InvalidParams
// - DatabaseConflict
// - NotFound

const transport = require('http');
const ws = require('ws');
const { Pool } = require('pg');

const pool = new Pool();
let cookies = '';

const setCookie = (key, value) => {
  cookies += `${key}=${value};`;
};

const clearCookies = () => {
  cookies = '';
};

const closeDatabaseConnection = async () => {
  return await pool.end();
};

const inserts = (entry) => {
  const numbers = [];
  const keys = Object.keys(entry);
  if (keys.length) {
    for (let i = 1; i <= keys.length; i++) {
      numbers.push(`$${i}`);
    }
    return [`"${keys.join('", "')}"`, numbers.join(', '), Object.values(entry)];
  }
  return ['', '', []];
};

const addTestData = async (table, ...entries) => {
  const promises = [];
  for (const entry of entries) {
    const [keys, numbers, values] = inserts(entry);
    promises.push(pool.query(`INSERT INTO "${table}" (${keys}) VALUES (${numbers})`, values));
  }

  return await Promise.allSettled(promises);
};

const clearTables = async (...names) => {
  const promises = [];
  for (const name of names) {
    promises.push(pool.query(`DELETE FROM "${name}";`));
  }
  return Promise.allSettled(promises);
};

const parseCookies = (setCookies) => {
  let cookies = '';
  for (const setCookie of setCookies) {
    cookies += setCookie.split(';')[0];
  }
  return cookies;
};

const getWebSocketTransport = async (origin = '') => {
  const client = new ws.WebSocket(`ws:${process.env.HOST}:${process.env.PORT}`, { headers: { origin } });
  return new Promise((resolve, reject) => {
    client.on('open', () =>
      resolve((data) => {
        client.send(data);
        return new Promise((resolve) => {
          client.on('error', (error) => {
            client.close();
            reject(error);
          });

          client.on('close', () => {
            resolve({});
          });

          client.on('message', (reply) => {
            client.close();
            resolve(JSON.parse(reply));
          });
        });
      })
    );
    client.on('error', (error) => reject(error));
  });
};

const getCaller = async (protocol = 'http', origin) => {
  const transport = protocol === 'http' ? (data) => request(data, origin) : await getWebSocketTransport(origin);

  return async (method, params) => {
    const data = { jsonrpc: '2.0', method, params };
    const { result, error } = await transport(JSON.stringify(data));
    return result ? result : error ? error : {};
  };
};

const request = (data, origin = '') =>
  new Promise((resolve, reject) => {
    const request = transport.request(
      {
        hostname: process.env.HOST,
        port: process.env.PORT,
        method: 'POST',
        origin: origin,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
          Cookie: cookies
        },
        rejectUnauthorized: false
      },
      (response) => {
        let data = '';
        cookies += parseCookies(response.headers['set-cookie'] || []);
        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          resolve(JSON.parse(data));
        });
      }
    );
    request.on('error', (error) => {
      reject(error);
    });
    request.end(data);
  });

module.exports = {
  getCaller,
  clearTables,
  closeDatabaseConnection,
  addTestData,
  clearCookies,
  setCookie
};
