require("@nomicfoundation/hardhat-toolbox");
/** @type import('hardhat/config').HardhatUserConfig */
const fs = require("fs");
const mnemonic = JSON.parse(fs.readFileSync("secrets.json")).mnemonic;

const ALCHEMY_API_KEY = "PqfY1E0Hw55dcfLwlK1zRLFr7JgbT2hQ";
const CHUNG_PK = "0x5633b9938fbce54532dd4b4efef6655447db8c9bf709d36ad93aee2a13b89133";
const KHANH_PK = "0x84420661e3687dec99515ebd67e7722c236ef25a28c69ee4652742a3feef6ad9";
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
      //accounts: { mnemonic, count: 20 },
      accounts: [CHUNG_PK, KHANH_PK]
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [CHUNG_PK]
    }
  },
  gasReporter: {
    currency: "BNB",
    gasPrice: 21,
    enabled: true,
  },
};