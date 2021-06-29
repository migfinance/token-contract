
const hre = require("hardhat");
const fs = require('fs');
const { multiSigWalletConfig } = require("../config/config")

const main = async () => {
  const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");
  const multiSigWallet = await MultiSigWallet.deploy(multiSigWalletConfig.owners, multiSigWalletConfig.required);

  await multiSigWallet.deployed();

  const data = { address: multiSigWallet.address };
  fs.writeFileSync(__dirname + '/../config/addresses/multiSigWallet.json', JSON.stringify(data));
  console.log("multiSigWallet deployed at:", multiSigWallet.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
