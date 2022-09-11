// COMMON TESTING CASES:
// - SuccessfulRequest
// - InvalidParams
// - DatabaseConflict
// - NotFound

const transport = require('http');
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

const request = (data, hostname, port) =>
  new Promise((resolve, reject) => {
    const request = transport.request(
      {
        hostname,
        port,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
          Cookie: cookies
        },
        rejectUnauthorized: false
      },
      (response) => {
        let data = '';
        cookies = parseCookies(response.headers['set-cookie'] || []);
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
    request.write(data);
    request.end();
  });

const call = async (method, params) => {
  const data = { jsonrpc: '2.0', method, params };
  const { result, error } = await request(JSON.stringify(data), process.env.HOST, process.env.PORT);
  return result ? result : error ? error : {};
};

const auth = async (role) => {
  const user = {
    username: 'test_user',
    password:
      '$scrypt$N=32768,r=8,p=1,maxmem=67108864$WDvlWv547xK6YjokhmlArebEs92/Ug+a8GtU2b+ER84$11RTxyQMbuyft3XJ7nethkvNALfSREfemmr0phYAvam8MC4qp0lSAe91DDmZC2FufT0RKTo18p8do+jj+M8oMw',
    role
  };

  const session = {
    token: '409715e3-9c5e-474a-8070-884b23ac3a6a',
    username: 'test_user'
  };

  clearCookies();
  setCookie('token', session.token);
  await addTestData('SystemUser', user);
  await addTestData('Session', session);

  return { ...user, password: 'test_password' };
};

module.exports = {
  call,
  clearTables,
  closeDatabaseConnection,
  addTestData,
  clearCookies,
  setCookie,
  auth
};
