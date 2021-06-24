const { expect } = require("chai");
const { ethers } = require("hardhat");

const { abi } = require("../../artifacts/contracts/MigFinance.sol/MigFinance.json")

describe("MultiSig", function () {
  let multiSigWallet, migFinance;
  let addressList = ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","0x70997970C51812dc3A010C7d01b50e0d17dc79C8"]
  beforeEach(async () => {
    //Deploying Contract MigFinance
    const MigFinance = await ethers.getContractFactory("MigFinance");
    migFinance = await MigFinance.deploy("Mig Finance token", "MIGFINANCE");

    await migFinance.deployed();

    //Deploying Contract Vesting
    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    multiSigWallet = await MultiSigWallet.deploy(addressList,2);

    await multiSigWallet.deployed();
    console.log("address", multiSigWallet.address);

  })


  it("should submit,confirm and not execute tx without setting owner", async () => {
  
    //Checking the approve function
    const signers = await ethers.getSigners();

    //create beneficiary
    let iface = new ethers.utils.Interface( abi )
    let data = iface.encodeFunctionData("setBurnRate", [
      "200",
      "1"
    ])
    const created = await multiSigWallet.submitTransaction(migFinance.address,0,data);
    created.wait();

    let tx = await multiSigWallet.transactions(0);
    expect(await multiSigWallet.getTransactionCount(true,false)).to.equal(1);
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);
    // console.log(tx,"tx");

    const confirmed = await multiSigWallet.connect(signers[1]).confirmTransaction(0);
    confirmed.wait();
    expect(await multiSigWallet.isConfirmed(0)).to.equal(true);
    tx = await multiSigWallet.transactions(0);

    expect(await migFinance.getBurnPercentage()).to.equal("100");


  });

  it("should submit, not confirm and not execute tx without 2nd confirmation", async () => {
  
    //Checking the approve function
    const signers = await ethers.getSigners();

    //create beneficiary
    let iface = new ethers.utils.Interface( abi )
    let data = iface.encodeFunctionData("setBurnRate", [
      "200",
      "1"
    ])
    const created = await multiSigWallet.submitTransaction(migFinance.address,0,data);
    created.wait();

    let tx = await multiSigWallet.transactions(0);
    expect(await multiSigWallet.getTransactionCount(true,false)).to.equal(1);
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);
    // console.log(tx,"tx");

    // const confirmed = await multiSigWallet.connect(signers[1]).confirmTransaction(0);
    // confirmed.wait();
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);
    tx = await multiSigWallet.transactions(0);

    expect(await migFinance.getBurnPercentage()).to.equal("100");


  });

  it("should submit,not confirm and not execute tx if 1st owner revokes confirmation", async () => {
  
    //Checking the approve function
    const signers = await ethers.getSigners();

    //create beneficiary
    let iface = new ethers.utils.Interface( abi )
    let data = iface.encodeFunctionData("setBurnRate", [
      "200",
      "1"
    ])
    const created = await multiSigWallet.submitTransaction(migFinance.address,0,data);
    created.wait();

    let tx = await multiSigWallet.transactions(0);
    expect(await multiSigWallet.getTransactionCount(true,false)).to.equal(1);
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);
    // console.log(tx,"tx");
    
    //revoke 1st confirmation
    const revoked = await multiSigWallet.revokeConfirmation(0);
    revoked.wait();
    let confirmations = await multiSigWallet.getConfirmations(0);
    console.log("Confirmations after revoking", confirmations );
    expect(confirmations.length).to.equal(0);
    
    //2nd owner confirm
    const confirmed = await multiSigWallet.connect(signers[1]).confirmTransaction(0);
    confirmed.wait();
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);
    tx = await multiSigWallet.transactions(0);

    expect(await migFinance.getBurnPercentage()).to.equal("100");


  });

  it("should submit,confirm and execute tx", async () => {
  
    const signers = await ethers.getSigners();

    //set owner
    const transfered = await migFinance.transferOwnership(multiSigWallet.address);
    transfered.wait();
    console.log("new owner",await migFinance.owner());

    //create beneficiary
    let iface = new ethers.utils.Interface( abi )
    let data = iface.encodeFunctionData("setBurnRate", [
      "200",
      "1"
    ])
    const created = await multiSigWallet.submitTransaction(migFinance.address,0,data);
    created.wait();

    let tx = await multiSigWallet.transactions(0);
    expect(await multiSigWallet.getTransactionCount(true,false)).to.equal(1);
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);
    // console.log(tx,"tx");

    const confirmed = await multiSigWallet.connect(signers[1]).confirmTransaction(0);
    confirmed.wait();
    expect(await multiSigWallet.isConfirmed(0)).to.equal(true);
    tx = await multiSigWallet.transactions(0);

    expect(await migFinance.getBurnPercentage()).to.equal("200");


  });
  
});
