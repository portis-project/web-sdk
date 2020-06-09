import ProviderEngine from '@portis/web3-provider-engine';
import CacheSubprovider from '@portis/web3-provider-engine/subproviders/cache.js';
import FixtureSubprovider from '@portis/web3-provider-engine/subproviders/fixture.js';
import FilterSubprovider from '@portis/web3-provider-engine/subproviders/filters.js';
import HookedWalletSubprovider from '@portis/web3-provider-engine/subproviders/hooked-wallet.js';
import NonceSubprovider from '@portis/web3-provider-engine/subproviders/nonce-tracker.js';
import SubscriptionsSubprovider from '@portis/web3-provider-engine/subproviders/subscriptions.js';
import Penpal, { AsyncMethodReturns } from 'penpal';
import { networkAdapter } from './networks';
import { ISDKConfig, IConnectionMethods, INetwork, IOptions } from './interfaces';
import { getTxGas } from './utils/getTxGas';
import { Query } from './utils/query';
import { styles } from './styles';
import { validateSecureOrigin } from './utils/secureOrigin';
import { Pocket, PocketAAT, typeGuard, RpcError, RelayResponse, ConsensusNode } from '@pokt-network/pocket-js';

const version = '$$PORTIS_SDK_VERSION$$';
const widgetUrl = 'https://widget.portis.io';
const supportedScopes = ['email', 'reputation'];

export default class Portis {
  config: ISDKConfig;
  widget: Promise<{
    communication: AsyncMethodReturns<IConnectionMethods>;
    iframe: HTMLIFrameElement;
    widgetFrame: HTMLDivElement;
  }>;
  provider;
  private noncesCache = {};
  private _selectedAddress: string;
  private _network: string;
  private _widgetUrl = widgetUrl;
  private _onLoginCallback: (walletAddress: string, email?: string, reputation?: string) => void;
  private _onLogoutCallback: () => void;
  private pocket?: Pocket = undefined;
  private pocketAAT?: PocketAAT = undefined;

  constructor(dappId: string, network: string | INetwork, options: IOptions = {}) {
    validateSecureOrigin();
    this._valiadateParams(dappId, network, options);
    this.config = {
      dappId,
      network: networkAdapter(network, options.gasRelay),
      version,
      scope: options.scope,
      registerPageByDefault: options.registerPageByDefault,
    };

    if (this.config.network.nodeProtocol === 'pocket') {
      if (options.pocket === undefined || options.pocketAAT === undefined) {
        throw new Error(
          "[Portis] illegal 'node protocol' parameter. In order to use the pocket network you need to provide a Pocket AAT object in the options",
        );
      }

      this.pocketAAT = options.pocketAAT;
      this.pocket = options.pocket;
    }

    this.widget = this._initWidget();
    this.provider = this._initProvider();
  }

  changeNetwork(network: string | INetwork, gasRelay?: boolean) {
    const newNetwork = networkAdapter(network, gasRelay);
    const nonceSubprovider = this.provider._providers.find(subprovider => subprovider instanceof NonceSubprovider);
    this.noncesCache[`${this.config.network.nodeUrl}:${this.config.network.chainId}`] = nonceSubprovider.nonceCache;
    nonceSubprovider.nonceCache = this.noncesCache[`${newNetwork.nodeUrl}:${newNetwork.chainId}`] || {};
    this.config.network = newNetwork;
  }

  setDefaultEmail(email: string) {
    this.config.defaultEmail = email;
  }

  async showPortis() {
    const widgetCommunication = (await this.widget).communication;
    return widgetCommunication.showPortis(this.config);
  }

  onLogin(callback: (walletAddress: string, email?: string, reputation?: string) => void) {
    this._onLoginCallback = callback;
  }

  onLogout(callback: () => void) {
    this._onLogoutCallback = callback;
  }

  async importWallet(mnemonicOrPrivateKey: string) {
    const widgetCommunication = (await this.widget).communication;
    return widgetCommunication.importWallet(mnemonicOrPrivateKey, this.config);
  }

  private _valiadateParams(dappId: string, network: string | INetwork, options: IOptions) {
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

      const unknownScope = options.scope.filter(item => supportedScopes.indexOf(item) < 0);
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
  }

  private _initWidget(): Promise<{
    communication: AsyncMethodReturns<IConnectionMethods>;
    iframe: HTMLIFrameElement;
    widgetFrame: HTMLDivElement;
  }> {
    return new Promise((resolve, reject) => {
      const onload = async () => {
        const style = document.createElement('style');
        style.innerHTML = styles;

        const container = document.createElement('div');
        container.className = 'por_portis-container';

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
          },
        });

        connection.iframe.style.position = 'absolute';
        connection.iframe.style.height = '100%';
        connection.iframe.style.width = '100%';
        connection.iframe.style.border = '0 transparent';

        const communication = await connection.promise;
        resolve({ communication, iframe: connection.iframe, widgetFrame });
      };

      if (['loaded', 'interactive', 'complete'].indexOf(document.readyState) > -1) {
        onload();
      } else {
        window.addEventListener('load', onload.bind(this), false);
      }
    });
  }

  private _initProvider() {
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

    if (this.pocket === undefined) {
      this.addRelayProvider(engine);
    } else {
      this.addPocketRelayProvider(engine);
    }

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

  private addRelayProvider(engine: ProviderEngine) {
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
  }

  private addPocketRelayProvider(engine: ProviderEngine) {
    engine.addProvider({
      setEngine: _ => _,
      handleRequest: async (payload, next, end) => {
        if (this.config.network.chainId === undefined) {
          throw new Error(
            "[Portis] 'chainId' is required. Read more about it here: https://docs.portis.io/#/configuration?id=network",
          );
        }

        if (this.pocketAAT === undefined) {
          throw new Error(
            "[Portis] 'pocketAAT' is required. Read more about it here: https://docs.portis.io/#/configuration?id=network",
          );
        }

        if (this.pocket === undefined) {
          throw new Error(
            "[Portis] 'Pocket' wasn't created it. Read more about it here: https://docs.portis.io/#/configuration?id=network",
          );
        }

        let response = await this.pocket.sendRelay(
          JSON.stringify(payload),
          this.config.network.chainId,
          this.pocketAAT,
        );
        let error;
        let result;

        switch (true) {
          case typeGuard(response, RpcError):
            error = response;
            break;
          case typeGuard(response, RelayResponse):
            result = (response as RelayResponse).payload;
            break;
          default:
            result = (response as ConsensusNode).relayResponse.payload;
        }

        if (payload.method === 'net_version') {
          this._network = result;
          engine.networkVersion = this._network;
        }

        end(error, result);
      },
    });
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
    if (this._onLogoutCallback) {
      this._onLogoutCallback();
    }
  }
}
