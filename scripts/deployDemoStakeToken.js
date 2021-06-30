
const hre = require("hardhat");
const fs = require('fs');
const { mockTokenConfig, waitBeforeVerification } = require("../config/config");
const contractPath = "contracts/mocks/MockStakeToken.sol:MockStakeToken";

const main = async () => {

  console.log("Mock Stake Token deploying with Arguments:", mockTokenConfig.name, mockTokenConfig.symbol)

  const MockToken = await hre.ethers.getContractFactory("MockStakeToken");
  const mockToken = await MockToken.deploy(mockTokenConfig.name, mockTokenConfig.symbol);

  await mockToken.deployed();

  const data = { address: mockToken.address };
  fs.writeFileSync(__dirname + '/../config/addresses/MockToken.json', JSON.stringify(data));
  console.log("MockToken deployed at:", mockToken.address);

  await sleep(waitBeforeVerification);

  await hre.run("verify:verify", {    
    address: mockToken.address,
    contract: contractPath,
    constructorArguments: [
      mockTokenConfig.name,
      mockTokenConfig.symbol
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
