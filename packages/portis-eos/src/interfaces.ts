import { ApiInterfaces } from 'eosjs';

export interface INetwork {
  nodeUrl: string;
  chainId?: number;
  nodeProtocol?: 'rpc' | 'pocket';
  gasRelayHubAddress?: string;
}

export interface IConnectionMethods {
  getAccounts: (config: ISDKConfig) => Promise<{ error: string; result: string[] }>;
  signTransaction: (
    txParams: ApiInterfaces.SignatureProviderArgs,
    config: ISDKConfig,
  ) => Promise<{ error: string; result: string[] }>;
  relay: (payload: IPayload, config: ISDKConfig) => Promise<{ error: string; result: any }>;
  showPortis: (config: ISDKConfig) => Promise<void>;
}

export interface ISDKConfig {
  dappId: string;
  network: INetwork;
  version: string;
  defaultEmail?: string;
  scope?: Scope[];
  registerPageByDefault?: boolean;
}

export type Scope = 'email';

export interface IOptions {
  scope?: Scope[];
  gasRelay?: boolean;
  registerPageByDefault?: boolean;
}

export interface IPayload {
  id: number;
  jsonrpc: string;
  method: string;
  params: any[];
}
