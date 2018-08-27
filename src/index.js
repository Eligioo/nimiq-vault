import './config.js'
import NimiqHelper from './libs/NimiqHelper';
import MongooseHelper from './libs/MongooseHelper'
import NetworkHelper from './libs/NetworkHelper'
import CryptoHelper from './libs/CryptoHelper'
import Mnemonic from './utils/Mnemonic'

NimiqHelper.connect();
 
/**
 * Generate a new keypair and enqueue it.
 * @returns void
 */
async function generateAndEnqueueWallet() {
    try {
        const keyPair = await NimiqHelper.generateAddress()
        const encrypted = await CryptoHelper.encrypt(keyPair.privateKey)
        const encryptedKeyPair = {publicAddress: keyPair.publicAddress, privateKey: encrypted}
        const address = await MongooseHelper.saveKeyPair(encryptedKeyPair)
        NetworkHelper.enqueue(address)
    } catch (error) {
        MongooseHelper.Log(error, "Can't generate wallet")
    }
}

setInterval(async () => {
    const queueCount = await NetworkHelper.getQueueCount();
    const queueShortage = process.env.QUEUE_LENGTH - queueCount;
        for (let index = 0; index < queueShortage; index++)
            generateAndEnqueueWallet()
    
    const actions = await NetworkHelper.getActions()
    actions.map(a => {
        MongooseHelper.addAction(a)
        NimiqHelper.transaction(a, "action")
    })
}, process.env.POLL_TIME)