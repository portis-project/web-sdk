import * as sc from '@authereum/starkware-crypto';
import StarkwareAbiEncoder from '@authereum/starkware-abi-encoder';
import {
  OrderParams,
  TransferErc20Params,
  TransferErc721Params,
  TransferEthParams,
  TransferParams,
} from './starkwareTypes';
import { getAssetId, quantizeAmount, sign, Signature } from '@authereum/starkware-crypto';

export default class StarkwareProvider {
  private _abiEncoder: StarkwareAbiEncoder;

  constructor() {
    this._abiEncoder = new StarkwareAbiEncoder();
  }

  register(ethereumAddress, starkKey, operatorSignature) {
    const txData = this._abiEncoder.registerUser({
      ethKey: ethereumAddress,
      starkKey,
      operatorSignature,
    });
    console.log(txData);
    return txData;
  }
  /**
   * Do we want to allow users to supply application/index/ethaddress?
   * */
  getStarkKey() {
    const mnemonic = 'curve become rib fuel garment engine great spring aisle mandate also host';
    const layer = 'starkex';
    const application = 'starkexdvf';
    const index = '1';
    const ethAddress = '0xc536a7ac035015a017146a97f3ef44851eaaef41';
    const path = sc.getAccountPath(layer, application, ethAddress, index);
    const keyPair = sc.getKeyPairFromPath(mnemonic, path);
    return sc.getStarkKey(keyPair);
  }

  createLimitOrder(params: OrderParams) {}

  transferEth(params: TransferEthParams): Promise<Signature> {
    const starkKey = this.getStarkKey();
    const { vaultId, to, quantum, amount, nonce, expirationTimestamp, condition } = params;
    return this.transfer({
      from: {
        starkKey,
        vaultId,
      },
      to,
      asset: {
        type: 'ETH',
        data: {
          quantum,
        },
      },
      amount,
      nonce,
      expirationTimestamp,
      condition,
    });
  }

  transferErc20(params: TransferErc20Params) {}

  transferErc721(params: TransferErc721Params) {}

  private getKeypair() {
    const mnemonic = 'curve become rib fuel garment engine great spring aisle mandate also host';
    const layer = 'starkex';
    const application = 'starkexdvf';
    const index = '1';
    const ethAddress = '0xc536a7ac035015a017146a97f3ef44851eaaef41';
    const path = sc.getAccountPath(layer, application, ethAddress, index);
    const keyPair = sc.getKeyPairFromPath(mnemonic, path);
    return keyPair;
  }

  private async transfer(input: TransferParams): Promise<Signature> {
    const { from, to, asset, amount, nonce, expirationTimestamp, condition } = input;
    const assetId = getAssetId(asset);
    const quantizedAmount = quantizeAmount(amount as string, asset.data.quantum as string);
    const senderVaultId = from.vaultId;
    const targetVaultId = to.vaultId;
    const targetKey = input.to.starkKey;

    const msgHash = await this._abiEncoder.transfer({
      quantizedAmount,
      nonce,
      senderVaultId,
      assetId,
      targetVaultId,
      targetKey,
      expirationTimestamp,
      condition,
    });

    console.log(`executing transfer with hash ${msgHash}`);
    const keypair = this.getKeypair();
    const starkSignature = await sign(keypair, msgHash);
    return starkSignature;
  }
}
