const { expect, use } = require("chai");
const { solidity } = require("ethereum-waffle");
const { ethers, waffle } = require("hardhat");

const { BigNumber } = ethers;

use(solidity);

describe("LinearVesting", () => {
  let linearVesting, migFinance;
  let contractSigner;

  const existingBeneficiary = "0x0b4d53152f882A219615F148e4C353390072D715";

  const TOKEN_NAME = "Mig Finance token";
  const TOKEN_SYMBOL = "MIGFINANCE";
  const DECIMALS = BigNumber.from(10).pow(18)
  const TOTAL_SUPPLY = DECIMALS.mul(1000000);
  const END_TIME = 1000;
  const CLIFF_TIME = 500;

  beforeEach(async () => {
    const MigFinance = await ethers.getContractFactory("MigFinance");
    const LinearVesting = await ethers.getContractFactory("LinearVesting");

    const block = await ethers.provider.getBlock();

    //Deploying Contract MigFinance
    migFinance = await MigFinance.deploy(TOKEN_NAME, TOKEN_SYMBOL);

    await migFinance.deployed();
    contractSigner = await migFinance.signer;

    //Deploying Contract Vesting
    linearVesting = await LinearVesting.deploy(
      migFinance.address,
      block.timestamp,
      block.timestamp + END_TIME,
      CLIFF_TIME
    );

    await linearVesting.deployed();
  })

  it("should return vested amount of beneficiary", async () => {
    expect(await linearVesting.vestedAmount(existingBeneficiary)).to.equal(TOTAL_SUPPLY);
  });

  it("should create Beneficiary schedule", async () => {
    //approve tokens
    const amountToApprove = BigNumber.from(700).mul(DECIMALS);
    const vestedAmount = amountToApprove.mul(99).div(100); //693 tokens

    await migFinance.approve(linearVesting.address, amountToApprove);
    expect(await migFinance.allowance(contractSigner.address, linearVesting.address)).to.equal(amountToApprove);

    //create beneficiary
    await linearVesting.createVestingSchedule(contractSigner.address, amountToApprove);

    expect(await linearVesting.vestedAmount(contractSigner.address)).to.equal(vestedAmount.toString());
    expect(await migFinance.balanceOf(contractSigner.address)).to.equal(TOTAL_SUPPLY.sub(amountToApprove));
  });

  it("should not draw down Beneficiary amount before cliff time", async () => {
    //approve tokens
    const amountToApprove = BigNumber.from(700).mul(DECIMALS);
    const vestedAmount = amountToApprove.mul(99).div(100); //693 tokens

    await migFinance.approve(linearVesting.address, amountToApprove);
    expect(await migFinance.allowance(contractSigner.address, linearVesting.address)).to.equal(amountToApprove);

    //create beneficiary
    await linearVesting.createVestingSchedule(contractSigner.address, amountToApprove);
    expect(await linearVesting.vestedAmount(contractSigner.address)).to.equal(vestedAmount);

    //draw call
    await expect(
      linearVesting.drawDown()
    ).to.be.revertedWith('VestingContract::_drawDown: ERR_NO_AMOUNT_WITHDRAWABLE');

    expect(await linearVesting.vestedAmount(contractSigner.address)).to.equal(vestedAmount);
    expect(await migFinance.balanceOf(contractSigner.address)).to.equal(TOTAL_SUPPLY.sub(amountToApprove));
  });

  it("should draw down whole Beneficiary amount", async () => {
    const increaseTimeBy = END_TIME 
    const amountToApprove = BigNumber.from(700).mul(DECIMALS);
    const vestedAmount = amountToApprove.mul(99).div(100); //693 tokens

    //approve tokens
    await migFinance.approve(linearVesting.address, amountToApprove);
    expect(await migFinance.allowance(contractSigner.address, linearVesting.address)).to.equal(amountToApprove);

    //create beneficiary
    await linearVesting.createVestingSchedule(contractSigner.address, amountToApprove);
    expect(await linearVesting.vestedAmount(contractSigner.address)).to.equal(vestedAmount);

    const afterVesting = TOTAL_SUPPLY.sub(amountToApprove);
    expect(await migFinance.balanceOf(contractSigner.address)).to.equal(afterVesting);
    expect(await linearVesting.remainingBalance(contractSigner.address)).to.equal(vestedAmount);

    //draw call with increased time
    await ethers.provider.send("evm_increaseTime", [increaseTimeBy])
    await ethers.provider.send("evm_mine")

    //draw down after end time
    await linearVesting.drawDown();

    expect(await linearVesting.availableDrawDownAmount(contractSigner.address)).to.equal(0);
    expect(await linearVesting.remainingBalance(contractSigner.address)).to.equal(0);
    expect(await linearVesting.vestedAmount(contractSigner.address)).to.equal(vestedAmount);
    
    const afterDrwan = afterVesting.add(vestedAmount.mul(99).div(100))
    expect(await migFinance.balanceOf(contractSigner.address)).to.equal(afterDrwan); //999986070000000000000000
  });
});

