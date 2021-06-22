const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MigFinance", function () {
  let migFinance;
  let addressList = ["0x6eA5e82d0f47B3b84ae4Fc932b350F6070771412","0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"]
  beforeEach(async () => {

    //Deploying Contract MigFinance
    const MigFinance = await ethers.getContractFactory("MigFinance");
    migFinance = await MigFinance.deploy("Mig Finance token", "MIGFINANCE");

    await migFinance.deployed();
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
    const transferred = await migFinance.transfer(addressList[0], amountToTransfer);
    await transferred.wait();
    expect(await migFinance.balanceOf(addressList[0])).to.equal("990");
  });

  it("should transfer from sender to receiver", async () => { 
    let { address } = await migFinance.signer;

    //Checking the approve function
    const amountToApprove = 2000;
    const approved = await migFinance.approve(addressList[2], amountToApprove);
    await approved.wait();
    expect(await migFinance.allowance(address, addressList[2])).to.equal("2000");
    
    const amountToTransferFrom = 1000;
    const signers = await ethers.getSigners();

    const transferredFrom = await migFinance.connect(signers[2]).transferFrom(address, addressList[1], amountToTransferFrom);
    await transferredFrom.wait();
    console.log("final bal=",await migFinance.balanceOf(addressList[1]))
    expect(await migFinance.balanceOf(addressList[1])).to.equal("990");
  });

  it("should deduct fees in transfer", async () => {
    //Checking the transfer function
    const amountToTransfer = 1000;
    const transferred = await migFinance.transfer(addressList[0], amountToTransfer);
    await transferred.wait();
    expect(await migFinance.balanceOf(addressList[0])).to.equal("990");
    console.log(await migFinance.totalSupply())
    expect(await migFinance.totalSupply()).to.equal("999999999999999999999990");
  });

  it("should deduct fees in transferFrom", async () => { 
    const { address } = await migFinance.signer;

    //Checking the approve function
    const amountToApprove = 2000;
    const approved = await migFinance.approve(addressList[2], amountToApprove);
    await approved.wait();
    expect(await migFinance.allowance(address, addressList[2])).to.equal("2000");

    const amountToTransferFrom = 1000;
    const signers = await ethers.getSigners();
    const transferredFrom = await migFinance.connect(signers[2]).transferFrom(address, addressList[1], amountToTransferFrom);
    await transferredFrom.wait();
    
    expect(await migFinance.balanceOf(addressList[1])).to.equal("990");
    expect(await migFinance.totalSupply()).to.equal("999999999999999999999990");

    expect(await migFinance.allowance(address, addressList[2])).to.equal("1000");
  });

  it("should not transfer when paused", async () => {
    //Checking If the Pausing Functionality works
    const pauseData = await migFinance.pause();
    await pauseData.wait();
    const paused = await migFinance.paused();
    expect(await migFinance.paused()).to.equal(true);
    const amountToTransfer = 1000;
    const transferred = await migFinance.transfer(addressList[0], amountToTransfer);
    await transferred.wait();
  });

  it("should not transfer from when paused", async () => { 
    //Checking If the Pausing Functionality works
    const pauseData = await migFinance.pause();
    await pauseData.wait();
    const paused = await migFinance.paused();
    expect(await migFinance.paused()).to.equal(true);
    const { address } = await migFinance.signer;

    //Checking the approve function
    const amountToApprove = 2000;
    const approved = await migFinance.approve(addressList[2], amountToApprove);
    await approved.wait();
    expect(await migFinance.allowance(address, addressList[2])).to.equal("2000");

    const amountToTransferFrom = 1000;
    const signers = await ethers.getSigners();
    const transferredFrom = await migFinance.connect(signers[2]).transferFrom(address, addressList[1], amountToTransferFrom);
    await transferredFrom.wait();
    console.log("final bal=",await migFinance.balanceOf(addressList[1]))
  });

  it("should transfer according to afterFirstMonthBurnRate", async () => {
    //Checking burn rate
    await network.provider.send("evm_increaseTime", [2678410])
    await network.provider.send("evm_mine")

    const amountToTransfer = 1000;
    const transferred = await migFinance.transfer(addressList[0], amountToTransfer);
    await transferred.wait();
    expect(await migFinance.balanceOf(addressList[0])).to.equal("995");
    console.log(await migFinance.totalSupply())
    expect(await migFinance.totalSupply()).to.equal("999999999999999999999995");
  });

  it("should set burnRate for 1 month", async () => {
    //Check rate set

    const seRate = await migFinance.setBurnRate("1000","1");
    await seRate.wait();
    expect(await migFinance.getBurnPercentage()).to.equal("1000");
    console.log(await migFinance.getBurnPercentage())
  });

  it("should set burnRate after 1st month", async () => {
    //Check rate set
    await network.provider.send("evm_increaseTime", [2678410])
    await network.provider.send("evm_mine")

    const seRate = await migFinance.setBurnRate("1000","2");
    await seRate.wait();
    expect(await migFinance.getBurnPercentage()).to.equal("1000");
    console.log(await migFinance.getBurnPercentage())
  });

  it("should deduct fees in transferFrom with limited allowance", async () => { 
    const { address } = await migFinance.signer;

    //Checking the approve function
    const amountToApprove = 1000;
    const approved = await migFinance.approve(addressList[2], amountToApprove);
    await approved.wait();
    expect(await migFinance.allowance(address, addressList[2])).to.equal("1000");

    const amountToTransferFrom = 1000;
    const signers = await ethers.getSigners();
    const transferredFrom = await migFinance.connect(signers[2]).transferFrom(address, addressList[1], amountToTransferFrom);
    await transferredFrom.wait();
    
    expect(await migFinance.balanceOf(addressList[1])).to.equal("990");
    expect(await migFinance.totalSupply()).to.equal("999999999999999999999990");

    expect(await migFinance.allowance(address, addressList[2])).to.equal("0");   //only transfer amount reduced from allowance
  });

  it("should deduct fees in transferFrom with limited balance", async () => { 
    const sent = await migFinance.transfer(addressList[1],1000);
    await sent.wait();
    console.log(await migFinance.balanceOf(addressList[1]));
    const { address } = await migFinance.signer;
    const signers = await ethers.getSigners();

    //Checking the approve function
    const amountToApprove = 10000;
    const approved = await migFinance.connect(signers[1]).approve(addressList[2], amountToApprove);
    await approved.wait();
    expect(await migFinance.allowance(addressList[1], addressList[2])).to.equal("10000");

    const amountToTransferFrom = 1000;
    const transferredFrom = await migFinance.connect(signers[2]).transferFrom(addressList[1], addressList[0], amountToTransferFrom);
    await transferredFrom.wait(); //Error: Transfer Amount exceeds allowance
    console.log(await migFinance.allowance(addressList[1], addressList[2]))
    expect(await migFinance.balanceOf(addressList[0])).to.equal("990");
    expect(await migFinance.totalSupply()).to.equal("999999999999999999999990");

    expect(await migFinance.allowance(address, addressList[2])).to.equal("0");   //only transfer amount reduced from allowance
  });
});
