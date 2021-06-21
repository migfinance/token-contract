
const hre = require("hardhat");
const fs = require('fs');


async function main() {
  const MigFinance = await hre.ethers.getContractFactory("MigFinance");
  const migFinance = await MigFinance.deploy("Mig Finance token", "MIGFINANCE", 10);

  await migFinance.deployed();

  const data = { address: migFinance.address };
  fs.writeFileSync(__dirname + '/../addresses/MigFinance', JSON.stringify(data));
  console.log("MigFinance deployed at:", migFinance.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
