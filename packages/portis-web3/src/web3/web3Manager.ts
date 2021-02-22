import ProviderEngine from 'web3-provider-engine';

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

export default class Web3Manager {
  engine: ProviderEngine;
  provider;
  private _selectedAddress: string;
  private _network: string;

  constructor(
    private config: ISDKConfig,
    private _getWidgetCommunication: () => Promise<AsyncMethodReturns<IConnectionMethods>>,
  ) {
    this.provider = this._initProvider();
  }

  setSelectedAddress(selectedAddress) {
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

    this.engine.send = (payload, callback) => {
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
          this.engine.sendAsync(payload, _ => _);
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
      setEngine: _ => _,
      handleRequest: async (payload, next, end) => {
        if (!payload.id) {
          payload.id = 42;
        }
        next();
      },
    });

    // main web3 functionality - carried out via widget communication
    this.engine.addProvider(
      new HookedWalletSubprovider({
        getAccounts: async cb => {
          const widgetCommunication = await this._getWidgetCommunication();
          const { error, result } = await widgetCommunication.getAccounts(this.config);
          if (!error && result) {
            this._selectedAddress = result[0];
          }
          cb(error, result);
        },
        signTransaction: async (txParams, cb) => {
          const widgetCommunication = await this._getWidgetCommunication();
          const { error, result } = await widgetCommunication.signTransaction(txParams, this.config);
          cb(error, result);
        },
        signMessage: async (msgParams, cb) => {
          const widgetCommunication = await this._getWidgetCommunication();
          const params = Object.assign({}, msgParams, { messageStandard: 'signMessage' });
          const { error, result } = await widgetCommunication.signMessage(params, this.config);
          cb(error, result);
        },
        signPersonalMessage: async (msgParams, cb) => {
          const widgetCommunication = await this._getWidgetCommunication();
          const params = Object.assign({}, msgParams, { messageStandard: 'signPersonalMessage' });
          const { error, result } = await widgetCommunication.signMessage(params, this.config);
          cb(error, result);
        },
        signTypedMessage: async (msgParams, cb) => {
          const widgetCommunication = await this._getWidgetCommunication();
          const params = Object.assign({}, msgParams, { messageStandard: 'signTypedMessage' });
          const { error, result } = await widgetCommunication.signMessage(params, this.config);
          cb(error, result);
        },
        signTypedMessageV3: async (msgParams, cb) => {
          const widgetCommunication = await this._getWidgetCommunication();
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

    this.engine.addProvider({
      setEngine: _ => _,
      handleRequest: async (payload, next, end) => {
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
        this.engine.sendAsync({ method: 'eth_accounts' }, (error, response) => {
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

    this.engine.on('error', error => {
      if (error && error.message && error.message.includes('PollingBlockTracker')) {
        console.warn('If you see this warning constantly, there might be an error with your RPC node.');
      } else {
        console.error(error);
      }
    });

    this.engine.start();
    return this.engine;
  }

  private clearSubprovider(subproviderType) {
    const subprovider = this.provider._providers.find(subprovider => subprovider instanceof subproviderType);
    this.provider.removeProvider(subprovider);
    this.provider.addProvider(new subproviderType());
  }
}
