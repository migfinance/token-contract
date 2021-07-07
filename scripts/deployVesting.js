
const hre = require("hardhat");
const fs = require('fs');
const { vestingConfig, waitBeforeVerification } = require("../config/config");
const contractPath = "contracts/vesting/LinearVesting.sol:LinearVesting";

const main = async () => {
  console.log("LinearVesting deploying with Arguments:", vestingConfig.token, vestingConfig.startTime, vestingConfig.endTime,vestingConfig.cliffPeriod);

  const LinearVesting = await hre.ethers.getContractFactory("LinearVesting");
  const linearVesting = await LinearVesting.deploy(vestingConfig.token, vestingConfig.startTime, vestingConfig.endTime,vestingConfig.cliffPeriod);

  await linearVesting.deployed();

  const data = { address: linearVesting.address };
  fs.writeFileSync(__dirname + '/../config/addresses/linearVesting.json', JSON.stringify(data));
  console.log("LinearVesting deployed at:", linearVesting.address);

  await sleep(waitBeforeVerification);

  await hre.run("verify:verify", {    
    address: linearVesting.address,
    contract: contractPath,
    constructorArguments: [
      vestingConfig.token, 
      vestingConfig.startTime, 
      vestingConfig.endTime
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
