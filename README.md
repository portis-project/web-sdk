<p align="center">
  <a href="https://portis.io/" target="_blank">
    <img alt="Portis" src="https://s3.amazonaws.com/portis-prod/assets/portis-logo/logo_with_name_medium.png" width="749">
  </a>
</p>


* ⚗️ [demo](https://codesandbox.io/s/3vm7kxmx5)
* 📕 [docs](http://docs.portis.io)
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
   ```

1. Verify everything works by calling a web3 method such as getAccounts:

   ```javascript
   web3.eth.getAccounts((error, accounts) => {
     console.log(accounts);
   });
   ```

1. You are good to go! 👍

## License

MIT
