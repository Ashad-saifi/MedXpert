import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const keysDir = path.join(__dirname, 'keys');
const privateKeyPath = path.join(keysDir, 'private.pem');
const publicKeyPath = path.join(keysDir, 'public.pem');

let privateKey;
let publicKey;

// Self-healing RSA Keypair initialization
try {
  if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
    console.log("🔒 RSA Key Pair loaded successfully from disk.");
    privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    publicKey = fs.readFileSync(publicKeyPath, 'utf8');
  } else {
    console.log("🔑 RSA Key Pair not found. Generating a new 2048-bit RSA pair...");
    if (!fs.existsSync(keysDir)) {
      fs.mkdirSync(keysDir, { recursive: true });
    }
    const { privateKey: priv, publicKey: pub } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    fs.writeFileSync(privateKeyPath, priv);
    fs.writeFileSync(publicKeyPath, pub);
    privateKey = priv;
    publicKey = pub;
    console.log("🛡️ New RSA Key Pair generated and saved to disk.");
  }
} catch (error) {
  console.error("❌ Critical error during RSA initialization:", error);
}

/**
 * Hash and cryptographically sign prescription data using SHA256 RSA private key.
 * @param {string} data - Serialized prescription parameters
 * @returns {string} - Base64 encoded signature
 */
export function signPrescription(data) {
  try {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, 'base64');
  } catch (error) {
    console.error("❌ Signing failed:", error);
    return "";
  }
}

/**
 * Verify cryptographic signature of prescription data using RSA public key.
 * @param {string} data - Serialized prescription parameters
 * @param {string} signature - Base64 encoded signature
 * @returns {boolean} - Validation result
 */
export function verifyPrescription(data, signature) {
  try {
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, signature, 'base64');
  } catch (error) {
    console.error("❌ Verification failed:", error);
    return false;
  }
}
