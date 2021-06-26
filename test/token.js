const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MigFinance", () => {
  let migFinance;
  let signers;
  let contractSigner;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    //Deploying Contract MigFinance
    const MigFinance = await ethers.getContractFactory("MigFinance");
    migFinance = await MigFinance.deploy("Mig Finance token", "MIGFINANCE");
    await migFinance.deployed();
    contractSigner = await migFinance.signer;

  })


  it("should return name of Token", async () => {
    // Checking If the Name of Token Matches
    expect(await migFinance.name()).to.equal("Mig Finance token");
  });

  it("should return symbol of Token", async () => {
    // Checking If the symbol of Token Matches
    expect(await migFinance.symbol()).to.equal("MIGFINANCE");
  });

  it("should return decimals of Token", async () => {
    // Checking If the decimals of Token Matches
    expect(await migFinance.decimals()).to.equal(18);
  });

  it("should transfer tokens", async () => {
    //Checking the transfer function
    const amountToTransfer = 1000;
    await migFinance.transfer(signers[3].address, amountToTransfer);
    expect(await migFinance.balanceOf(signers[3].address)).to.equal("990");
  });

  it("should transfer from sender to receiver", async () => {

    //approve tokens
    const amountToApprove = 2000;
    await migFinance.approve(signers[2].address, amountToApprove);

    expect(await migFinance.allowance(contractSigner.address, signers[2].address)).to.equal("2000");

    const amountToTransferFrom = 1000;
    //checking transferFrom
    await migFinance.connect(signers[2]).transferFrom(contractSigner.address, signers[1].address, amountToTransferFrom);
    expect(await migFinance.balanceOf(signers[1].address)).to.equal("990");
  });

  it("should deduct fees in transfer", async () => {
    //Checking the transfer function
    const amountToTransfer = 1000;
    await migFinance.transfer(signers[3].address, amountToTransfer);
    expect(await migFinance.balanceOf(signers[3].address)).to.equal("990");
    expect(await migFinance.totalSupply()).to.equal("999999999999999999999990");
  });

  it("should deduct fees in transferFrom", async () => {

    //approve tokens
    const amountToApprove = 2000;
    await migFinance.approve(signers[2].address, amountToApprove);
    expect(await migFinance.allowance(contractSigner.address, signers[2].address)).to.equal("2000");

    //checking transferFrom
    const amountToTransferFrom = 1000;
    await migFinance.connect(signers[2]).transferFrom(contractSigner.address, signers[1].address, amountToTransferFrom);

    expect(await migFinance.balanceOf(signers[1].address)).to.equal("990");
    expect(await migFinance.totalSupply()).to.equal("999999999999999999999990");

    expect(await migFinance.allowance(contractSigner.address, signers[2].address)).to.equal("1000");
  });

  it("should not transfer when paused", async () => {
    //Checking If the Pausing Functionality works
    await migFinance.pause();
    expect(await migFinance.paused()).to.equal(true);
    const amountToTransfer = 1000;

    //Checking the transfer function
    await expect(migFinance.transfer(signers[1].address, amountToTransfer))
      .to.be.revertedWith('Pausable: paused');

  });

  it("should not transfer from when paused", async () => {
    //Checking If the Pausing Functionality works
    await migFinance.pause();
    expect(await migFinance.paused()).to.equal(true);

    //approve tokens
    const amountToApprove = 2000;
    await migFinance.approve(signers[2].address, amountToApprove);
    expect(await migFinance.allowance(contractSigner.address, signers[2].address)).to.equal("2000");

    //checking transferFrom
    const amountToTransferFrom = 1000;
    await expect(migFinance.connect(signers[2]).transferFrom(contractSigner.address, signers[1].address, amountToTransferFrom))
      .to.be.revertedWith('Pausable: paused');

  });

  it("should transfer according to afterFirstMonthBurnRate", async () => {
    //Checking burn rate
    await network.provider.send("evm_increaseTime", [2678410])
    await network.provider.send("evm_mine")

    //Checking the transfer function
    const amountToTransfer = 1000;
    await migFinance.transfer(signers[3].address, amountToTransfer);
    expect(await migFinance.balanceOf(signers[3].address)).to.equal("995");
    expect(await migFinance.totalSupply()).to.equal("999999999999999999999995");
  });

  it("should set burnRate for 1 month", async () => {
    //Check rate set

    await migFinance.setBurnRate("1000", "1");
    expect(await migFinance.getBurnPercentage()).to.equal("1000");
  });

  it("should set burnRate after 1st month", async () => {
    //Check rate set
    await network.provider.send("evm_increaseTime", [2678410])
    await network.provider.send("evm_mine")

    await migFinance.setBurnRate("1000", "2");
    expect(await migFinance.getBurnPercentage()).to.equal("1000");
  });

  it("should deduct fees in transferFrom with limited allowance", async () => {

    //approve tokens
    const amountToApprove = 1000;
    await migFinance.approve(signers[2].address, amountToApprove);
    expect(await migFinance.allowance(contractSigner.address, signers[2].address)).to.equal("1000");

    //checking transferFrom
    const amountToTransferFrom = 1000;
    await migFinance.connect(signers[2]).transferFrom(contractSigner.address, signers[1].address, amountToTransferFrom);

    expect(await migFinance.balanceOf(signers[1].address)).to.equal("990");
    expect(await migFinance.totalSupply()).to.equal("999999999999999999999990");

    expect(await migFinance.allowance(contractSigner.address, signers[2].address)).to.equal("0");   //only transfer amount reduced from allowance
  });

  it("should not transferFrom with limited balance", async () => {
    await migFinance.transfer(signers[1].address, 1000);

    //approve tokens
    const amountToApprove = 1000;
    await migFinance.connect(signers[1]).approve(signers[2].address, amountToApprove);
    expect(await migFinance.allowance(signers[1].address, signers[2].address)).to.equal("1000");

    //checking transferFrom
    const amountToTransferFrom = 1000;
    await expect(migFinance.connect(signers[2]).transferFrom(signers[1].address, signers[3].address, amountToTransferFrom))
      .to.be.revertedWith('ERC20: transfer amount exceeds balance');

    expect(await migFinance.balanceOf(signers[3].address)).to.equal("0");
    expect(await migFinance.totalSupply()).to.equal("999999999999999999999990");

  });
});
