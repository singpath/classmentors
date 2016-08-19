'use strict';

import CryptoJS from 'cryptojs';
import 'cryptojs/md5.js';
import 'cryptojs/pbkdf2.js';
import 'cryptojs/sha256.js';

const hex = CryptoJS.enc.Hex;
const random = CryptoJS.lib.WordArray.random;
const pbkdf2 = CryptoJS.PBKDF2;

export const saltSize = 16;
export const keySize = 8;
export const iterations = 1012;
export const prf = 'SHA256';

class PasswordService {

  constructor(settings) {
    this.settings = settings;
  }

  /**
   * Return a hash for the password and options allowing
   * to rebuild the same against the same password.
   *
   * The options will include the hashing algorithm name, the
   * salt an other parameters.
   *
   */
  newHash(password) {
    const salt = random(this.settings.saltSize);
    const hash = pbkdf2(password, salt, {
      keySize: this.settings.keySize,
      iterations: this.settings.iterations,
      hasher: CryptoJS.algo[prf]
    });

    return {
      value: hex.stringify(hash),
      options: {
        salt: hex.stringify(salt),
        iterations: this.settings.iterations,
        keySize: this.settings.keySize,
        hasher: 'PBKDF2',
        prf
      }
    };
  }

  /**
  * Return a hash built from the password, the hash and the
  * hashing options.
  *
  * The salt should be hex encoded.
  */
  fromSalt(password, hexSalt, options) {
    const salt = hex.parse(hexSalt);
    const keySize = options.keySize || this.settings.keySize;
    const iterations = options.iterations || this.settings.iterations;
    const hasher = CryptoJS.algo[options.prf || prf];
    const hash = pbkdf2(password, salt, {keySize, iterations, hasher});

    return hex.stringify(hash);
  }

}

export class Service {

  constructor(spfCryptoSaltSize, spfCryptoHashKeySize, spfCryptoIteration) {
    this.password = new PasswordService({
      saltSize: spfCryptoSaltSize,
      iterations: spfCryptoIteration,
      keySize: spfCryptoHashKeySize
    });
  }

  /**
   * Return a CryptoJS MD5 Hash.
   *
   * Usage:
   *
   *  const spfCrypto = new Service();
   *  const hash = spfCrypto.md5();
   *  const hex = hash.toString();
   *
   * @param  {string} message
   * @return {object}
   */
  md5(message) {
    return new CryptoJS.MD5(message);
  }

  randomString(size) {
    const str = random(size);

    return hex.stringify(str);
  }

}

Service.$inject = ['spfCryptoSaltSize', 'spfCryptoHashKeySize', 'spfCryptoIteration'];
