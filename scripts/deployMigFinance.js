
const hre = require("hardhat");
const fs = require('fs');
const { migFinanceConfig } = require("../config/config")

const main = async () => {
  const MigFinance = await hre.ethers.getContractFactory("MigFinance");
  const migFinance = await MigFinance.deploy(migFinanceConfig.name, migFinanceConfig.symbol);

  await migFinance.deployed();

  const data = { address: migFinance.address };
  fs.writeFileSync(__dirname + '/../config/addresses/MigFinance', JSON.stringify(data));
  console.log("MigFinance deployed at:", migFinance.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
