import mongoose from 'mongoose'

console.log("Connecting to mongo database.")
mongoose.connect(process.env.MONGOOSE_DATABASE, { useNewUrlParser: true })
.then(val => console.log("Connected to mongo database."))
.catch(err => {console.log(`Can't connect to ${process.env.MONGOOSE_DATABASE}.`); process.exit(1);})

import Wallet from '../models/Wallet'
import Log from '../models/Log'
import Action from '../models/Action'

export default {
    /**
     * Save keypair into Mongo database
     * @param {Object} keyPair
     * @returns Promise
     */
    saveKeyPair(keyPair) {
        return new Promise((resolve, reject) => {
            try {
                const newWallet = new Wallet({public: keyPair.publicAddress, private: keyPair.privateKey})
                newWallet.save((err, document) => {
                    if(err) reject(err)
                    this.Log("Keypair saved for "+ document.public, "log")
                    resolve(document.public)
                })
            } catch (error) {
                reject(error)
            }
        })
    },

    /**
     * Returns wallet object by public address
     * @param {string} address
     * @returns Promise
     */
    getKeyPairByAddress(address) {
        return new Promise((resolve, reject) => {
            Wallet.findOne({public: address}, (err, wallet) => {
                if(err) {this.Log(err, "error"); reject(err)}
                if(wallet) {
                    resolve(wallet)
                }
                else
                    reject("Wallet can't be found")
            })
        })
    },

    /**
     * Save new action in database
     * @param {Object} action 
     */
    addAction(action) {
        const newAction = new Action({
            fromAddress: action.fromAddress,
            toAddress: action.toAddress,
            date: action.date,
            amount: action.amount,
        })
        newAction.save()
    },

    /**
     * Returns a array of recipients
     * @returns Promise
     */
    getRecipients() {
        return new Promise((resolve, reject) => {
            Action.find().distinct('toAddress', (error, address) => {
                if(error) { reject; return; }
                resolve(address)
            })
        })
    },

    /**
     * Logs information to the database
     * @param {string} message 
     * @param {string} type error, log or warning
     */
    Log(message, type = "log") {
        console.log(type, message)
        const log = new Log({message: message, type: type})
        log.save()
    }
}