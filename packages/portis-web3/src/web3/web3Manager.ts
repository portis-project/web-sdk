const ProviderEngine = require('web3-provider-engine');
const CacheSubprovider = require('web3-provider-engine/dist/es5/subproviders/cache.js');
const FixtureSubprovider = require('web3-provider-engine/dist/es5/subproviders/fixture.js');
const FilterSubprovider = require('web3-provider-engine/dist/es5/subproviders/filters.js');
const HookedWalletSubprovider = require('web3-provider-engine/dist/es5/subproviders/hooked-wallet.js');
const NonceSubprovider = require('web3-provider-engine/dist/es5/subproviders/nonce-tracker.js');
const SubscriptionsSubprovider = require('web3-provider-engine/dist/es5/subproviders/subscriptions.js');
import { networkAdapter } from '../networks';
import { ISDKConfig, INetwork, IConnectionMethods } from '../interfaces';
import { getTxGas } from '../utils/getTxGas';
import { Query } from '../utils/query';
import { AsyncMethodReturns } from 'penpal';

type ProviderCallback = (error: string | null, result: any) => void;
export default class Web3Manager {
  private engine: typeof ProviderEngine;
  provider: typeof ProviderEngine;
  private _selectedAddress?: string;
  private _network?: string;

  constructor(
    private config: ISDKConfig,
    private _getWidgetCommunication: () => Promise<AsyncMethodReturns<IConnectionMethods>>,
  ) {
    this.provider = this._initProvider();
  }

  setSelectedAddress(selectedAddress: string) {
    this._selectedAddress = selectedAddress;
  }

  changeNetwork(network: string | INetwork, gasRelay?: boolean) {
    const newNetwork = networkAdapter(network, gasRelay);
    this.clearSubprovider(NonceSubprovider);
    this.clearSubprovider(CacheSubprovider);
    this.config.network = newNetwork;
  }

  private _initProvider() {
    // don't init the engine twice
    if (this.engine) {
      return this.engine;
    }

    this.engine = new ProviderEngine();
    const query = new Query(this.engine);

    this.engine.send = (payload: any, callback: any) => {
      // Web3 1.0 beta.38 (and above) calls `send` with method and parameters
      if (typeof payload === 'string') {
        return new Promise((resolve, reject) => {
          this.engine.sendAsync(
            {
              jsonrpc: '2.0',
              id: 42,
              method: payload,
              params: callback || [],
            },
            (error: any, response: any) => {
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
        this.engine.sendAsync(payload, callback);
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
          this.engine.sendAsync(payload, (_: any) => _);
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
        result,
      };
    };

    this.engine.addProvider(
      new FixtureSubprovider({
        web3_clientVersion: `Portis/v${this.config.version}/javascript`,
        net_listening: true,
        eth_hashrate: '0x00',
        eth_mining: false,
        eth_syncing: true,
      }),
    );

    // cache layer
    this.engine.addProvider(new CacheSubprovider());

    // subscriptions manager
    this.engine.addProvider(new SubscriptionsSubprovider());

    // filters
    this.engine.addProvider(new FilterSubprovider());

    // pending nonce
    this.engine.addProvider(new NonceSubprovider());

    // set default id when needed
    this.engine.addProvider({
      setEngine: (_: any) => _,
      handleRequest: async (payload: any, next: () => {}) => {
        if (!payload.id) {
          payload.id = 42;
        }
        next();
      },
    });

    // main web3 functionality - carried out via widget communication
    this.engine.addProvider(
      new HookedWalletSubprovider({
        getAccounts: async (cb: ProviderCallback) => {
          const widgetCommunication = await this._getWidgetCommunication();
          const { error, result } = await widgetCommunication.getAccounts(this.config);
          if (!error && result) {
            this._selectedAddress = result[0];
          }
          cb(error, result);
        },
        signTransaction: async (txParams: any, cb: ProviderCallback) => {
          const widgetCommunication = await this._getWidgetCommunication();
          const { error, result } = await widgetCommunication.signTransaction(txParams, this.config);
          cb(error, result);
        },
        signMessage: async (msgParams: any, cb: ProviderCallback) => {
          const widgetCommunication = await this._getWidgetCommunication();
          const params = { ...msgParams, messageStandard: 'signMessage' };
          const { error, result } = await widgetCommunication.signMessage(params, this.config);
          cb(error, result);
        },
        signPersonalMessage: async (msgParams: any, cb: ProviderCallback) => {
          const widgetCommunication = await this._getWidgetCommunication();
          const params = { ...msgParams, messageStandard: 'signPersonalMessage' };
          const { error, result } = await widgetCommunication.signMessage(params, this.config);
          cb(error, result);
        },
        signTypedMessage: async (msgParams: any, cb: ProviderCallback) => {
          const widgetCommunication = await this._getWidgetCommunication();
          const params = { ...msgParams, messageStandard: 'signTypedMessage' };
          const { error, result } = await widgetCommunication.signMessage(params, this.config);
          cb(error, result);
        },
        signTypedMessageV3: async (msgParams: any, cb: ProviderCallback) => {
          const widgetCommunication = await this._getWidgetCommunication();
          const params = { ...msgParams, messageStandard: 'signTypedMessageV3' };
          const { error, result } = await widgetCommunication.signMessage(params, this.config);
          cb(error, result);
        },
        estimateGas: async (txParams: any, cb: ProviderCallback) => {
          const gas = await getTxGas(query, txParams);
          cb(null, gas);
        },
        getGasPrice: async (cb: ProviderCallback) => {
          cb(null, '');
        },
      }),
    );

    this.engine.addProvider({
      setEngine: (_: any) => _,
      handleRequest: async (payload: any, next: () => {}, end: (error: string | null, result: any) => {}) => {
        const widgetCommunication = await this._getWidgetCommunication();
        const { error, result } = await widgetCommunication.relay(payload, this.config);
        if (payload.method === 'net_version') {
          this._network = result;
          this.engine.networkVersion = this._network;
        }
        end(error, result);
      },
    });

    this.engine.enable = () =>
      new Promise((resolve, reject) => {
        this.engine.sendAsync({ method: 'eth_accounts' }, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response.result);
          }
        });
      });

    this.engine.isConnected = () => {
      return true;
    };

    this.engine.isPortis = true;

    this.engine.on('error', (error: any) => {
      if (error && error.message && error.message.includes('PollingBlockTracker')) {
        console.warn('If you see this warning constantly, there might be an error with your RPC node.');
      } else {
        console.error(error);
      }
    });

    this.engine.start();
    return this.engine;
  }

  private clearSubprovider(subproviderType: any) {
    const subprovider = this.provider._providers.find((subprovider: any) => subprovider instanceof subproviderType);
    this.provider.removeProvider(subprovider);
    this.provider.addProvider(new subproviderType());
  }
}
