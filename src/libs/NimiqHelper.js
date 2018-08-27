import Nimiq from '@nimiq/core';
import MongooseHelper from './MongooseHelper';
import CryptoHelper from './CryptoHelper';
import NetworkHelper from './NetworkHelper';

let $ = {}

const {
    NIMIQ_NETWORK,
    NIMIQ_TRANSACTION_FEE,
} = process.env;

export default {
    async connect() {
        $.established = false;
        Nimiq.GenesisConfig[NIMIQ_NETWORK].call(this);

        console.log("Connecting to Nimiq Network: "+ NIMIQ_NETWORK);
        $.consensus = await Nimiq.Consensus.nano();
        
        $.blockchain = $.consensus.blockchain;
        $.mempool = $.consensus.mempool;
        $.network = $.consensus.network;
        
        $.consensus.on('established', () => this._onConsensusEstablished($));
        $.consensus.on('lost', () => {
            $.established = false;
            console.error('Consensus lost');
        });
        $.blockchain.on('head-changed', () => $.established ? this._onHeadChanged() : undefined)
        
        $.network.connect();
        
        $.isEstablished = this.isEstablished.bind(this);
        $.sendTransaction = this._sendTransaction.bind(this);
        $.getHeight = this._getHeight.bind(this);
    },

    /**
    * Returns a new public/private keypair.
    * @returns Promise
    */
    async generateAddress() {
        const wallet = await Nimiq.Wallet.generate();
        const privateKey = wallet.keyPair.privateKey.toHex();
        const publicAddress = wallet.address.toUserFriendlyAddress();
        return (publicAddress == undefined || privateKey == undefined) ? Promise.reject(`Public/private not defined.`) : Promise.resolve({publicAddress, privateKey});
    },
    
    async _sendTransaction(privateKey, destinationFriendlyAddress, coins, callback) {
        if (!$.established) {
            return console.log(`Can't send transactions when consensus not established`);
        }
        
        console.log('sendTransaction', destinationFriendlyAddress, coins);
        const destinationAddress = Nimiq.Address.fromUserFriendlyAddress(destinationFriendlyAddress);
        const satoshis = Nimiq.Policy.coinsToSatoshis(coins);
        // get the wallet of the author
        const wallet = this.getWalletFromPrivateKey(privateKey);
        
        const isMempoolAvailable = ($) => $.mempool.getTransactions().length < Nimiq.Mempool.SIZE_MAX;
        const canSendFreeTransaction = ($, senderAddress) => $.mempool.getPendingTransactions(senderAddress).length < Nimiq.Mempool.FREE_TRANSACTIONS_PER_SENDER_MAX;
        
        const senderAddress = wallet.address;
        if (isMempoolAvailable($) === false || canSendFreeTransaction($, senderAddress) === false) {
            console.log(`Mempool transactions full or no free transactions left`);
            return;
        }
        
        // else proceed with the free transaction
        let transaction = wallet.createTransaction(
            destinationAddress, // who we are sending to
            satoshis, // amount in satoshi (no decimal format)
            parseInt(NIMIQ_TRANSACTION_FEE), // fee
            $.consensus.blockchain.head.height);
            
            $.mempool.on('transaction-added', async tx2 => {
                if(transaction.equals(tx2)) {
                    await callback({status:"pending", txhash: tx2.hash().toHex()})
                }
            })
            const id = $.mempool.on('transaction-mined', async tx2 => {
                if (transaction.equals(tx2)) {
                    const logMessage = `Block height ${$.blockchain.height} transaction mined ${tx2.hash().toHex()}`;
                    console.log(logMessage);
                    if (callback) {
                        await callback({status:"mined", txhash: null});
                    }
                    $.mempool.off('transaction-mined', id);
                } else {
                    // if there was an issue its possible that the transaction never gets sent. E.g. insufficient funds
                    // might have to do a current block height versus heightAttempted check, but means need to do a db read
                }
            });

            let recipients = await MongooseHelper.getRecipients()
            recipients = recipients.map(x => this.getWalletFromUserFriendlyAddress(x))

            $.consensus.subscribeAccounts(recipients);
            try {
                await $.consensus.relayTransaction(transaction);
                console.log('relayTransaction, waiting to confirm', transaction.hash().toHex());
            } catch (e) {
                console.error('Error encountered with relayTransaction', e);
                if (callback) {
                    await callback({status:"failed", txhash: null});
                }
            }
        },

        isEstablished() { $.established },

        _onConsensusEstablished() {
            console.log('Consensus established.');
            $.established = true;
            console.log('height:', $.blockchain.height);
        },

        _onHeadChanged() {console.log("Head changed to:"+ $.blockchain.height)},

        _getHeight($) { return $.blockchain.height; },

        getWalletFromUserFriendlyAddress(address) { return Nimiq.Address.fromUserFriendlyAddress(address); },
        
        getWalletFromPrivateKey(privateKey) {
            const key = new Nimiq.PrivateKey(Buffer.from(privateKey, 'hex'));
            const keyPair = Nimiq.KeyPair.derive(key);
            return new Nimiq.Wallet(keyPair);
        },
        
        /**
        * Proccess an action into a transaction.
        * @param {Object} action 
        * @param {String} endpoint
        */
        async transaction(action, endpoint) {
            try {
                const fromKeyPair = await MongooseHelper.getKeyPairByAddress(action.fromAddress)
                let fromPrivateKey = await CryptoHelper.decrypt(fromKeyPair.private)                
                let funds = parseInt(action.amount)

                this._sendTransaction(fromPrivateKey, action.toAddress, funds, status =>
                    NetworkHelper.updateAction(action._id, status.status, status.txhash, endpoint)) 
                fromPrivateKey = null
            } catch (error) {
                MongooseHelper.Log(error, "Can't process transaction")
            }
        }
    }