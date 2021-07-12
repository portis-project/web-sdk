import { networkAdapter } from './networks';
import { INetwork, IOptions, BTCSignTxSDKInput, ISDKConfig, IWidget } from './interfaces';
import { onWindowLoad } from './utils/onWindowLoad';
import { validateSecureOrigin } from './utils/secureOrigin';
import WidgetManager, { windowLoadHandler } from './widget/widgetManager';
import Web3Manager from './web3/web3Manager';
import { isClientSide } from './utils/isClientSide';
import { mockify } from './utils/mockify';

const VERSION = '$$PORTIS_SDK_VERSION$$';

const SUPPORTED_SCOPES = ['email', 'reputation'];

onWindowLoad()
  .then(windowLoadHandler)
  .catch(() => {}); // Prevents unhandledPromiseRejectionWarning, which happens when using React SSR;

class Portis {
  private _widgetManagerInstance?: WidgetManager;
  private _web3ManagerInstance?: Web3Manager;
  private _config?: ISDKConfig;

  constructor(dappId: string, network: string | INetwork, options: IOptions = {}) {
    // If rendered in SSR, return a mock version of the Portis object.
    // All methods are callable and all properties exist, but they do nothing.
    if (!isClientSide()) {
      return mockify<Portis>(this);
    }

    validateSecureOrigin();
    this._validateParams(dappId, network, options);
    this._config = {
      dappId,
      network: networkAdapter(network, options.gasRelay),
      version: VERSION,
      scope: options.scope,
      registerPageByDefault: options.registerPageByDefault,
      staging: options.staging,
    };

    this._getWidgetCommunication = this._getWidgetCommunication.bind(this);
    this._widgetManagerInstance = new WidgetManager(this.config, this._clearProviderSession);
    this._web3ManagerInstance = new Web3Manager(this.config, this._getWidgetCommunication);

    this.setDefaultEmail = this.setDefaultEmail.bind(this);
    this.changeNetwork = this.changeNetwork.bind(this);
    this.getWidget = this.getWidget.bind(this);
    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
    this.onActiveWalletChanged = this.onActiveWalletChanged.bind(this);
    this.onError = this.onError.bind(this);
    this.showPortis = this.showPortis.bind(this);
    this.getCampaignInfo = this.getCampaignInfo.bind(this);
    this.claimVoucher = this.claimVoucher.bind(this);
    this.getExtendedPublicKey = this.getExtendedPublicKey.bind(this);
    this.importWallet = this.importWallet.bind(this);
    this.isLoggedIn = this.isLoggedIn.bind(this);
    this.signBitcoinTransaction = this.signBitcoinTransaction.bind(this);
    this.showBitcoinWallet = this.showBitcoinWallet.bind(this);
    // this.purchaseERC20 = this.purchaseERC20.bind(this);
  }

  get _widgetManager() {
    return this._widgetManagerInstance!;
  }

  get _web3Manager() {
    return this._web3ManagerInstance!;
  }

  get config() {
    return this._config!;
  }

  private _clearProviderSession() {
    this._web3Manager.setSelectedAddress('');
  }

  private async _getWidgetCommunication() {
    return (await this._widgetManager.getWidget()).communication;
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
  async getWidget(): Promise<IWidget> {
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

  async getCampaignInfo(campaignId: string) {
    return this._widgetManager.getCampaignInfo(campaignId);
  }

  async claimVoucher(voucherId: string) {
    return this._widgetManager.claimVoucher(voucherId);
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

  // async purchaseERC20(tokenAddress: string, amount: string, tokenSymbol: string, logoURL?: string) {
  //   return this._widgetManager.purchaseERC20({tokenAddress, amount, tokenSymbol, logoURL});
  // }

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

export default Portis;
