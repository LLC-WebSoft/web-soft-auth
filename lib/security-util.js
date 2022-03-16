'use strict';
const crypto = require('crypto');

const SALT_LEN = 32;
const KEY_LEN = 64;
const SCRYPT_PARAMS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const SCRYPT_PREFIX = '$scrypt$N=32768,r=8,p=1,maxmem=67108864$';

class SecurityUtil {
  constructor() {
    this.defaultHash = '';
    this.hashPassword('').then((hash) => {
      this.defaultHash = hash;
    });
  }

  serializeHash(hash, salt) {
    const saltString = salt.toString('base64').split('=')[0];
    const hashString = hash.toString('base64').split('=')[0];
    return `${SCRYPT_PREFIX}${saltString}$${hashString}`;
  }

  deserializeHash(phcString) {
    const parsed = phcString.split('$');
    parsed.shift();
    if (parsed[0] !== 'scrypt') {
      throw new Error('Node.js crypto module only supports scrypt');
    }
    const params = Object.fromEntries(
      parsed[1].split(',').map((p) => {
        const kv = p.split('=');
        kv[1] = Number(kv[1]);
        return kv;
      })
    );
    const salt = Buffer.from(parsed[2], 'base64');
    const hash = Buffer.from(parsed[3], 'base64');
    return { params, salt, hash };
  }

  hashPassword(password) {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(SALT_LEN, (err, salt) => {
        if (err) {
          reject(err);
          return;
        }
        crypto.scrypt(password, salt, KEY_LEN, SCRYPT_PARAMS, (err, hash) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.serializeHash(hash, salt));
        });
      });
    });
  }

  validatePassword(password, hashPassword = this.defaultHash) {
    const { params, salt, hash } = this.deserializeHash(hashPassword);
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, hash.length, params, (err, hashedPassword) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(crypto.timingSafeEqual(hashedPassword, hash));
      });
    });
  }
}

module.exports = {
  security: new SecurityUtil()
};
