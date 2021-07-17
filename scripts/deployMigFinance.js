
const hre = require("hardhat");
const fs = require('fs');
const { migFinanceConfig, waitBeforeVerification } = require("../config/config")
const contractPath = "contracts/MigFinance.sol:MigFinance";


const main = async () => {
  const MigFinance = await hre.ethers.getContractFactory("MigFinance");
  const migFinance = await MigFinance.deploy(migFinanceConfig.name, migFinanceConfig.symbol);

  await migFinance.deployed();

  const data = { address: migFinance.address };
  fs.writeFileSync(__dirname + '/../config/addresses/MigFinance.json', JSON.stringify(data));
  console.log("MigFinance deployed at:", migFinance.address);

  await sleep(waitBeforeVerification);

  await hre.run("verify:verify", {    
    address: migFinance.address,
    contract: contractPath,
    constructorArguments: [
      migFinanceConfig.name,
      migFinanceConfig.symbol
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
