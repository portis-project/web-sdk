import { ISDKConfig, IConnectionMethods, IOptions } from './interfaces';
import Penpal, { AsyncMethodReturns } from 'penpal';
import { validateSecureOrigin } from './utils/secureOrigin';
import { styles } from './styles';
import { networkAdapter } from './networks';

const version = '$$PORTIS_SDK_VERSION$$';
const widgetUrl = 'https://widget.portis.io';

export default class Portis {
  config: ISDKConfig;
  widget: Promise<{
    communication: AsyncMethodReturns<IConnectionMethods>;
    iframe: HTMLIFrameElement;
    widgetFrame: HTMLDivElement;
  }>;
  private _widgetUrl = widgetUrl;
  private _onLoginCallback: (
    walletAddress: string,
    email?: string,
    reputation?: string,
    accountName?: string,
    accountPermission?: string,
  ) => void;

  constructor(dappId: string, network: string, options: IOptions = {}) {
    validateSecureOrigin();
    this._valiadateParams(dappId, network, options);
    this.config = {
      dappId,
      network: networkAdapter(network),
      version,
      scope: options.scope,
      registerPageByDefault: options.registerPageByDefault,
    };
    this.widget = this._initWidget();
  }

  async showPortis() {
    const widgetCommunication = (await this.widget).communication;
    return widgetCommunication.showPortis(this.config);
  }

  async getAccounts() {
    const widgetCommunication = (await this.widget).communication;
    return widgetCommunication.getAccounts(this.config);
  }

  onLogin(
    callback: (
      walletAddress: string,
      email?: string,
      reputation?: string,
      accountName?: string,
      accountPermission?: string,
    ) => void,
  ) {
    this._onLoginCallback = callback;
  }

  private _valiadateParams(dappId: string, network: string, options: IOptions) {
    if (!dappId) {
      throw new Error("[Portis] 'dappId' is required. Get your dappId here: https://dashboard.portis.io");
    }

    if (!network) {
      throw new Error(
        "[Portis] 'network' is required. Read more about it here: https://docs.portis.io/#/configuration?id=network",
      );
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

  private _onLogin(
    walletAddress: string,
    email?: string,
    reputation?: string,
    accountName?: string,
    accountPermission?: string,
  ) {
    if (this._onLoginCallback) {
      this._onLoginCallback(walletAddress, email, reputation, accountName, accountPermission);
    }
  }
}
