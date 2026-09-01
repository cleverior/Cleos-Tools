const validator = require('../src/utils/validator');
const path = require('path');

console.log('=== Validator Tests ===\n');

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) {
    console.log(`✓ ${name}`);
    passed++;
  } else {
    console.log(`✗ ${name}`);
    failed++;
  }
}

function assertEqual(name, actual, expected) {
  const ok = actual === expected;
  if (ok) {
    console.log(`✓ ${name}: ${actual}`);
  } else {
    console.log(`✗ ${name}: expected "${expected}", got "${actual}"`);
  }
  ok ? passed++ : failed++;
}

// parseAssetInput tests
console.log('--- parseAssetInput ---');
assertEqual('empty input', validator.parseAssetInput('', 'VEX'), '0.0000 VEX');
assertEqual('whitespace input', validator.parseAssetInput('   ', 'VEX'), '0.0000 VEX');
assertEqual('integer "25"', validator.parseAssetInput('25', 'VEX'), '25.0000 VEX');
assertEqual('decimal "25.001"', validator.parseAssetInput('25.001', 'VEX'), '25.0010 VEX');
assertEqual('decimal "25.0001"', validator.parseAssetInput('25.0001', 'VEX'), '25.0001 VEX');
assertEqual('decimal "100.5"', validator.parseAssetInput('100.5', 'VEX'), '100.5000 VEX');
assertEqual('with spaces " 25 "', validator.parseAssetInput(' 25 ', 'VEX'), '25.0000 VEX');
assertEqual('invalid "abc"', validator.parseAssetInput('abc', 'VEX'), null);
assertEqual('invalid "25.abc"', validator.parseAssetInput('25.abc', 'VEX'), null);

// isAccountName tests
console.log('\n--- isAccountName ---');
assert('valid "alice"', validator.isAccountName('alice'));
assert('valid "list.arcelio"', validator.isAccountName('list.arcelio'));
assert('valid "estehmanisss"', validator.isAccountName('estehmanisss'));
assert('valid "a1b2c3d4e5"', validator.isAccountName('a1b2c3d4e5'));
assert('invalid "ALICE"', !validator.isAccountName('ALICE'));
assert('invalid "alice12345678901" (too long)', !validator.isAccountName('alice12345678901'));
assert('invalid "alice@bob"', !validator.isAccountName('alice@bob'));

// isAsset tests
console.log('\n--- isAsset ---');
assert('valid "10.0000 VEX"', validator.isAsset('10.0000 VEX', 'VEX'));
assert('valid "0.0000 VEX"', validator.isAsset('0.0000 VEX', 'VEX'));
assert('valid "1.2345 VEX"', validator.isAsset('1.2345 VEX', 'VEX'));
assert('valid "10 VEX" (integer allowed)', validator.isAsset('10 VEX', 'VEX'));
assert('invalid "10.000 VEX" (3 decimals)', !validator.isAsset('10.000 VEX', 'VEX'));
assert('invalid "10.00000 VEX" (5 decimals)', !validator.isAsset('10.00000 VEX', 'VEX'));
assert('invalid "10.0000 EOS"', !validator.isAsset('10.0000 EOS', 'VEX'));
assert('invalid "abc VEX"', !validator.isAsset('abc VEX', 'VEX'));

// Generate valid base58 strings for tests
const base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
let b58_50 = '';
for (let i = 0; i < 50; i++) b58_50 += base58[i % base58.length];
const wif5 = '5' + b58_50;
const wifK = 'K' + b58_50;
const wifL = 'L' + b58_50;
const pubVEX = 'VEX' + b58_50;

// isPrivateKey tests
console.log('\n--- isPrivateKey ---');
assert('valid WIF starts with 5', validator.isPrivateKey(wif5));
assert('valid WIF starts with K', validator.isPrivateKey(wifK));
assert('valid WIF starts with L', validator.isPrivateKey(wifL));
assert('invalid "VEX..." (not WIF)', !validator.isPrivateKey('VEX123456789012345678901234567890123456789012345678901'));
assert('invalid empty', !validator.isPrivateKey(''));
assert('invalid short', !validator.isPrivateKey('5J123'));

// isPublicKey tests
console.log('\n--- isPublicKey ---');
assert('valid VEX prefix', validator.isPublicKey(pubVEX));
assert('invalid EOS prefix', !validator.isPublicKey('EOS' + b58_50));
assert('invalid empty', !validator.isPublicKey(''));

// hasResourceAmount tests
console.log('\n--- hasResourceAmount ---');
assert('NET > 0, CPU = 0', validator.hasResourceAmount('10.0000 VEX', '0.0000 VEX'));
assert('NET = 0, CPU > 0', validator.hasResourceAmount('0.0000 VEX', '10.0000 VEX'));
assert('both > 0', validator.hasResourceAmount('10.0000 VEX', '5.0000 VEX'));
assert('both = 0', !validator.hasResourceAmount('0.0000 VEX', '0.0000 VEX'));
assert('one empty', validator.hasResourceAmount('10.0000 VEX', ''));

// isBroadcasterUrl tests
console.log('\n--- isBroadcasterUrl ---');
assert('valid https', validator.isBroadcasterUrl('https://vexascan.com:8443'));
assert('valid http', validator.isBroadcasterUrl('http://localhost:8888'));
assert('valid with path', validator.isBroadcasterUrl('https://api.example.com/v1'));
assert('invalid ftp', !validator.isBroadcasterUrl('ftp://example.com'));
assert('invalid empty', !validator.isBroadcasterUrl(''));
assert('invalid no protocol', !validator.isBroadcasterUrl('vexascan.com:8443'));

// isWalletName tests
console.log('\n--- isWalletName ---');
assert('valid alphanumeric', validator.isWalletName('mywallet'));
assert('valid with underscore', validator.isWalletName('my_wallet'));
assert('valid with dash', validator.isWalletName('my-wallet'));
assert('valid mixed', validator.isWalletName('MyWallet123'));
assert('invalid empty', !validator.isWalletName(''));
assert('invalid spaces', !validator.isWalletName('my wallet'));
assert('invalid special chars', !validator.isWalletName('my@wallet'));
assert('too long', !validator.isWalletName('a'.repeat(65)));

// notEmpty tests
console.log('\n--- notEmpty ---');
assert('non-empty returns true', validator.notEmpty('test', 'Field') === true);

// fileExists tests
console.log('\n--- fileExists ---');
assert('package.json exists', validator.fileExists(path.resolve(__dirname, '../package.json')) === true);
assert('nonexistent returns false', validator.fileExists('/nonexistent/file.txt') === false);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);