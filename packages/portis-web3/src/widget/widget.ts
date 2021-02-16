import Penpal from 'penpal';
import { networkAdapter } from '../networks';
import { ISDKConfig, IConnectionMethods, INetwork, IOptions, IWidget, BTCSignTxSDKInput } from '../interfaces';

import { onWindowLoad } from '../utils/onWindowLoad';
import { styles } from '../styles';
import { validateSecureOrigin } from '../utils/secureOrigin';

const VERSION = '$$PORTIS_SDK_VERSION$$';
// Create a .env file to override the default WIDGET_URL when running on
const WIDGET_URL = process.env.PORTIS_WIDGET_URL || 'https://widget.portis.io';
// const STAGING_WIDGET_URL = 'https://widget-staging.portis.io';
const PORTIS_IFRAME_CLASS = 'por_portis-widget-frame';
const PORTIS_CONTAINER_CLASS = 'por_portis-container';

onWindowLoad().then(() => {
  if (document.getElementsByClassName(PORTIS_IFRAME_CLASS).length) {
    console.warn(
      'Portis script was already loaded. This might cause unexpected behavior. If loading with a <script> tag, please make sure that you only load it once.',
    );
  }
});

export default class WidgetManager {
  config: ISDKConfig;
  widgetPromise: Promise<IWidget>;
  widgetInstance: IWidget;
  provider;
  private _selectedAddress: string;
  private _widgetUrl = WIDGET_URL;
  private _onLoginCallback: (walletAddress: string, email?: string, reputation?: string) => void;
  private _onLogoutCallback: () => void;
  private _onActiveWalletChangedCallback: (walletAddress: string) => void;
  private _onErrorCallback: (error: Error) => void;

  constructor(dappId: string, network: string | INetwork, options: IOptions = {}) {
    validateSecureOrigin();
    this._checkIfWidgetAlreadyInitialized();
    this.config = {
      dappId,
      network: networkAdapter(network, options.gasRelay),
      version: VERSION,
      scope: options.scope,
      registerPageByDefault: options.registerPageByDefault,
    };
  }

  // async singleton
  async getWidget() {
    if (!this.widgetInstance) {
      if (!this.widgetPromise) {
        this.widgetPromise = this._initWidget();
      }
      this.widgetInstance = await this.widgetPromise;
    }
    return this.widgetInstance;
  }

  // Population by the dev of SDK callbacks that might be invoked by the widget

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

  // SDK methods that could be invoked by the user and handled by the widget

  async showPortis() {
    console.log('swiffer');
    const widgetCommunication = (await this.getWidget()).communication;
    return widgetCommunication.showPortis(this.config);
  }

  async logout() {
    const widgetCommunication = (await this.getWidget()).communication;
    return widgetCommunication.logout();
  }

  async getExtendedPublicKey(path: string = "m/44'/60'/0'/0/0", coin: string = 'Ethereum') {
    const widgetCommunication = (await this.getWidget()).communication;
    return widgetCommunication.getExtendedPublicKey(path, coin, this.config);
  }

  async importWallet(mnemonicOrPrivateKey: string) {
    const widgetCommunication = (await this.getWidget()).communication;
    return widgetCommunication.importWallet(mnemonicOrPrivateKey, this.config);
  }

  async isLoggedIn() {
    const widgetCommunication = (await this.getWidget()).communication;
    return widgetCommunication.isLoggedIn();
  }

  async signBitcoinTransaction(params: BTCSignTxSDKInput) {
    const widgetCommunication = (await this.getWidget()).communication;
    return widgetCommunication.signBitcoinTransaction(params, this.config);
  }

  async showBitcoinWallet(path: string = "m/49'/0'/0'/0/0") {
    const widgetCommunication = (await this.getWidget()).communication;
    return widgetCommunication.showBitcoinWallet(path, this.config);
  }

  // internal methods

  private _checkIfWidgetAlreadyInitialized() {
    if (document.getElementsByClassName(PORTIS_CONTAINER_CLASS).length) {
      console.warn(
        'An instance of Portis was already initialized. This is probably a mistake. Make sure that you use the same Portis instance throughout your app.',
      );
    }
  }

  private async _initWidget(): Promise<IWidget> {
    await onWindowLoad();

    const style = document.createElement('style');
    style.innerHTML = styles;

    const container = document.createElement('div');
    container.className = PORTIS_CONTAINER_CLASS;

    const widgetFrame = document.createElement('div');
    widgetFrame.id = `portis-container-${Date.now()}`;
    widgetFrame.className = PORTIS_IFRAME_CLASS;

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

    const communication = await connection.promise;
    communication.setSdkConfig(this.config);
    connection.iframe.style.position = 'absolute';
    connection.iframe.style.height = '100%';
    connection.iframe.style.width = '100%';
    connection.iframe.style.border = '0 transparent';

    return { communication, widgetFrame };
  }

  private async _setHeight(height: number) {
    const widgetFrame = (await this.getWidget()).widgetFrame;
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
}
