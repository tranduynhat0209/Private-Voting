require("@nomicfoundation/hardhat-toolbox");
/** @type import('hardhat/config').HardhatUserConfig */
const fs = require("fs");
const mnemonic = JSON.parse(fs.readFileSync("secrets.json")).mnemonic;
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.4.24",
      },
      {
        version: "0.8.17",
      },
      {
        version: "0.8.10",
      },
      {
        version: "0.6.11",
      }
    ],
  },
  // defaultNetwork: "testbsc",
  networks: {
    testbsc: {
      chainId: 97,
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts: { mnemonic, count: 20 },
    },
  },
  gasReporter: {
    currency: "BNB",
    gasPrice: 21,
    enabled: true,
  },
};