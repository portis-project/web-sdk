import { INetwork } from './interfaces';

const IN3_SUPPORTED_CHAINS = ['mainnet', 'kovan', 'goerli'];

export function networkAdapter(network: string | INetwork, gasRelay?: boolean, useIn3?: boolean) {
  const networkObj = typeof network === 'string' ? Object.assign({}, networks[network]) : network;

  if (typeof networkObj !== 'object') {
    throw new Error(
      "[Portis] illegal 'network' parameter. Read more about it here: https://docs.portis.io/#/configuration?id=network",
    );
  }

  if (useIn3) {
    if (!(networkObj.chainId && networkObj['requestCount'] && networkObj['minDeposit'])) {
      throw new Error(
        '[Portis-In3] a in3 config with chainId, requestCount and minDeposit is required. Some or all are missing',
      );
    } else if (!IN3_SUPPORTED_CHAINS.includes(networkObj.chainId)) {
      throw new Error(
        '[Portis-In3] Only mainnet, kovan and goerli are supported with In3. Specify chainId as ["kovan", "mainnet", "goerli"]',
      );
    } else {
      networkObj.nodeUrl = networks[networkObj.chainId].nodeUrl;
    }
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
    gasRelayHubAddress: '0xD216153c06E857cD7f72665E0aF1d7D82172F494',
  },
  ropsten: {
    nodeUrl: 'https://ropsten.infura.io/v3/faa4639b090f46499f29d894da0551a0',
    chainId: '3',
    gasRelayHubAddress: '0xD216153c06E857cD7f72665E0aF1d7D82172F494',
  },
  rinkeby: {
    nodeUrl: 'https://rinkeby.infura.io/v3/faa4639b090f46499f29d894da0551a0',
    chainId: '4',
    gasRelayHubAddress: '0xD216153c06E857cD7f72665E0aF1d7D82172F494',
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
    nodeUrl: 'https://dai.poa.network',
    chainId: '100',
    gasRelayHubAddress: '0xD216153c06E857cD7f72665E0aF1d7D82172F494',
  },
  thundercore: {
    nodeUrl: 'https://mainnet-rpc.thundercore.com',
    chainId: '108',
  },
  fuse: {
    nodeUrl: 'https://rpc.fusenet.io',
    chainId: '122',
  },
  lightstreams: {
    nodeUrl: 'https://node.mainnet.lightstreams.io',
    chainId: '163',
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
