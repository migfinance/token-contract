
const hre = require("hardhat");
const fs = require('fs');
const { mockTokenConfig } = require("../config/config")

const main = async () => {
  const MockToken = await hre.ethers.getContractFactory("MockStakeToken");
  const mockToken = await MockToken.deploy(mockTokenConfig.name, mockTokenConfig.symbol);

  await mockToken.deployed();

  const data = { address: mockToken.address };
  fs.writeFileSync(__dirname + '/../config/addresses/MockToken.json', JSON.stringify(data));
  console.log("MockToken deployed at:", mockToken.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
