const { expect } = require("chai");
const { ethers } = require("hardhat");

const { abi } = require("../artifacts/contracts/MigFinance.sol/MigFinance.json")

describe("MultiSig", async () => {
  let multiSigWallet, migFinance;
  let owner1;
  let owner2;
  beforeEach(async () => {
    [owner1, owner2, nonOwner1] = await ethers.getSigners();

    //Deploying Contract MigFinance
    const MigFinance = await ethers.getContractFactory("MigFinance");
    migFinance = await MigFinance.deploy("Mig Finance token", "MIGFINANCE");

    //Deploying Contract Multisig
    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    multiSigWallet = await MultiSigWallet.deploy([owner1.address, owner2.address], 2);
  })


  it("should submit,confirm and not execute tx without setting owner", async () => {
    //create transaction data
    const data = getTxData();

    await multiSigWallet.connect(owner1).submitTransaction(migFinance.address, 0, data);

    expect(await multiSigWallet.getTransactionCount(true, false)).to.equal(1);
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);

    await multiSigWallet.connect(owner2).confirmTransaction(0);
    expect(await multiSigWallet.isConfirmed(0)).to.equal(true);

    expect(await migFinance.getBurnPercentage()).to.equal("100");
  });

  it("should submit, not confirm and not execute tx without 2nd confirmation", async () => {
    //set owner
    await migFinance.transferOwnership(multiSigWallet.address);
    expect(await migFinance.owner()).to.equal(multiSigWallet.address);

    //create transaction data
    const data = getTxData();

    //submit tx
    await multiSigWallet.submitTransaction(migFinance.address, 0, data);


    expect(await multiSigWallet.getTransactionCount(true, false)).to.equal(1);
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);

    expect(await migFinance.getBurnPercentage()).to.equal("100");


  });

  it("should submit,not confirm and not execute tx if 1st owner revokes confirmation", async () => {
    //set owner
    await migFinance.transferOwnership(multiSigWallet.address);
    expect(await migFinance.owner()).to.equal(multiSigWallet.address);

    //create transaction data
    const data = getTxData();

    await multiSigWallet.submitTransaction(migFinance.address, 0, data);

    await multiSigWallet.transactions(0);
    expect(await multiSigWallet.getTransactionCount(true, false)).to.equal(1);
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);

    //revoke 1st confirmation
    await multiSigWallet.revokeConfirmation(0);
    const confirmations = await multiSigWallet.getConfirmations(0);
    expect(confirmations.length).to.equal(0);

    //2nd owner confirm
    await multiSigWallet.connect(owner1).confirmTransaction(0);
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);
    expect(await migFinance.getBurnPercentage()).to.equal("100");
  });

  it("should submit,confirm and execute tx", async () => {
    //set owner
    await migFinance.transferOwnership(multiSigWallet.address);
    expect(await migFinance.owner()).to.equal(multiSigWallet.address);

    //create transaction data
    const data = getTxData();

    await multiSigWallet.submitTransaction(migFinance.address, 0, data);

    expect(await multiSigWallet.getTransactionCount(true, false)).to.equal(1);
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);

    await multiSigWallet.connect(owner2).confirmTransaction(0);

    expect(await multiSigWallet.isConfirmed(0)).to.equal(true);
    expect(await migFinance.getBurnPercentage()).to.equal("200");
  });

  it("should not submit, if sender is not MultiSigWallet Owner", async () => {
    //set owner
    await migFinance.transferOwnership(multiSigWallet.address);
    expect(await migFinance.owner()).to.equal(multiSigWallet.address);

    //create transaction data
    const data = getTxData();

    // tx reverts without a reason if sender is not owner
    await expect(
      multiSigWallet.connect(nonOwner1).submitTransaction(migFinance.address, 0, data)
    ).to.be.revertedWith('');
    expect(await multiSigWallet.getTransactionCount(true, false)).to.equal(0);
    expect(await migFinance.getBurnPercentage()).to.equal("100");

  });

  it("should not confirm, if sender is not MultiSigWallet Owner", async () => {
    //set owner
    await migFinance.transferOwnership(multiSigWallet.address);
    expect(await migFinance.owner()).to.equal(multiSigWallet.address);

    //create transaction data
    const data = getTxData();

    //submit tx by owner
    await multiSigWallet.connect(owner1).submitTransaction(migFinance.address, 0, data);

    expect(await multiSigWallet.getTransactionCount(true, false)).to.equal(1);
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);

    // tx reverts without a reason if sender is not owner
    await expect(
      multiSigWallet.connect(nonOwner1).confirmTransaction(0)
    ).to.be.revertedWith('');
    const confirmations = await multiSigWallet.getConfirmations(0);
    expect(confirmations.length).to.equal(1);
    expect(await migFinance.getBurnPercentage()).to.equal("100");

  });

  it("should not execute, if sender is not MultiSigWallet Owner", async () => {
    //set owner
    await migFinance.transferOwnership(multiSigWallet.address);
    expect(await migFinance.owner()).to.equal(multiSigWallet.address);

    //create transaction data
    const data = getTxData();

    //submit tx by owner
    await multiSigWallet.connect(owner1).submitTransaction(migFinance.address, 0, data);

    expect(await multiSigWallet.getTransactionCount(true, false)).to.equal(1);
    expect(await multiSigWallet.isConfirmed(0)).to.equal(false);

    //confirm 2nd owner
    await multiSigWallet.connect(owner2).confirmTransaction(0);

    // tx reverts without a reason if sender is not owner
    await expect(
      multiSigWallet.connect(nonOwner1).executeTransaction(0)
    ).to.be.revertedWith('');
    const confirmations = await multiSigWallet.getConfirmations(0);
    expect(confirmations.length).to.equal(2);
    expect(await migFinance.getBurnPercentage()).to.equal("200");

  });
});


const getTxData = () => {
  const iface = new ethers.utils.Interface(abi)
  const data = iface.encodeFunctionData("setBurnRate", [
    "200",
    "1"
  ]);
  return data;
}
