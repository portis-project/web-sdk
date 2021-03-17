import * as sc from '@authereum/starkware-crypto';
import { OrderParams, TransferErc20Params, TransferErc721Params, TransferEthParams } from './starkwareTypes';

export default class StarkwareProvider {
  /**
   * Demo code - logic will be moved into the widget in a later ticket
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

  transferEth(params: TransferEthParams) {}

  transferErc20(params: TransferErc20Params) {}

  transferErc721(params: TransferErc721Params) {}
}
