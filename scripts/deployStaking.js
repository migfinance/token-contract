
const hre = require("hardhat");
const fs = require('fs');
const { stakingConfig, waitBeforeVerification} = require("../config/config");
const contractPath = "contracts/staking/Staking.sol:Staking";


const main = async () => {
  console.log("Staking deploying with Arguments:", stakingConfig.stakeToken, stakingConfig.rewardToken)
  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(stakingConfig.stakeToken, stakingConfig.rewardToken);

  await staking.deployed();

  const data = { address: staking.address };
  fs.writeFileSync(__dirname + '/../config/addresses/staking.json', JSON.stringify(data));
  console.log("staking deployed at:", staking.address);

  await sleep(waitBeforeVerification);

  await hre.run("verify:verify", {    
    address: staking.address,
    contract: contractPath,
    constructorArguments: [
      stakingConfig.stakeToken,
      stakingConfig.rewardToken
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
