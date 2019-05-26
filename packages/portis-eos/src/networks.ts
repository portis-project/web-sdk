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
  eos: {
    nodeUrl: 'https://jungle2.cryptolions.io',
    nodeProtocol: 'rpc',
    chainId: 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473',
  },
};
