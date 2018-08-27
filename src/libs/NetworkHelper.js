import MongooseHelper from '../libs/MongooseHelper'
import fetch from 'node-fetch'

export default {
    /**
     * Push address to queue.
     * @param {String} publicAddress
     * @returns void
     */
    enqueue(publicAddress){
        try {
            fetch(process.env.API_HOST+"/address", {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
              },
              body: JSON.stringify({address: publicAddress}) })
              .then(_ => MongooseHelper.Log("Push to webapp the address "+ publicAddress, ))
              .catch(err => MongooseHelper.Log("Can't enqueue public address", "error"))
        } catch (error) {
            MongooseHelper.Log("Invalid public address.", "error")
        }
    },

    /**
     * Returns queue length
     * @returns Promise
     */
    getQueueCount() {
        return new Promise((resolve, reject) => {
            try {
                fetch(process.env.API_HOST+"/address")
                .then(res => res.text())
                .then(body => JSON.parse(body).queue)
                .then(queue => resolve(Object.keys(queue).length))
                .catch(err => MongooseHelper.Log("Can't reach /address endpoint.", "error"))
            } catch (error) {
                MongooseHelper.Log(error, "error")
            }
        })
    },

    /**
     * Returns fetched actions
     * @returns Promise
     */
    getActions() {
        return new Promise((resolve, reject) => {
            try{
                fetch(process.env.API_HOST+"/action")
                .then(res => res.text())
                .then(body => JSON.parse(body).actions)
                .then(actions => resolve(actions))
                .catch(err => MongooseHelper.Log("Can't reach /action endpoint.", "error"))
            } catch (error) {
                MongooseHelper.Log(error, "error")
            }
        })
    },

    /**
     * Update action's status and/or txhash by id
     * @param {Number} id 
     * @param {String} status 
     * @param {String} txhash 
     * @param {String} endpoint
     * @returns void
     */
    updateAction(id, status, txhash, endpoint) {
        try {
            fetch(process.env.API_HOST+"/"+endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
              },
              body: JSON.stringify({id: id, status: status, txhash: txhash}) })
              .catch(err => console.log(err))
            MongooseHelper.Log(`Update id ${id} with status ${status}`, )
        } catch (error) {
            MongooseHelper.Log(error, "error")
        }
    },
}