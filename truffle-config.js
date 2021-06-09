const HDWalletProvider = require('@truffle/hdwallet-provider')
require('dotenv').config()

const mnemonic = process.env.MNEMONIC
const urlKovan = process.env.RPC_URL
const urlRinkeby = process.env.RPC_URL_RINKEBY

module.exports = {
  networks: {
    cldev: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
    },
    ganache: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*',
    },
    binance_testnet: {
      provider: () => new HDWalletProvider(mnemonic,'https://data-seed-prebsc-1-s1.binance.org:8545'),
      network_id: 97,
      confirmations: 10,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    kovan: {
      provider: () => {
        return new HDWalletProvider(mnemonic, urlKovan)
      },
      network_id: '42',
      skipDryRun: true
    },
    rinkeby: {
      provider: () => {
        return new HDWalletProvider(mnemonic, urlRinkeby)
      },
      network_id: '4',
      gas: 4500000,
      gasPrice: 1000000000,
    },
  },
  compilers: {
    solc: {
      version: '0.6.6',
    },
  },
}
