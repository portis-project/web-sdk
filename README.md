<p align="center">
  <a href="https://portis.io/" target="_blank">
    <img alt="Portis" src="https://s3.amazonaws.com/portis-prod/assets/portis-logo/logo_with_name_medium.png" width="749">
  </a>
</p>

![](https://img.shields.io/npm/v/@portis/web3.svg?colorB=blue&style=flat)
![](https://img.shields.io/badge/chat-telegram-blue.svg)
[![Twitter](https://img.shields.io/badge/twitter-portis-blue.svg?style=flat)](https://twitter.com/portis_io)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/portis-project/web-sdk/blob/master/LICENSE.txt)
![](https://img.shields.io/github/stars/portis-project/web-sdk.svg?style=flat)

* ⚗️ [demo](https://codesandbox.io/s/3vm7kxmx5)
* 📕 [docs](https://docs.portis.io)
* 💬 [chat](https://t.me/portisHQ)

## Quick Start

It should take no more than 5 minutes to get started with Portis 🚀

1. Register a DApp in the [Portis Dashboard](https://dashboard.portis.io), and copy your DApp ID.

1. Install Portis and Web3

   ```shell
   npm install @portis/web3 web3
   ```

1. Import and initialize a web3 instance

   ```javascript
   import Portis from '@portis/web3';
   import Web3 from 'web3';

   const portis = new Portis('YOUR_DAPP_ID', 'mainnet');
   const web3 = new Web3(portis.provider);

   // If you want to tap into the Pocket Network use this alternative provider instead
   const web3 = new Web3(portis.pocketProvider);
   ```

1. Verify everything works by calling a web3 method such as getAccounts:

   ```javascript
   web3.eth.getAccounts((error, accounts) => {
     console.log(accounts);
   });
   ```

1. You are good to go! 👍

For more information see our [docs](https://docs.portis.io) 📕

## Quick Start using Pocket Network

Pocket and Portis have partnered up to bring the power of decentralized infrastructure to your Portis apps.

1. Register a DApp in the [Portis Dashboard](https://dashboard.portis.io), and copy your DApp ID.

1. Install Portis and Web3

   ```shell
   npm install @portis/web3 web3
   ```

1. Import and initialize a web3 instance

   ```javascript
   import Portis from '@portis/web3';
   import Web3 from 'web3';

   const portis = new Portis('YOUR_DAPP_ID', 'mainnet');
   const web3 = new Web3(portis.provider);
   ```

1. Verify everything works by calling a web3 method such as getAccounts:

   ```javascript
   web3.eth.getAccounts((error, accounts) => {
     console.log(accounts);
   });
   ```

1. You are good to go! 👍

For more information see our [docs](https://docs.portis.io) 📕

## License

MIT
