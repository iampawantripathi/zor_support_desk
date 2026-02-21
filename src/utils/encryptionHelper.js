const crypto = require('crypto');

const ENC_DEC_SECRET = process.env.ENC_DEC_SECRET;
const ENC_DEC_METHOD = process.env.ENC_DEC_METHOD;

// Hash the secret to get a 32-byte key for AES-256
const key = crypto.createHash('sha256').update(ENC_DEC_SECRET).digest();
const iv = Buffer.from(ENC_DEC_SECRET.slice(0, 16), 'utf8');

function jsencode_api(data) {
    try {
        const cipher = crypto.createCipheriv(ENC_DEC_METHOD, key, iv);
        console.log("cipher",cipher);
        let encrypted = cipher.update(data, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    } catch (err) {
        console.error('Encryption error:', err.message);
        return null;
    }
}

function jsdecode_api(encryptedData) {
    try {
        const decipher = crypto.createDecipheriv(ENC_DEC_METHOD, key, iv);
        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.error('Decryption error:', err.message);
        return null;
    }
}

module.exports = {
    jsencode_api,
    jsdecode_api
};
