import * as sc from '@authereum/starkware-crypto';
import StarkwareAbiEncoder from '@authereum/starkware-abi-encoder';
import {
  OrderParams,
  TransferErc20Params,
  TransferErc721Params,
  TransferEthParams,
  TransferParams,
} from './starkwareTypes';
import { getAssetId, getXCoordinate, quantizeAmount, sign, Signature } from '@authereum/starkware-crypto';

export default class StarkwareProvider {
  private _abiEncoder: StarkwareAbiEncoder;

  constructor() {
    this._abiEncoder = new StarkwareAbiEncoder();
  }

  register(ethereumAddress, starkKey, operatorSignature) {
    return this._abiEncoder.registerUser({
      ethKey: ethereumAddress,
      starkKey,
      operatorSignature,
    });
  }

  getStarkKey() {
    const mnemonic = 'raw reveal finish flash cancel famous improve gas slam unaware polar city';
    const ethAddress = '0xBA8d15d1FCE4b6f3be8F2DA33c15a678D2f34180';

    const layer = 'starkex';
    const application = 'starkexdvf';
    const index = '1';

    const path = sc.getAccountPath(layer, application, ethAddress, index);
    const keyPair = sc.getKeyPairFromPath(mnemonic, path);
    const pubKey = sc.getPublic(keyPair, false);
    const xCoord = getXCoordinate(pubKey);
    return '0x' + xCoord;
  }

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

  createLimitOrder(params: OrderParams) {}

  transferErc20(params: TransferErc20Params) {}

  transferErc721(params: TransferErc721Params) {}

  private getKeypair() {
    const mnemonic = 'raw reveal finish flash cancel famous improve gas slam unaware polar city';
    const ethAddress = '0xBA8d15d1FCE4b6f3be8F2DA33c15a678D2f34180';

    const layer = 'starkex';
    const application = 'starkexdvf';
    const index = '2';

    const path = sc.getAccountPath(layer, application, ethAddress, index);
    return sc.getKeyPairFromPath(mnemonic, path);
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
