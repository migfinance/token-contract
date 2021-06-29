
const hre = require("hardhat");
const fs = require('fs');
const args = require("../verifyMultiSigArguments")


const main = async () => {
  const verified = await hre.run("verify", {
    address: '0x9Cf96430B000D75672aa1F6f3f6281f2009c1487',
    constructorArgs: args,
  })
  
  console.log(verified);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });