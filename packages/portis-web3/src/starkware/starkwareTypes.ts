/**
 * Transfer Types
 * */
export interface TransferParams {
  from: TransferPartyParams;
  to: TransferPartyParams;
  asset: Asset;
  amount?: string;
  nonce: string;
  expirationTimestamp: string;
  condition?: string;
}

export interface TransferPartyParams {
  starkKey: string;
  vaultId: string;
}

export interface TransferEthParams {
  vaultId: string;
  to: TransferPartyParams;
  quantum: string;
  amount: string;
  nonce: string;
  expirationTimestamp: string;
  condition?: string;
}

export interface TransferErc20Params {
  vaultId: string;
  to: TransferPartyParams;
  tokenAddress: string;
  quantum: string;
  amount: string;
  nonce: string;
  expirationTimestamp: string;
  condition?: string;
}

export interface TransferErc721Params {
  vaultId: string;
  to: TransferPartyParams;
  tokenAddress: string;
  tokenId: string;
  nonce: string;
  expirationTimestamp: string;
  condition?: string;
}

/**
 * Limit Order Types
 * */
export interface AssetData {
  quantum?: string; // eth and erc20
  tokenAddress?: string; // erc20 and erc721
  tokenId?: string; // erc721
  symbol?: string; // synthetic
  resolution?: string; // synthetic
  blob?: string; // mintable erc20 and erc721
}

export interface Asset {
  type: string;
  data: AssetData;
}

export interface OrderAsset extends Asset {
  vaultId: string;
  amount?: string;
}

export interface OrderParams {
  sell: OrderAsset;
  buy: OrderAsset;
  nonce: string;
  expirationTimestamp: string;
}
