import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

export default {
    /**
     * Encrypt a string
     * @param {Object} text 
     * @returns Promise
     */
    encrypt(text, encryption_key = process.env.ENCRYPTION_KEY) {
        if(!this.canEncrypt()) return Promise.reject(`Can't encrypt.`)
        let iv = crypto.randomBytes(IV_LENGTH);
        let cipher = crypto.createCipheriv('aes-256-cbc', new Buffer(encryption_key), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);        
        return Promise.resolve(iv.toString('hex') + ':' + encrypted.toString('hex'));
    },
    
    /**
     * Decrypt a string
     * @param {Object} text 
     * @returns Promise
     */
    decrypt(text, encryption_key = process.env.ENCRYPTION_KEY) {
        return new Promise((resolve, reject) => {
            if(!this.canEncrypt()) reject("Can't decrypt")
            let textParts = text.split(':');
            let iv = new Buffer(textParts.shift(), 'hex');
            let encryptedText = new Buffer(textParts.join(':'), 'hex');
            let decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer(encryption_key), iv);
            let decrypted = decipher.update(encryptedText);            
            decrypted = Buffer.concat([decrypted, decipher.final()]);            
            resolve(decrypted.toString());
        })
    },
    
    canEncrypt(){ return (process.env.ENCRYPTION_KEY) ? true : process.exit(1);}
}