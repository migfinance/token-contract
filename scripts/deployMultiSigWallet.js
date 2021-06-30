
const hre = require("hardhat");
const fs = require('fs');
const { multiSigWalletConfig, waitBeforeVerification } = require("../config/config");
const contractPath = "contracts/multisig/MultiSigWallet.sol:MultiSigWallet";

const main = async () => {
  [owner1, owner2] = await ethers.getSigners();
  const multiSigOwners = [owner1.address,owner2.address];
  console.log("MultiSigWallet deploying with Arguments:", multiSigOwners, multiSigWalletConfig.required);

  const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");
  const multiSigWallet = await MultiSigWallet.deploy(multiSigOwners, multiSigWalletConfig.required);

  await multiSigWallet.deployed();

  const data = { address: multiSigWallet.address };
  fs.writeFileSync(__dirname + '/../config/addresses/multiSigWallet.json', JSON.stringify(data));
  console.log("multiSigWallet deployed at:", multiSigWallet.address);

  await sleep(waitBeforeVerification);

  await hre.run("verify:verify", {    
    address: multiSigWallet.address,
    contract: contractPath,
    constructorArguments: [
      multiSigOwners, 
      multiSigWalletConfig.required, 
   ],    
  }) 
}

const sleep = milliseconds => {
  console.log(`waiting for ${waitBeforeVerification} milliseconds`);
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
