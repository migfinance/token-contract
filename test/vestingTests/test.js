const { expect } = require("chai");
const { ethers } = require("hardhat");
const { vestingConfig } = require("../../config/config")

describe("LinearVesting", function () {
  let linearVesting, migFinance;
  let addressList = ["0x6eA5e82d0f47B3b84ae4Fc932b350F6070771412","0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"]
  beforeEach(async () => {
    //Deploying Contract MigFinance
    const MigFinance = await ethers.getContractFactory("MigFinance");
    migFinance = await MigFinance.deploy("Mig Finance token", "MIGFINANCE");

    await migFinance.deployed();

    //Deploying Contract Vesting
    const LinearVesting = await ethers.getContractFactory("LinearVesting");
    linearVesting = await LinearVesting.deploy(migFinance.address, Math.floor(Date. now() / 1000)+10, Math.floor(Date. now() / 1000)+1000);

    await linearVesting.deployed();
    console.log("address", linearVesting.address);
  })

  it("should return name of Token", async () => {
    // Checking If the Name of Token Matches
    expect(await migFinance.name()).to.equal("Mig Finance token");
  });

  it("should return vested amount of beneficiary", async () => {
    // Checking If the Name of Token Matches
    // console.log(await linearVesting.vestingScheduleForBeneficiary("0xB32A83EEC46B116C53a957Cb07318310c390125F"));
    expect(await linearVesting.vestedAmount("0xB32A83EEC46B116C53a957Cb07318310c390125F")).to.equal("1000000000000000000000000");
  });

  it("should create Beneficiary schedule", async () => {

    //Checking the approve function
    let {address} = await migFinance.signer;
    const amountToApprove = "70000000000000";
    const approved = await migFinance.approve(linearVesting.address, amountToApprove);
    await approved.wait();
    expect(await migFinance.allowance(address, linearVesting.address)).to.equal("70000000000000");

    const created = await linearVesting.createVestingSchedule("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","70000000000");
    created.wait();
    expect(await linearVesting.vestedAmount("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")).to.equal("69300000000");

  });

  it("should not draw down Beneficiary amount before end time", async () => {
  
    //Checking the approve function
    let {address} = await migFinance.signer;
    const amountToApprove = "70700000000";
    const approved = await migFinance.approve(linearVesting.address, amountToApprove);
    await approved.wait();
    expect(await migFinance.allowance(address, linearVesting.address)).to.equal("70700000000");
    let balance = await migFinance.balanceOf(address);
    console.log("before balance of beneficiary=", balance)
    //create beneficiary
    const created = await linearVesting.createVestingSchedule(address,"70000000000");
    created.wait();
    expect(await linearVesting.vestedAmount(address)).to.equal("69300000000");

    //draw call
    // await network.provider.send("evm_increaseTime", [2679410])
    // await network.provider.send("evm_mine")
    const drawn = await linearVesting.drawDown();
    drawn.wait();
    expect(await linearVesting.vestedAmount(address)).to.equal("70000000000");
    balance = await migFinance.balanceOf(address);
    console.log("after balance of beneficiary=", balance)

  });

  it("should draw down Beneficiary amount", async () => {
  
    //Checking the approve function
    let {address} = await migFinance.signer;
    const amountToApprove = "70700000000";
    const approved = await migFinance.approve(linearVesting.address, amountToApprove);
    await approved.wait();
    expect(await migFinance.allowance(address, linearVesting.address)).to.equal("70700000000");
    let balance = await migFinance.balanceOf(address);
    console.log("before balance of beneficiary=", balance)
    //create beneficiary
    const created = await linearVesting.createVestingSchedule(address,"70000000000");
    created.wait();
    expect(await linearVesting.vestedAmount(address)).to.equal("69300000000");

    //draw call
    await network.provider.send("evm_increaseTime", [2679410])
    await network.provider.send("evm_mine")
    const drawn = await linearVesting.drawDown();
    drawn.wait();
    expect(await linearVesting.vestedAmount(address)).to.equal(0);
    balance = await migFinance.balanceOf(address);
    console.log("after balance of beneficiary=", balance)

  });

  
});
