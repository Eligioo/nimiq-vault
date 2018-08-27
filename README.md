# nimiq-vault

Vault is made to separate the private keys from the application that was build on top of Nimiq to increase security.
The generation of public/private key pairs (wallet pair) is done on the side of the Vault.

The application that wants to take advantage of storing wallet information within the Vault has to implement 4 endpoints that the Vault can access:

- GET /address
- POST /address

- GET /action
- POST /action

# GET /address
A list of public addresses received from the Vault. Whenever the application needs a new public address, it pops one from the queue. Every X seconds (specified in the .env.sample), Vault tries to fetch the queue and counts how many addresses are still in the queue.

# POST /address
In the .env.sample is an propery called QUEUE_LENGTH. Vault will generate and push new public addresses to the application until the QUEUE_LENGTH is reached in the GET /address endpoint.

# GET /action
This endpoint has to be a list of transactions (named as action) that the Vault needs to make. One action needs at least to contain a 'from'-address, a 'to'-address and the amount of NIM that needed to be send to the 'to'-address. The 'from'-address keypair already needs to be in the Vault. 

# POST /action
Vault will update the transaction status over this endpoint. Once the Vault updates a transaction status it should be removed from the GET /action endpoint since the Vault will do every action that it receives from /GET action. There are 3 possible statuses the Vault will send:
- pending: transaction is now in the mempool
- mined: transaction got picked up by a miner and is now mined.
- failed: includes an error why the transaction has failed.
