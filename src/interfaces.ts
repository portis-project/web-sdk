import { AsyncMethodReturns } from 'penpal';

export interface INetwork {
  nodeUrl: string;
  chainId?: string;
  gasRelayHubAddress?: string;
}

export interface ICampaignInfo {
  maxAmount: number;
  campaignDateStart: number;
  campaignDateEnd: number;
}

export interface IConnectionMethods {
  getAccounts: (config: ISDKConfig) => Promise<{ error: string; result: string[] }>;
  signTransaction: (txParams: ITransactionRequest, config: ISDKConfig) => Promise<{ error: string; result: string }>;
  signMessage: (msgParams: IMessageParams, config: ISDKConfig) => Promise<{ error: string; result: string }>;
  relay: (payload: IPayload, config: ISDKConfig) => Promise<{ error: string; result: any }>;
  showPortis: (config: ISDKConfig) => Promise<void>;
  importWallet: (mnemonicOrPrivateKey: string, config: ISDKConfig) => Promise<void>;
  getExtendedPublicKey: (path: string, coin: string, config: ISDKConfig) => Promise<{ error: string; result: string }>;
  logout: () => Promise<{ error: string; result: boolean }>;
  getCampaignInfo: (campaignId: string) => Promise<{ error: string; result: any }>; // TODO: result should be ICampaignInfo
  claimVoucher: (voucherId: string, config: ISDKConfig) => Promise<{ error: string; result: any }>;
  isLoggedIn: () => Promise<{ error: string; result: boolean }>;
  signBitcoinTransaction: (
    params: {
      coin: string;
      inputs: BTCSignTxInput[];
      outputs: BTCSignTxOutput[];
      version?: number;
      locktime?: number;
    },
    config: ISDKConfig,
  ) => Promise<{
    error: string;
    result: {
      serializedTx: string;
      txid: string;
    };
  }>;
  showBitcoinWallet: (path: string, config: ISDKConfig) => Promise<void>;
  setSdkConfig: (config: ISDKConfig) => Promise<void>;
  purchaseERC20: (params: IPurchaseERC20Params, config: ISDKConfig) => Promise<void>;
}

export interface IWidget {
  communication: AsyncMethodReturns<IConnectionMethods>;
  widgetFrame: HTMLDivElement;
}
export interface ISDKConfig {
  dappId: string;
  network: INetwork;
  version: string;
  defaultEmail?: string;
  scope?: Scope[];
  registerPageByDefault?: boolean;
  staging?: boolean;
  feature?: boolean;
}

export type Scope = 'email';

export interface IOptions {
  scope?: Scope[];
  gasRelay?: boolean;
  registerPageByDefault?: boolean;
  pocketDevId?: string;
  staging?: boolean;
  feature?: boolean;
}

export interface ITransactionRequest {
  to?: string;
  from?: string;
  nonce?: string;
  gas?: string;
  gasPrice?: string;
  data?: string;
  value?: string;
  chainId?: number;
}

export interface IMessageParams {
  from: string;
  data: string | ITypedDataMessage[];
  messageStandard: 'signMessage' | 'signPersonalMessage' | 'signTypedMessage';
}

export interface ITypedDataMessage {
  name: string;
  type: string;
  value: string;
}

export interface IPayload {
  id: number;
  jsonrpc: string;
  method: string;
  params: any[];
}

export type BIP32Path = Array<number>;

export interface BTCSignTxInput {
  addressNList: BIP32Path;
  scriptType?: BTCInputScriptType;
  sequence?: number;
  amount: string;
  vout: number;
  txid: string;
  tx?: BitcoinTx;
  hex: string;
}

export interface BTCSignTxOutput {
  addressNList?: BIP32Path;
  scriptType?: BTCOutputScriptType;
  address?: string;
  addressType: BTCOutputAddressType;
  amount: string;
  isChange: boolean;
}

export interface BitcoinTx {
  version: number;
  locktime: number;
  vin: Array<BitcoinInput>;
  vout: Array<BitcoinOutput>;
}

export interface BitcoinInput {
  vout?: number;
  valueSat?: number;
  sequence?: number;
  scriptSig?: BitcoinScriptSig;
  txid?: string;
  coinbase?: string;
}

export interface BitcoinOutput {
  value: string;
  scriptPubKey: BitcoinScriptSig;
}

export interface BitcoinScriptSig {
  hex: string;
}

export interface BTCSignTxSDKInput {
  coin: string;
  inputs: BTCSignTxInput[];
  outputs: BTCSignTxOutput[];
  locktime?: number;
  version?: number;
}

export type BTCInputScriptType = 'p2pkh' | 'p2sh' | 'external' | 'p2wpkh' | 'p2sh-p2wpkh';

export type BTCOutputScriptType = 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2sh-p2wpkh';

export type BTCOutputAddressType = 'spend' | 'transfer' | 'change' | 'exchange';

export interface IPurchaseERC20Params {
  tokenAddress: string,
  amount: string;
  tokenSymbol: string;
  logoURL?: string | undefined,
}

export default null;
