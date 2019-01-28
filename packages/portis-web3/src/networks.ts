import { INetwork } from './interfaces';

export function networkAdapter(network: string | INetwork) {
  const networkObj = typeof network === 'string' ? networks[network] : network;

  if (typeof networkObj !== 'object') {
    throw new Error(
      "[Portis] illegal 'network' parameter. Read more about it here: https://docs.portis.io/#/configuration?id=network",
    );
  }

  if (!networkObj.nodeUrl) {
    throw new Error(
      "[Portis] 'nodeUrl' is required. Read more about it here: https://docs.portis.io/#/configuration?id=network",
    );
  }

  networkObj.nodeProtocol = networkObj.nodeProtocol || 'rpc';
  return networkObj;
}

const networks: { [key: string]: INetwork } = {
  mainnet: {
    nodeUrl: 'https://mainnet.infura.io/wfGZztijecfpS8N5yaOz',
  },
  ropsten: {
    nodeUrl: 'https://ropsten.infura.io/wfGZztijecfpS8N5yaOz',
  },
  rinkeby: {
    nodeUrl: 'https://rinkeby.infura.io/wfGZztijecfpS8N5yaOz',
  },
  orchid: {
    nodeUrl: 'https://public-node.rsk.co',
  },
  orchidTestnet: {
    nodeUrl: 'https://public-node.testnet.rsk.co',
  },
  kovan: {
    nodeUrl: 'https://kovan.infura.io/wfGZztijecfpS8N5yaOz',
  },
  classic: {
    nodeUrl: 'https://web3.gastracker.io',
  },
  classicTestnet: {
    nodeUrl: 'https://web3.gastracker.io/morden',
  },
  sokol: {
    nodeUrl: 'https://sokol.poa.network',
  },
  core: {
    nodeUrl: 'https://core.poa.network',
  },
  xdai: {
    nodeUrl: 'https://dai.poa.network',
  },
};
