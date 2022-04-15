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
    nodeUrl: 'https://eth-mainnet.gateway.pokt.network/v1/lb/61391a62a2d82e0037c1a204',
    chainId: '1',
    gasRelayHubAddress: '0xD216153c06E857cD7f72665E0aF1d7D82172F494',
  },
  ropsten: {
    nodeUrl: 'https://eth-ropsten.gateway.pokt.network/v1/lb/61391abba2d82e0037c1a458',
    chainId: '3',
    gasRelayHubAddress: '0xD216153c06E857cD7f72665E0aF1d7D82172F494',
  },
  rinkeby: {
    nodeUrl: 'https://eth-rinkeby.gateway.pokt.network/v1/lb/61391b30a2d82e0037c1a7fc',
    chainId: '4',
    gasRelayHubAddress: '0xD216153c06E857cD7f72665E0aF1d7D82172F494',
  },
  goerli: {
    nodeUrl: 'https://eth-goerli.gateway.pokt.network/v1/lb/61391c2ca2d82e0037c1afc2',
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
    gasRelayHubAddress: '0xD216153c06E857cD7f72665E0aF1d7D82172F494',
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
    nodeUrl: 'https://poa-xdai.gateway.pokt.network/v1/lb/61391c7ea2d82e0037c1b20f',
    chainId: '100',
    gasRelayHubAddress: '0xD216153c06E857cD7f72665E0aF1d7D82172F494',
  },
  thundercore: {
    nodeUrl: 'https://mainnet-rpc.thundercore.com',
    chainId: '108',
  },
  fuse: {
    nodeUrl: 'https://fuse-mainnet.gateway.pokt.network/v1/lb/61391ccca2d82e0037c1b46e',
    chainId: '122',
  },
  lightstreams: {
    nodeUrl: 'https://node.mainnet.lightstreams.io',
    chainId: '163',
  },
  matic: {
    nodeUrl: 'https://poly-mainnet.gateway.pokt.network/v1/lb/61391e68a2d82e0037c1b9e7',
    chainId: '137',
  },
  maticMumbai: {
    nodeUrl: 'https://rpc-mumbai.matic.today',
    chainId: '80001',
  },
  maticAlpha: {
    nodeUrl: 'https://alpha.ethereum.matic.network',
    chainId: '4626',
  },
  maticTestnet: {
    nodeUrl: 'https://testnet2.matic.network',
    chainId: '8995',
  },
};
