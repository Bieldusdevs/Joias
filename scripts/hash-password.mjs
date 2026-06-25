import crypto from 'crypto';

const password = process.argv[2];
if (!password) {
  console.error('Uso: node scripts/hash-password.mjs "sua-senha-forte"');
  process.exit(1);
}
const salt = crypto.randomBytes(16).toString('base64url');
const iterations = 210000;
const digest = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64url');
console.log(`pbkdf2_sha256$${iterations}$${salt}$${digest}`);
