require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

const infuraKey = process.env.INFURA_KEY;
const privateKey = [process.env.PRIVATE_KEY_1,process.env.PRIVATE_KEY_2,process.env.PRIVATE_KEY_3];
const apiKey = process.env.API_KEY;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: 'bscTestnet',
  networks: {
    hardhat: {},
    kovan: {
      url: `https://kovan.infura.io/v3/${infuraKey}`,
      accounts: privateKey
    },
    bscTestnet: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
      accounts: privateKey
    }
  },
  etherscan: {
    apiKey
  },
  solidity: "0.8.5",
  mocha: {
    timeout: 200000
  }
};

