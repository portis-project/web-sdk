import { networkAdapter } from './networks';
import { INetwork, IOptions, BTCSignTxSDKInput, ISDKConfig } from './interfaces';
import { onWindowLoad } from './utils/onWindowLoad';
import { validateSecureOrigin } from './utils/secureOrigin';
import WidgetManager, { windowLoadHandler } from './widget/widgetManager';
import Web3Manager from './web3/web3Manager';
import StarkwareProvider from './starkware/starkwareProvider';

const VERSION = '$$PORTIS_SDK_VERSION$$';

const SUPPORTED_SCOPES = ['email', 'reputation'];

onWindowLoad().then(windowLoadHandler);

export default class Portis {
  private _widgetManager: WidgetManager;
  private _web3Manager: Web3Manager;
  private _starkwareProvider: StarkwareProvider;
  config: ISDKConfig;

  constructor(dappId: string, network: string | INetwork, options: IOptions = {}) {
    validateSecureOrigin();
    this._validateParams(dappId, network, options);
    this.config = {
      dappId,
      network: networkAdapter(network, options.gasRelay),
      version: VERSION,
      scope: options.scope,
      registerPageByDefault: options.registerPageByDefault,
      staging: options.staging,
    };

    this._getWidgetCommunication = this._getWidgetCommunication.bind(this);

    this._starkwareProvider = new StarkwareProvider();
    this._widgetManager = new WidgetManager(this.config, this._clearProviderSession);
    this._web3Manager = new Web3Manager(this.config, this._getWidgetCommunication);
  }

  private _clearProviderSession() {
    this._web3Manager.setSelectedAddress('');
  }

  private async _getWidgetCommunication() {
    return (await this._widgetManager.getWidget()).communication;
  }

  get starkwareProvider() {
    return this._starkwareProvider;
  }

  get web3Provider() {
    return this._web3Manager.provider;
  }

  // Todo: deprecate
  get provider() {
    return this.web3Provider;
  }

  changeNetwork(network: string | INetwork, gasRelay?: boolean) {
    this._web3Manager.changeNetwork(network, gasRelay);
  }

  setDefaultEmail(email: string) {
    this._widgetManager.setDefaultEmail(email);
  }

  // async singleton
  async getWidget() {
    return this._widgetManager.getWidget();
  }

  // Population by the dev of SDK callbacks that might be invoked by the widget

  onLogin(callback: (walletAddress: string, email?: string, reputation?: string) => void) {
    this._widgetManager.setOnLoginCallback(callback);
  }

  onLogout(callback: () => void) {
    this._widgetManager.setOnLogoutCallback(callback);
  }

  onActiveWalletChanged(callback: (walletAddress: string) => void) {
    this._widgetManager.setOnActiveWalletChangedCallback(callback);
  }

  onError(callback: (error: Error) => void) {
    this._widgetManager.setOnErrorCallback(callback);
  }

  // SDK methods that could be invoked by the user and handled by the widget

  async showPortis() {
    return this._widgetManager.showPortis();
  }

  async logout() {
    return this._widgetManager.logout();
  }

  async getExtendedPublicKey(path: string = "m/44'/60'/0'/0/0", coin: string = 'Ethereum') {
    return this._widgetManager.getExtendedPublicKey(path, coin);
  }

  async importWallet(mnemonicOrPrivateKey: string) {
    return this._widgetManager.importWallet(mnemonicOrPrivateKey);
  }

  async isLoggedIn() {
    return this._widgetManager.isLoggedIn();
  }

  async signBitcoinTransaction(params: BTCSignTxSDKInput) {
    return this._widgetManager.signBitcoinTransaction(params);
  }

  async showBitcoinWallet(path: string = "m/49'/0'/0'/0/0") {
    return this._widgetManager.showBitcoinWallet(path);
  }

  // internal methods
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
  }
}
