(function (global, factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    // CommonJS (Node.js)
    module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
    // AMD (RequireJS)
    define([], factory);
  } else {
    // Browser global (window)
    global.getCredentials = factory();
  }
})(typeof window !== "undefined" ? window : this, function () {
  function getCredentials() {
    const codeVerifier = generate_code_verifier();
    const state = generate_state();
    const codeChallenge = generate_code_challenge(codeVerifier);
    return { codeVerifier, state, codeChallenge };
  }

  function generate_code_verifier() {
    return random_string(48);
  }

  function generate_state() {
    return random_string(16);
  }

  function generate_code_challenge(verifier) {
    return base64_urlencode(sha256bin(verifier));
  }

  function sha256(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }

    let mathPow = Math.pow;
    let maxWord = mathPow(2, 32);
    let lengthProperty = "length";
    let result = "";
    let words = [];
    let asciiBitLength = ascii[lengthProperty] * 8;
    let hash = sha256.h || [];
    let k = sha256.k || [];
    let primeCounter = k[lengthProperty];

    let isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (let i = 0; i < 313; i += candidate) {
          isComposite[i] = candidate;
        }
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }

    ascii += "\x80";
    while (ascii[lengthProperty] % 64 - 56) ascii += "\x00";
    for (let i = 0; i < ascii[lengthProperty]; i++) {
      let j = ascii.charCodeAt(i);
      if (j >> 8) return;
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = asciiBitLength;

    for (let j = 0; j < words[lengthProperty];) {
      let w = words.slice(j, (j += 16));
      let oldHash = hash;
      hash = hash.slice(0, 8);

      for (let i = 0; i < 64; i++) {
        let w15 = w[i - 15], w2 = w[i - 2];
        let a = hash[0], e = hash[4];

        let temp1 =
          hash[7] +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & hash[5]) ^ (~e & hash[6])) +
          k[i] +
          (w[i] =
            i < 16
              ? w[i]
              : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);

        let temp2 =
          (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
          ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }

      for (let i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }

    for (let i = 0; i < 8; i++) {
      for (let j = 3; j + 1; j--) {
        let b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16 ? 0 : "") + b.toString(16));
      }
    }
    return result;
  }

  function sha256bin(ascii) {
    return hex2bin(sha256(ascii));
  }

  function hex2bin(s) {
    let ret = [];
    let i = 0;

    s += "";
    for (let l = s.length; i < l; i += 2) {
      let c = parseInt(s.substr(i, 1), 16);
      let k = parseInt(s.substr(i + 1, 1), 16);
      if (isNaN(c) || isNaN(k)) return false;
      ret.push((c << 4) | k);
    }

    return String.fromCharCode.apply(String, ret);
  }

  function base64_urlencode(str) {
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  function random_string(len) {
    let arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    let str = base64_urlencode(dec2bin(arr));
    return str.substring(0, len);
  }

  function dec2hex(dec) {
    return ("0" + dec.toString(16)).substr(-2);
  }

  function dec2bin(arr) {
    return hex2bin(Array.from(arr, dec2hex).join(""));
  }

  return getCredentials;
});
