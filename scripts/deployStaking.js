
const hre = require("hardhat");
const fs = require('fs');
const { stakingConfig } = require("../config/config")

const main = async () => {
  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(stakingConfig.stakeToken, stakingConfig.rewardToken);

  await staking.deployed();

  const data = { address: staking.address };
  fs.writeFileSync(__dirname + '/../config/addresses/staking', JSON.stringify(data));
  console.log("staking deployed at:", staking.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
