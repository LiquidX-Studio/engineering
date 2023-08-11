![LiquidXLogo.png](./img/LiquidXLogoDarkBg.png)

---

> Author: [Atiq Ahmed](https://www.linkedin.com/in/atiq-ahammed/) and [Shafiul Nobe](https://www.linkedin.com/in/shafiul-nobe/)

# Rescuing NFTs from a compromised wallet
In this article we describe how our team was able to retrieve some NFTs that were lost because of a compromised wallet. 

## Wallets and blockchain
In the blockchain, a wallet [e.g., metamask](https://metamask.io/) is a digital tool or application that allows users to securely store, manage, and transact with their cryptocurrency assets. The wallet is usually secured with a private key or seed phrase, which is used to sign and validate transactions on the blockchain. If someone gets access to the private key, that person can essentially steal anything that is in that compromised wallet.

## A compromised wallet
Our engineering team used a wallet for testing our web3 apps during development.  That wallet we used for testing had a small amount of Ether and a few [ERC-721](https://eips.ethereum.org/EIPS/eip-721) NFTs in the Etherium network. Somehow the private key of that testing wallet got stolen/hacked and the person who got access to that wallet was able to transfer __all__ the Ether from our wallet to his wallet. But the attacker left the NFTs in our test wallet.

### NFTs are stuck in the compromised wallet
Only a small amount of Ether was lost from our test wallet.  But, it was important for us to recover the NFTs from that wallet since our team used them for testing our Web3 apps.  We attempted to use the ERC-721's `setApprovalForAll` method to allow a different (not compromised) wallet to recover those NFTs using a single batch transaction.  However, our transfer attempts failed. To execute the batch transfer, we needed to have a small amount of Ether in the compromised wallet.  But, whenever we transferred any Ether to the compromised wallet was immediately transferred to the attacker's wallet __before__ we could initiate and complete the batch transfer transaction.

### A flaw in the attacker's Ether transfer logic
We carefully inspected the transactions in the attacker's wallet on Etherscan and found that it is transferring Ether from a number of compromised wallets in the same way. First, the attacker somehow gets hold of a wallet's private or seed phrases. Then the attacker sets up some process or script that listens to the emitted Ether transfer event signal and transfers any Ether that is sent to the compromised wallets to another wallet.  We noticed that the attacker's process does not transfer the Ether from a compromised wallet if the balance is __below__ the threshold value of `$1`.

## Recovery Process
### Wallet Nonce
In blockchain technology, a nonce is a random number that is included in the input data of a cryptographic hashing function to produce a specific output, known as a hash. The nonce used in a blockchain wallet is a sequential number that starts at 0 and increments by 1 for each subsequent transaction. The nonce value is used in combination with the private key of the wallet to create a digital signature that is included in the transaction data. This signature is used to verify that the transaction was indeed initiated by the __owner__ of the wallet, and __not__ by a malicious actor attempting to gain unauthorized access to the wallet or its assets.  The Nonce prevents the replay attack, i.e., when an attacker intercepts a transaction and re-broadcasts it for it to get executed again.

> Notice that if there are multiple transactions pending in blockchain pool with the __same nonce value__ for a wallet, then miners pick the transaction first which has the higher gas fee. And when that transaction gets completed, all other transactions with the same nonce get cancelled.

### Replacing a Transaction in Blockchain using wallet nonce
It is possible to replace a pending blockchain transaction with a new one with a higher gas fee or a higher nonce value using the following steps:

1. Create a new transaction with the __same nonce__ value as the original transaction, but with a higher gas fee. This new transaction must also have the __same recipient address__ and the __same amount of cryptocurrency__ as the original transaction
2. Send the new transaction to the network. The miners will prioritize the transaction with the higher gas fee, and it will replace the original transaction in the mempool
3. Verify that the original transaction to be dropped from the mempool and the new transaction with the higher gas fee has been executed 

>Caution: It is important to note that not all blockchain networks support transaction replacement, and some may have specific requirements or restrictions. Also, replacing a transaction with a higher gas fee can be costly, so it is important to carefully consider the gas price before initiating a replacement transaction.

### How we recovered our NFTs
Our goal was to somehow have enough Ether in our compromised wallet without the attacker stealing it and execute the `setApprovalForAll` [method](https://docs.openzeppelin.com/contracts/2.x/api/token/erc721#IERC721-setApprovalForAll-address-bool-) to enable a secure wallet that could retrieve all NFTs out of the compromised wallet in a single transaction.  We used the following steps:

- Create a pending transaction
  1. We first transferred a 0.8$ or equivalent Ether to our hacked account
  2. The hacker's script/process did __not__ transfer the Ether of the wallet balance is less than `$1` threshold
  3. We initiate the `setApprovalForAll` transaction with nonce `11` and lower gas fee `8` Gwei. And it was pending as the gas fee was too __low__
- Transfer sufficient Ether without it getting stolen (block attacker's process)
  1. We transferred `$2.5` equivalent Ether to our compromised wallet
  2. Detecting the Ether transfer event (over the `$1` threshold), the attacker's process initiated a transaction to steal the Ether and this transaction had the nonce value of `12`
  3. But, the attacker's transaction *did not* get completed as it was stuck behind our incomplete transaction with the lower nonce value of `11`
  4. Our compromised wallet at that point of time had sufficient amount of Ether to speed up our *original* `setApprovalForAll` transaction  
- Execute our pending transaction using a higher gas fee
  1. We replaced our original transaction with the __same data__, __same nonce__ value of `11` but with a *higher* gas fee of `26 Gwei`
  2. Our original transaction for `setApprovalForAll` submitted with `8 Gwei` was __cancelled__ and the new/sped-up transaction was picked by the miners and got completed
  3. Once our transaction with the high gas fee was completed, our secure wallet got the permission to transfer the NFTs from the compromised wallet. 
- Retrieve our NFTs
  - We then transferred all of our NFTs to a secure wallet using a single batch transfer.