import ProviderEngine from '@portis/web3-provider-engine';
import CacheSubprovider from '@portis/web3-provider-engine/subproviders/cache.js';
import FixtureSubprovider from '@portis/web3-provider-engine/subproviders/fixture.js';
import FilterSubprovider from '@portis/web3-provider-engine/subproviders/filters.js';
import HookedWalletSubprovider from '@portis/web3-provider-engine/subproviders/hooked-wallet.js';
import NonceSubprovider from '@portis/web3-provider-engine/subproviders/nonce-tracker.js';
import SubscriptionsSubprovider from '@portis/web3-provider-engine/subproviders/subscriptions.js';
import Penpal, { AsyncMethodReturns } from 'penpal';
import { networkAdapter } from './networks';
import { ISDKConfig, IConnectionMethods, INetwork, IOptions, BTCSignTxInput, BTCSignTxOutput } from './interfaces';
import { getTxGas } from './utils/getTxGas';
import { Query } from './utils/query';
import { onWindowLoad } from './utils/onWindowLoad';
import { styles } from './styles';
import { validateSecureOrigin } from './utils/secureOrigin';
import { Pocket, PocketAAT, PocketProvider, TransactionSigner, Transaction } from '@pokt-network/web3-provider';

const VERSION = '$$PORTIS_SDK_VERSION$$';
const WIDGET_URL = 'https://widget.portis.io';
const STAGING_WIDGET_URL = 'https://widget-staging.portis.io';
const SUPPORTED_SCOPES = ['email', 'reputation'];
const PORTIS_IFRAME_CLASS = 'por_portis-iframe';
const PORTIS_CONTAINER_CLASS = 'por_portis-container';

const tempCachingIFrame = document.createElement('iframe');
tempCachingIFrame.className = PORTIS_IFRAME_CLASS;
tempCachingIFrame.style.width = '0';
tempCachingIFrame.style.height = '0';
tempCachingIFrame.style.border = 'none';
tempCachingIFrame.style.position = 'absolute';
tempCachingIFrame.style.top = '-999px';
tempCachingIFrame.style.left = '-999px';
tempCachingIFrame.src = WIDGET_URL;
onWindowLoad().then(() => {
  if (document.getElementsByClassName(PORTIS_IFRAME_CLASS).length) {
    console.warn(
      `Portis script was already loaded. This might cause unexpected behavior. If loading with a <script> tag, please make sure that you only load it once.`,
    );
  }
  document.body.appendChild(tempCachingIFrame);
});

export default class Portis {
  config: ISDKConfig;
  widget: Promise<{
    communication: AsyncMethodReturns<IConnectionMethods>;
    iframe: HTMLIFrameElement;
    widgetFrame: HTMLDivElement;
  }>;
  provider;
  private _selectedAddress: string;
  private _network: string;
  private _widgetUrl = WIDGET_URL;
  private _onLoginCallback: (walletAddress: string, email?: string, reputation?: string) => void;
  private _onLogoutCallback: () => void;
  private _onActiveWalletChangedCallback: (walletAddress: string) => void;
  private _onErrorCallback: (error: Error) => void;
  private _pocket?: Pocket = undefined;
  private _pocketAAT?: PocketAAT = undefined;
  private _txSigner?: TransactionSigner = undefined;

  constructor(dappId: string, network: string | INetwork, options: IOptions = {}) {
    validateSecureOrigin();
    this._checkIfWidgetAlreadyInitialized();
    this._validateParams(dappId, network, options);
    this.config = {
      dappId,
      network: networkAdapter(network, options.gasRelay),
      version: VERSION,
      scope: options.scope,
      registerPageByDefault: options.registerPageByDefault,
    };

    if (options.pocket !== undefined) {
      if (options.pocketAAT === undefined || options.accounts === undefined || options.privateKeys === undefined) {
        throw new Error(
          "[Portis] illegal 'node protocol' parameter. In order to use the Pocket Network you need to provide a Pocket AAT object an accounts object and a privateKeys in the options",
        );
      }

      const ethTxSigner = {
        hasAddress: async function(address: string) {
          let accounts: Array<string> = options.accounts == undefined ? [] : options.accounts;
          return accounts.includes(address.toUpperCase());
        },
        signTransaction: async function(txParams) {
          try {
            let privateKeys: Array<string> = options.privateKeys == undefined ? [] : options.privateKeys;
            const pkString = privateKeys[0];
            const privateKeyBuffer = Buffer.from(pkString, 'hex');
            const tx = new Transaction(txParams, {
              chain: this.chain,
            });
            tx.sign(privateKeyBuffer);
            return '0x' + tx.serialize().toString('hex');
          } catch (error) {
            return error;
          }
        },
      };

      const ethTransactionSigner = new TransactionSigner(
        options.accounts,
        options.privateKeys,
        ethTxSigner.hasAddress,
        ethTxSigner.signTransaction,
      );

      this._pocketAAT = options.pocketAAT;
      this._pocket = options.pocket;
      this._txSigner = ethTransactionSigner;
    }

    this.widget = this._initWidget();
    this.provider = this._pocket === undefined ? this._initProvider(options) : this._initPocketProvider();
  }

  changeNetwork(network: string | INetwork, gasRelay?: boolean) {
    const newNetwork = networkAdapter(network, gasRelay);
    this.clearSubprovider(NonceSubprovider);
    this.clearSubprovider(CacheSubprovider);
    this.config.network = newNetwork;
  }

  setDefaultEmail(email: string) {
    this.config.defaultEmail = email;
  }

  async showPortis() {
    const widgetCommunication = (await this.widget).communication;
    return widgetCommunication.showPortis(this.config);
  }

  async logout() {
    const widgetCommunication = (await this.widget).communication;
    return widgetCommunication.logout();
  }

  onLogin(callback: (walletAddress: string, email?: string, reputation?: string) => void) {
    this._onLoginCallback = callback;
  }

  onLogout(callback: () => void) {
    this._onLogoutCallback = callback;
  }

  onActiveWalletChanged(callback: (walletAddress: string) => void) {
    this._onActiveWalletChangedCallback = callback;
  }

  onError(callback: (error: Error) => void) {
    this._onErrorCallback = callback;
  }

  async getExtendedPublicKey(path: string = "m/44'/60'/0'/0/0", coin: string = 'Ethereum') {
    const widgetCommunication = (await this.widget).communication;
    return widgetCommunication.getExtendedPublicKey(path, coin, this.config);
  }

  async importWallet(mnemonicOrPrivateKey: string) {
    const widgetCommunication = (await this.widget).communication;
    return widgetCommunication.importWallet(mnemonicOrPrivateKey, this.config);
  }

  async isLoggedIn() {
    const widgetCommunication = (await this.widget).communication;
    return widgetCommunication.isLoggedIn();
  }

  async signBitcoinTransaction(params: {
    coin: string;
    inputs: BTCSignTxInput[];
    outputs: BTCSignTxOutput[];
    locktime?: number;
    version?: number;
  }) {
    const widgetCommunication = (await this.widget).communication;
    return widgetCommunication.signBitcoinTransaction(params, this.config);
  }

  async showBitcoinWallet(path: string = "m/49'/0'/0'/0/0") {
    const widgetCommunication = (await this.widget).communication;
    return widgetCommunication.showBitcoinWallet(path, this.config);
  }

  private _checkIfWidgetAlreadyInitialized() {
    if (document.getElementsByClassName(PORTIS_CONTAINER_CLASS).length) {
      console.warn(
        'An instance of Portis was already initialized. This is probably a mistake. Make sure that you use the same Portis instance throughout your app.',
      );
    }
  }

  private _validateParams(dappId: string, network: string | INetwork, options: IOptions) {
    if (!dappId) {
      throw new Error("[Portis] 'dappId' is required. Get your dappId here: https://dashboard.portis.io");
    }

    if (!network) {
      throw new Error(
        "[Portis] 'network' is required. Read more about it here: https://docs.portis.io/#/configuration?id=network",
      );
    }

    if (options.scope) {
      if (!Array.isArray(options.scope)) {
        throw new Error(
          "[Portis] 'scope' must be an array. Read more about it here: https://docs.portis.io/#/configuration?id=scope",
        );
      }

      const unknownScope = options.scope.filter(item => SUPPORTED_SCOPES.indexOf(item) < 0);
      if (unknownScope.length > 0) {
        throw new Error(
          "[Portis] invalid 'scope' parameter. Read more about it here: https://docs.portis.io/#/configuration?id=scope",
        );
      }
    }

    if (options.registerPageByDefault !== undefined && typeof options.registerPageByDefault !== 'boolean') {
      throw new Error(
        "[Portis] invalid 'registerPageByDefault' parameter, must be a boolean. Read more about it here: https://docs.portis.io/#/configuration?id=registerPageByDefault",
      );
    }

    if (options.staging) {
      console.warn('Please note: you are using the Portis STAGING environment.');
      this._widgetUrl = STAGING_WIDGET_URL;
    }
  }

  private async _initWidget(): Promise<{
    communication: AsyncMethodReturns<IConnectionMethods>;
    iframe: HTMLIFrameElement;
    widgetFrame: HTMLDivElement;
  }> {
    await onWindowLoad();
    if (document.body.contains(tempCachingIFrame)) {
      document.body.removeChild(tempCachingIFrame);
    }

    const style = document.createElement('style');
    style.innerHTML = styles;

    const container = document.createElement('div');
    container.className = PORTIS_CONTAINER_CLASS;

    const widgetFrame = document.createElement('div');
    widgetFrame.id = `portis-container-${Date.now()}`;
    widgetFrame.className = 'por_portis-widget-frame';

    container.appendChild(widgetFrame);
    document.body.appendChild(container);
    document.head.appendChild(style);

    const connection = Penpal.connectToChild<IConnectionMethods>({
      url: this._widgetUrl,
      appendTo: document.getElementById(widgetFrame.id)!,
      methods: {
        setHeight: this._setHeight.bind(this),
        getWindowSize: this._getWindowSize.bind(this),
        onLogin: this._onLogin.bind(this),
        onLogout: this._onLogout.bind(this),
        onActiveWalletChanged: this._onActiveWalletChanged.bind(this),
        onError: this._onError.bind(this),
      },
    });

    connection.iframe.style.position = 'absolute';
    connection.iframe.style.height = '100%';
    connection.iframe.style.width = '100%';
    connection.iframe.style.border = '0 transparent';

    const communication = await connection.promise;
    communication.retrieveSession(this.config);

    return { communication, iframe: connection.iframe, widgetFrame };
  }

  private _initPocketProvider() {
    const provider = new PocketProvider(this.config.network.chainId, this._pocketAAT, this._pocket, this._txSigner);
    return provider;
  }

  private _initProvider(options: IOptions) {
    const engine = new ProviderEngine();
    const query = new Query(engine);

    engine.send = (payload, callback) => {
      // Web3 1.0 beta.38 (and above) calls `send` with method and parameters
      if (typeof payload === 'string') {
        return new Promise((resolve, reject) => {
          engine.sendAsync(
            {
              jsonrpc: '2.0',
              id: 42,
              method: payload,
              params: callback || [],
            },
            (error, response) => {
              if (error) {
                reject(error);
              } else {
                resolve(response.result);
              }
            },
          );
        });
      }

      // Web3 1.0 beta.37 (and below) uses `send` with a callback for async queries
      if (callback) {
        engine.sendAsync(payload, callback);
        return;
      }

      let result: any = null;
      switch (payload.method) {
        case 'eth_accounts':
          result = this._selectedAddress ? [this._selectedAddress] : [];
          break;

        case 'eth_coinbase':
          result = this._selectedAddress ? [this._selectedAddress] : [];
          break;

        case 'net_version':
          result = this._network;
          break;

        case 'eth_uninstallFilter':
          engine.sendAsync(payload, _ => _);
          result = true;
          break;

        default:
          var message = `The Portis Web3 object does not support synchronous methods like ${
            payload.method
          } without a callback parameter.`;
          throw new Error(message);
      }

      return {
        id: payload.id,
        jsonrpc: payload.jsonrpc,
        result: result,
      };
    };

    engine.addProvider(
      new FixtureSubprovider({
        web3_clientVersion: `Portis/v${this.config.version}/javascript`,
        net_listening: true,
        eth_hashrate: '0x00',
        eth_mining: false,
        eth_syncing: true,
      }),
    );

    engine.addProvider(new CacheSubprovider());
    engine.addProvider(new SubscriptionsSubprovider());
    engine.addProvider(new FilterSubprovider());
    engine.addProvider(new NonceSubprovider());
    engine.addProvider({
      setEngine: _ => _,
      handleRequest: async (payload, next, end) => {
        if (!payload.id) {
          payload.id = 42;
        }
        next();
      },
    });

    engine.addProvider(
      new HookedWalletSubprovider({
        getAccounts: async cb => {
          const widgetCommunication = (await this.widget).communication;
          const { error, result } = await widgetCommunication.getAccounts(this.config);
          if (!error && result) {
            this._selectedAddress = result[0];
          }
          cb(error, result);
        },
        signTransaction: async (txParams, cb) => {
          const widgetCommunication = (await this.widget).communication;
          const { error, result } = await widgetCommunication.signTransaction(txParams, this.config);
          cb(error, result);
        },
        signMessage: async (msgParams, cb) => {
          const widgetCommunication = (await this.widget).communication;
          const params = Object.assign({}, msgParams, { messageStandard: 'signMessage' });
          const { error, result } = await widgetCommunication.signMessage(params, this.config);
          cb(error, result);
        },
        signPersonalMessage: async (msgParams, cb) => {
          const widgetCommunication = (await this.widget).communication;
          const params = Object.assign({}, msgParams, { messageStandard: 'signPersonalMessage' });
          const { error, result } = await widgetCommunication.signMessage(params, this.config);
          cb(error, result);
        },
        signTypedMessage: async (msgParams, cb) => {
          const widgetCommunication = (await this.widget).communication;
          const params = Object.assign({}, msgParams, { messageStandard: 'signTypedMessage' });
          const { error, result } = await widgetCommunication.signMessage(params, this.config);
          cb(error, result);
        },
        signTypedMessageV3: async (msgParams, cb) => {
          const widgetCommunication = (await this.widget).communication;
          const params = Object.assign({}, msgParams, { messageStandard: 'signTypedMessageV3' });
          const { error, result } = await widgetCommunication.signMessage(params, this.config);
          cb(error, result);
        },
        estimateGas: async (txParams, cb) => {
          const gas = await getTxGas(query, txParams);
          cb(null, gas);
        },
        getGasPrice: async cb => {
          cb(null, '');
        },
      }),
    );

    engine.addProvider({
      setEngine: _ => _,
      handleRequest: async (payload, next, end) => {
        const widgetCommunication = (await this.widget).communication;
        const { error, result } = await widgetCommunication.relay(payload, this.config);
        if (payload.method === 'net_version') {
          this._network = result;
          engine.networkVersion = this._network;
        }
        end(error, result);
      },
    });

    engine.enable = () =>
      new Promise((resolve, reject) => {
        engine.sendAsync({ method: 'eth_accounts' }, (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response.result);
          }
        });
      });

    engine.isConnected = () => {
      return true;
    };

    engine.isPortis = true;

    engine.on('error', error => {
      if (error && error.message && error.message.includes('PollingBlockTracker')) {
        console.warn('If you see this warning constantly, there might be an error with your RPC node.');
      } else {
        console.error(error);
      }
    });

    engine.start();
    return engine;
  }

  private async _setHeight(height: number) {
    const widgetFrame = (await this.widget).widgetFrame;
    widgetFrame.style.height = `${height}px`;
  }

  private _getWindowSize() {
    const body = document.getElementsByTagName('body')[0];
    const width = window.innerWidth || document.documentElement.clientWidth || body.clientWidth;
    const height = window.innerHeight || document.documentElement.clientHeight || body.clientHeight;
    return { width, height };
  }

  private _onLogin(walletAddress: string, email?: string, reputation?: string) {
    if (this._onLoginCallback) {
      this._onLoginCallback(walletAddress, email, reputation);
    }
  }

  private _onLogout() {
    this._selectedAddress = '';
    if (this._onLogoutCallback) {
      this._onLogoutCallback();
    }
  }

  private _onActiveWalletChanged(walletAddress: string) {
    if (this._onActiveWalletChangedCallback) {
      this._onActiveWalletChangedCallback(walletAddress);
    }
  }

  private _onError(error: Error) {
    if (this._onErrorCallback) {
      this._onErrorCallback(error);
    }
  }

  private clearSubprovider(subproviderType) {
    const subprovider = this.provider._providers.find(subprovider => subprovider instanceof subproviderType);
    this.provider.removeProvider(subprovider);
    this.provider.addProvider(new subproviderType());
  }
}
