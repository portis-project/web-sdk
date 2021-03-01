import * as sc from '@authereum/starkware-crypto';

export default class StarkwareProvider {
  starkExContractAddress: string;

  getPublicKey(ethAddress: string) {
    const mnemonic = 'curve become rib fuel garment engine great spring aisle mandate also host';
    const layer = 'starkex';
    const application = 'starkexdvf';
    const index = '4';
    // ethAddress is an address derived from the supplied mnemonic
    const path = sc.getAccountPath(layer, application, ethAddress, index);
    const keyPair = sc.getKeyPairFromPath(mnemonic, path);
    return sc.getStarkKey(keyPair);
  }

  signStarkTransaction(tx: string) {}
}
