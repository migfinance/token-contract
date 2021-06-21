const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MigFinance", function () {
  beforeEach(() => {
    //deploy
  })

  it("Should pass all tests", async function () {
    //Deploying Contract ERC20Token
    const MigFinance = await ethers.getContractFactory("MigFinance");
    const migFinance = await MigFinance.deploy("Mig Finance token", "MIGFINANCE", 10);

    await migFinance.deployed();

    // Checking If the Name of Token Matches
    expect(await migFinance.name()).to.equal("Mig Finance token");

    //Checking the transfer function
    const amountToTransfer = 1000;
    const transferred = await migFinance.transfer("0x6eA5e82d0f47B3b84ae4Fc932b350F6070771412", amountToTransfer);
    await transferred.wait();
    expect(await migFinance.balanceOf("0x6eA5e82d0f47B3b84ae4Fc932b350F6070771412")).to.equal("999");
    expect(await migFinance.totalSupply()).to.be.bignumber.equal("99999999999999999999999999");

    //Checking the Transaction Signer
    const { address } = await migFinance.signer;

    //Checking the approve function
    const amountToApprove = 1000;
    const approved = await migFinance.approve("0x6eA5e82d0f47B3b84ae4Fc932b350F6070771412", amountToApprove);
    await approved.wait();
    expect(await migFinance.allowance(address, "0x6eA5e82d0f47B3b84ae4Fc932b350F6070771412")).to.equal("1000");

    //Checking the transferFrom function
    const amountToTransferFrom = 200;
    const signers = await ethers.getSigners();
    const transferredFrom = await migFinance.connect(signers[2]).transferFrom(address, "0x9109CD2D92B210821313899C5413F94aD5083C39", amountToTransferFrom);
    await transferredFrom.wait();
    console.log("final bal=", migFinance.balanceOf("0x9109CD2D92B210821313899C5413F94aD5083C39"))
    expect(await migFinance.balanceOf("0x9109CD2D92B210821313899C5413F94aD5083C39")).to.equal("100");
  });

  it("should transfer tokens", async () => { });
  it("should transfer from sender to receiver", async () => { });
  it("should deduct fees in transfer", async () => { });
  it("should deduct fees in transferFrom", async () => { });
  it("should not transfer when paused", async () => { });
  it("should not transfer from when paused", async () => { });
});
