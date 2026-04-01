// sample2_hardcoded_jwt.js
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'my-super-secret-key-that-is-hardcoded'; // Hardcoded secret

function generateToken(user) {
    return jwt.sign({ id: user.id }, SECRET_KEY, { algorithm: 'HS256' });
}

const apiKey = "12345678-abcd-1234-abcd-1234567890ab"; // Hardcoded API Key
