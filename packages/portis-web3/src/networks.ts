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

  return networkObj;
}

const networks: { [key: string]: INetwork } = {
  mainnet: {
    nodeUrl: 'https://mainnet.infura.io/v3/faa4639b090f46499f29d894da0551a0',
    chainId: '1',
  },
  ropsten: {
    nodeUrl: 'https://ropsten.infura.io/v3/faa4639b090f46499f29d894da0551a0',
    chainId: '3',
    gasRelayHubAddress: '0x1349584869A1C7b8dc8AE0e93D8c15F5BB3B4B87',
  },
  rinkeby: {
    nodeUrl: 'https://rinkeby.infura.io/v3/faa4639b090f46499f29d894da0551a0',
    chainId: '4',
    gasRelayHubAddress: '0x537f27a04470242ff6b2c3ad247a05248d0d27ce',
  },
  goerli: {
    nodeUrl: 'https://goerli.prylabs.net',
    chainId: '5',
  },
  ubiq: {
    nodeUrl: 'https://rpc1.ubiqscan.io',
    chainId: '8',
  },
  thundercoreTestnet: {
    nodeUrl: 'https://testnet-rpc.thundercore.com:8544',
    chainId: '18',
  },
  orchid: {
    nodeUrl: 'https://public-node.rsk.co',
    chainId: '30',
  },
  orchidTestnet: {
    nodeUrl: 'https://public-node.testnet.rsk.co',
    chainId: '31',
  },
  kovan: {
    nodeUrl: 'https://kovan.infura.io/v3/faa4639b090f46499f29d894da0551a0',
    chainId: '42',
  },
  classic: {
    nodeUrl: 'https://ethereumclassic.network',
    chainId: '61',
  },
  sokol: {
    nodeUrl: 'https://sokol.poa.network',
    chainId: '77',
  },
  core: {
    nodeUrl: 'https://core.poa.network',
    chainId: '99',
  },
  xdai: {
    nodeUrl: 'https://dai.poa.network',
    chainId: '100',
    gasRelayHubAddress: '0x49a984490a7762B0e5d775f0FfA608899Ebe2ee8',
  },
  thundercore: {
    nodeUrl: 'https://mainnet-rpc.thundercore.com',
    chainId: '108',
  },
  matic: {
    nodeUrl: 'https://testnet2.matic.network',
    chainId: '8995',
  },
  fuse: {
    nodeUrl: 'https://rpc.fuse.io',
    chainId: '121',
  },
};
