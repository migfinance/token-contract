
const hre = require("hardhat");
const fs = require('fs');
const { vestingConfig } = require("../config/config")

async function main() {
  const LinearVesting = await hre.ethers.getContractFactory("LinearVesting");
  const linearVesting = await LinearVesting.deploy(vestingConfig.token,vestingConfig.startTime,vestingConfig.endTime);

  await linearVesting.deployed();

  const data = { address: linearVesting.address };
  fs.writeFileSync(__dirname + '/../addresses/linearVesting', JSON.stringify(data));
  console.log("linearVesting deployed at:", linearVesting.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
