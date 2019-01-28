# Portis

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

## Browser support

For security reasons, Portis supports "evergreen" browsers - the last versions of browsers that automatically update themselves.

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Safari | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari-ios/safari-ios_48x48.png" alt="iOS Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>iOS Safari | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_48x48.png" alt="Opera" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Opera |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| last 2 versions                                                                                                                                                                                       | last 2 versions                                                                                                                                                                                                   | last 2 versions                                                                                                                                                                                               | last 2 versions                                                                                                                                                                                               | last 2 versions                                                                                                                                                                                                               | last 2 versions                                                                                                                                                                                           |
