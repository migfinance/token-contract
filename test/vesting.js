const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LinearVesting", () => {
  let linearVesting, migFinance;
  const existingBeneficiary = "0xB32A83EEC46B116C53a957Cb07318310c390125F";
  let  contractSigner;

  beforeEach(async () => {
    //Deploying Contract MigFinance
    const MigFinance = await ethers.getContractFactory("MigFinance");
    migFinance = await MigFinance.deploy("Mig Finance token", "MIGFINANCE");

    await migFinance.deployed();
    contractSigner = await migFinance.signer;
    //Deploying Contract Vesting
    const LinearVesting = await ethers.getContractFactory("LinearVesting");
    linearVesting = await LinearVesting.deploy(migFinance.address, Math.floor(Date. now() / 1000)+10, Math.floor(Date. now() / 1000)+1000);

    await linearVesting.deployed();
  })


  it("should return vested amount of beneficiary", async () => {
    expect(await linearVesting.vestedAmount(existingBeneficiary)).to.equal("1000000000000000000000000");
  });

  it("should create Beneficiary schedule", async () => {
    //approve tokens
    const amountToApprove = "70000000000000";
    await migFinance.approve(linearVesting.address, amountToApprove);
    expect(await migFinance.allowance(contractSigner.address, linearVesting.address)).to.equal(amountToApprove);

    //create beneficiary
    await linearVesting.createVestingSchedule(contractSigner.address,"70000000000");
    expect(await linearVesting.vestedAmount(contractSigner.address)).to.equal("69300000000");
    expect(await migFinance.balanceOf(contractSigner.address)).to.equal("999999999999930000000000");

  });

  it("should not draw down Beneficiary amount before end time", async () => {
  
    //approve tokens

    const amountToApprove = "70000000000";
    await migFinance.approve(linearVesting.address, amountToApprove);
    expect(await migFinance.allowance(contractSigner.address, linearVesting.address)).to.equal(amountToApprove);

    //create beneficiary
    await linearVesting.createVestingSchedule(contractSigner.address,"70000000000");
    expect(await linearVesting.vestedAmount(contractSigner.address)).to.equal("69300000000");

    //draw call
    await linearVesting.drawDown();
    expect(await linearVesting.vestedAmount(contractSigner.address)).to.equal("70000000000");    
    expect(await migFinance.balanceOf(contractSigner.address)).to.equal("999999999999930000000000");

  });

  it("should draw down Beneficiary amount", async () => {
  
    //approve tokens
    const amountToApprove = "70000000000";
    await migFinance.approve(linearVesting.address, amountToApprove);
    expect(await migFinance.allowance(contractSigner.address, linearVesting.address)).to.equal(amountToApprove);

    //create beneficiary
    await linearVesting.createVestingSchedule(contractSigner.address,"70000000000");
    expect(await linearVesting.vestedAmount(contractSigner.address)).to.equal("69300000000");
    expect(await migFinance.balanceOf(contractSigner.address)).to.equal("999999999999930000000000");

    //draw call with increased time
    await network.provider.send("evm_increaseTime", [2679410])
    await network.provider.send("evm_mine")
    await linearVesting.drawDown();

    expect(await linearVesting.vestedAmount(contractSigner.address)).to.equal(0);
    expect(await migFinance.balanceOf(contractSigner.address)).to.equal("999999999999998953500000");

  });

  
});

