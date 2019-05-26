import { INetwork } from './interfaces';

export function networkAdapter(network: string | INetwork, gasRelay?: boolean) {
  const networkObj = typeof network === 'string' ? Object.assign({}, networks[network]) : network;

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

  if (gasRelay && !networkObj.gasRelayHubAddress) {
    throw new Error(`[Portis] can't find default gas relay hub for ${network}`);
  }

  if (typeof network === 'string' && !gasRelay) {
    delete networkObj.gasRelayHubAddress;
  }

  networkObj.nodeProtocol = networkObj.nodeProtocol || 'rpc';
  return networkObj;
}

const networks: { [key: string]: INetwork } = {
  mainnet: {
    nodeUrl: 'https://mainnet.infura.io/v3/faa4639b090f46499f29d894da0551a0',
    nodeProtocol: 'rpc',
    chainId: '1',
  },
  ropsten: {
    nodeUrl: 'https://ropsten.infura.io/v3/faa4639b090f46499f29d894da0551a0',
    nodeProtocol: 'rpc',
    chainId: '3',
    gasRelayHubAddress: '0x1349584869A1C7b8dc8AE0e93D8c15F5BB3B4B87',
  },
  rinkeby: {
    nodeUrl: 'https://rinkeby.infura.io/v3/faa4639b090f46499f29d894da0551a0',
    nodeProtocol: 'rpc',
    chainId: '4',
  },
  goerli: {
    nodeUrl: 'https://goerli.prylabs.net',
    nodeProtocol: 'rpc',
    chainId: '5',
  },
  ubiq: {
    nodeUrl: 'https://rpc1.ubiqscan.io',
    nodeProtocol: 'rpc',
    chainId: '8',
  },
  thundercoreTestnet: {
    nodeUrl: 'https://testnet-rpc.thundercore.com:8544',
    nodeProtocol: 'rpc',
    chainId: '18',
  },
  orchid: {
    nodeUrl: 'https://public-node.rsk.co',
    nodeProtocol: 'rpc',
    chainId: '30',
  },
  orchidTestnet: {
    nodeUrl: 'https://public-node.testnet.rsk.co',
    nodeProtocol: 'rpc',
    chainId: '31',
  },
  kovan: {
    nodeUrl: 'https://kovan.infura.io/v3/faa4639b090f46499f29d894da0551a0',
    nodeProtocol: 'rpc',
    chainId: '42',
  },
  classic: {
    nodeUrl: 'https://ethereumclassic.network',
    nodeProtocol: 'rpc',
    chainId: '61',
  },
  sokol: {
    nodeUrl: 'https://sokol.poa.network',
    nodeProtocol: 'rpc',
    chainId: '77',
  },
  core: {
    nodeUrl: 'https://core.poa.network',
    nodeProtocol: 'rpc',
    chainId: '99',
  },
  xdai: {
    nodeUrl: 'https://dai.poa.network',
    nodeProtocol: 'rpc',
    chainId: '100',
    gasRelayHubAddress: '0x49a984490a7762B0e5d775f0FfA608899Ebe2ee8',
  },
  thundercore: {
    nodeUrl: 'https://mainnet-rpc.thundercore.com',
    nodeProtocol: 'rpc',
    chainId: '108',
  },
  matic: {
    nodeUrl: 'https://testnet2.matic.network',
    nodeProtocol: 'rpc',
    chainId: '8995',
  },
  fuse: {
    nodeUrl: 'https://rpc.fuse.io',
    nodeProtocol: 'rpc',
    chainId: '121',
  },
};
