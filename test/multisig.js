const { expect } = require("chai");
const { ethers } = require("hardhat");

const { abi } = require("../artifacts/contracts/MigFinance.sol/MigFinance.json")

describe("MultiSig", async function () {
  let multiSigWallet, migFinance;
  let owner1;
  let owner2;

  beforeEach(async () => {
    [owner1, owner2, owner3] = await ethers.getSigners();

    //Deploying Contract MigFinance
    const MigFinance = await ethers.getContractFactory("MigFinance");
    migFinance = await MigFinance.deploy("Mig Finance token", "MIGFINANCE");

    //Deploying Contract Multisig
    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    multiSigWallet = await MultiSigWallet.deploy([owner1.address, owner2.address], 2);
  })


  it("should submit,confirm and not execute tx without setting owner", async () => {
    //create transaction data
    let iface = new ethers.utils.Interface(abi)
    let data = iface.encodeFunctionData("setBurnRate", [
      "200",
      "1"
    ])
    await multiSigWallet.connect(owner1).submitTransaction(migFinance.address, 0, data);

    expect(await multiSigWallet.getTransactionCount(true, false)).to.equal(1);
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);

    await multiSigWallet.connect(owner2).confirmTransaction(0);
    expect(await multiSigWallet.isConfirmed(0)).to.equal(true);

    expect(await migFinance.getBurnPercentage()).to.equal("100");
  });

  it("should submit, not confirm and not execute tx without 2nd confirmation", async () => {
    //create beneficiary
    let iface = new ethers.utils.Interface(abi)
    let data = iface.encodeFunctionData("setBurnRate", [
      "200",
      "1"
    ])
    const created = await multiSigWallet.submitTransaction(migFinance.address, 0, data);
    created.wait();

    let tx = await multiSigWallet.transactions(0);
    expect(await multiSigWallet.getTransactionCount(true, false)).to.equal(1);
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);
    // console.log(tx,"tx");

    // const confirmed = await multiSigWallet.connect(signers[1]).confirmTransaction(0);
    // confirmed.wait();
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);
    tx = await multiSigWallet.transactions(0);

    expect(await migFinance.getBurnPercentage()).to.equal("100");


  });

  it("should submit,not confirm and not execute tx if 1st owner revokes confirmation", async () => {
    //create beneficiary
    let iface = new ethers.utils.Interface(abi)
    let data = iface.encodeFunctionData("setBurnRate", [
      "200",
      "1"
    ])
    await multiSigWallet.submitTransaction(migFinance.address, 0, data);

    await multiSigWallet.transactions(0);
    expect(await multiSigWallet.getTransactionCount(true, false)).to.equal(1);
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);

    //revoke 1st confirmation
    await multiSigWallet.revokeConfirmation(0);
    let confirmations = await multiSigWallet.getConfirmations(0);
    expect(confirmations.length).to.equal(0);

    //2nd owner confirm
    await multiSigWallet.connect(owner1).confirmTransaction(0);
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);
    expect(await migFinance.getBurnPercentage()).to.equal("100");
  });

  it("should submit,confirm and execute tx", async () => {
    //set owner
    await migFinance.transferOwnership(multiSigWallet.address);
    //use expect here:
    // console.log("new owner", await migFinance.owner());

    //create beneficiary
    let iface = new ethers.utils.Interface(abi)
    let data = iface.encodeFunctionData("setBurnRate", [
      "200",
      "1"
    ])

    await multiSigWallet.submitTransaction(migFinance.address, 0, data);

    expect(await multiSigWallet.getTransactionCount(true, false)).to.equal(1);
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);

    await multiSigWallet.connect(owner2).confirmTransaction(0);

    expect(await multiSigWallet.isConfirmed(0)).to.equal(true);
    expect(await migFinance.getBurnPercentage()).to.equal("200");
  });

  //it should revert if non owner address tries to submit/confirm/execute (test all 3 as different cases)
});
