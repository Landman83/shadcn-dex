export enum Network {
  POLYGON_AMOY = 'polygon-amoy',
  POLYGON = 'polygon',
  ETHEREUM_SEPOLIA = 'ethereum-sepolia',
  ETHEREUM = 'ethereum',
  ETHERLINK = 'etherlink',
  ETHERLINK_TESTNET = 'etherlink-testnet',
  ZKSYNC = 'zksync',
  ZKSYNC_SEPOLIA = 'zksync-sepolia',
}

export const getNetworkUrl = () => {
  switch (process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK) {
    case Network.POLYGON:
      return 'https://polygon-rpc.com/';
    case Network.POLYGON_AMOY:
      return 'https://rpc-amoy.polygon.technology/';
    case Network.ETHEREUM_SEPOLIA:
      return 'https://eth-sepolia.g.alchemy.com/v2/fYFybLQFR9Zr2GCRcgALmAktStFKr0i0';
    case Network.ETHEREUM:
      return 'https://eth-mainnet.g.alchemy.com/v2/fYFybLQFR9Zr2GCRcgALmAktStFKr0i0';
    case Network.ETHERLINK:
      return 'https://node.mainnet.etherlink.com';
    case Network.ETHERLINK_TESTNET:
      return 'https://node.ghostnet.etherlink.com';
    case Network.ZKSYNC:
      return 'https://mainnet.era.zksync.io';
    case Network.ZKSYNC_SEPOLIA:
      return 'https://zksync-era-sepolia.blockpi.network/v1/rpc/public';
    default:
      // Default to Ethereum Sepolia for development
      return 'https://eth-sepolia.g.alchemy.com/v2/fYFybLQFR9Zr2GCRcgALmAktStFKr0i0';
  }
};

export const getChainId = () => {
  switch (process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK) {
    case Network.POLYGON:
      return 137;
    case Network.POLYGON_AMOY:
      return 80002;
    case Network.ETHEREUM_SEPOLIA:
      return 11155111;
    case Network.ZKSYNC:
      return 324;
    case Network.ZKSYNC_SEPOLIA:
      return 300;
    case Network.ETHEREUM:
      return 1;
    case Network.ETHERLINK:
      return 42793;
    case Network.ETHERLINK_TESTNET:
      return 128123;
    default:
      // Default to Ethereum Sepolia for development
      return 11155111;
  }
};