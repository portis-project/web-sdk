import { INetwork } from './interfaces';

export function networkAdapter(network: string | INetwork, gasRelay?: boolean) {
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

  if (gasRelay && typeof network !== 'string') {
    throw new Error(`[Portis] can't find default gas relay hub for ${network}`);
  }

  if (gasRelay && !networks[network as string].gasRelayHubContractAddress) {
    throw new Error(`[Portis] network ${network} doesn't have default gas relay hub`);
  }

  networkObj.nodeProtocol = networkObj.nodeProtocol || 'rpc';
  return networkObj;
}

const networks: { [key: string]: INetwork & { gasRelayHubContractAddress?: string } } = {
  mainnet: {
    nodeUrl: 'https://mainnet.infura.io/v3/faa4639b090f46499f29d894da0551a0',
  },
  ropsten: {
    nodeUrl: 'https://ropsten.infura.io/v3/faa4639b090f46499f29d894da0551a0',
    gasRelayHubContractAddress: '0x1349584869A1C7b8dc8AE0e93D8c15F5BB3B4B87',
  },
  rinkeby: {
    nodeUrl: 'https://rinkeby.infura.io/v3/faa4639b090f46499f29d894da0551a0',
  },
  orchid: {
    nodeUrl: 'https://public-node.rsk.co',
  },
  orchidTestnet: {
    nodeUrl: 'https://public-node.testnet.rsk.co',
  },
  kovan: {
    nodeUrl: 'https://kovan.infura.io/v3/faa4639b090f46499f29d894da0551a0',
  },
  classic: {
    nodeUrl: 'https://ethereumclassic.network',
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
  goerli: {
    nodeUrl: 'https://goerli.prylabs.net',
  },
};
