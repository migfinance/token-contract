const { expect, use } = require("chai");
const { solidity } = require("ethereum-waffle");
const { ethers } = require("hardhat");

const { BigNumber } = ethers;

use(solidity);

describe("LinearVesting", () => {
  let staking, migFinanceReward, demoStakeToken;
  let contractSigner;

  const REWARD_TOKEN_NAME = "Mig Finance token";
  const REWARD_TOKEN_SYMBOL = "MIGFINANCE";
  const DECIMALS = BigNumber.from(10).pow(18)
  const TOTAL_SUPPLY = DECIMALS.mul(1000000);

  const STAKING_TOKEN_NAME = "Staking Token";
  const STAKING_TOKEN_SYMBOL = "STAKETOKEN";

  const REWARD_TOKEN_AMOUNT = BigNumber.from(10000).mul(DECIMALS);

  beforeEach(async () => {
    const MigFinanceRewardToken = await ethers.getContractFactory("MigFinance");
    const DemoStakeToken = await ethers.getContractFactory("MockToken");
    const Staking = await ethers.getContractFactory("Staking");

    //Deploying Contract MigFinance
    migFinanceReward = await MigFinanceRewardToken.deploy(REWARD_TOKEN_NAME, REWARD_TOKEN_SYMBOL);
    await migFinanceReward.deployed();

    //Deploying Demo Staking Token
    demoStakeToken = await DemoStakeToken.deploy(STAKING_TOKEN_NAME, STAKING_TOKEN_SYMBOL);
    await demoStakeToken.deployed();

    contractSigner = await migFinanceReward.signer;

    //Deploying Contract staking
    staking = await Staking.deploy(
      demoStakeToken.address,
      migFinanceReward.address
    );
    await staking.deployed();

    //add reward tokens
    await migFinanceReward.transfer(staking.address, REWARD_TOKEN_AMOUNT);

  })

  it("should return deposit count 0 before staking", async () => {
    expect(await staking.depositCount()).to.equal(0);
  });

  it("should stake tokens", async () => {
    //approve tokens
    const amountToApprove = BigNumber.from(1000).mul(DECIMALS);

    await migFinanceReward.approve(staking.address, amountToApprove);
    expect(await migFinanceReward.allowance(contractSigner.address, staking.address)).to.equal(amountToApprove);

    await demoStakeToken.approve(staking.address, amountToApprove);
    expect(await demoStakeToken.allowance(contractSigner.address, staking.address)).to.equal(amountToApprove);

    //create beneficiary
    const stakeAmount = amountToApprove;
    await staking.stake(stakeAmount);

    expect(await staking.depositCount()).to.equal("1");
    expect(await staking.totalStakedAmount()).to.equal(stakeAmount.toString());
    expect(await demoStakeToken.balanceOf(contractSigner.address)).to.equal(TOTAL_SUPPLY.sub(stakeAmount));
  });

  it("should claim tokens", async () => {
    //approve tokens
    const amountToApprove = BigNumber.from(1000).mul(DECIMALS);

    await migFinanceReward.approve(staking.address, amountToApprove);
    expect(await migFinanceReward.allowance(contractSigner.address, staking.address)).to.equal(amountToApprove);

    await demoStakeToken.approve(staking.address, amountToApprove);
    expect(await demoStakeToken.allowance(contractSigner.address, staking.address)).to.equal(amountToApprove);

    //stake
    const stakeAmount = amountToApprove;
    await staking.stake(stakeAmount);

    //check
    expect(await staking.depositCount()).to.equal("1");
    expect(await staking.totalStakedAmount()).to.equal(stakeAmount.toString());
    expect(await demoStakeToken.balanceOf(contractSigner.address)).to.equal(TOTAL_SUPPLY.sub(stakeAmount));

    //increase time
    await ethers.provider.send("evm_increaseTime", [94694400]);
    await ethers.provider.send("evm_mine");
    // const reward = await staking.checkReward("0")

    await staking.claim("0");
    expect(await staking.totalStakedAmount()).to.equal("0");
  });

  it("should claim tokens", async () => {
    //approve tokens
    const amountToApprove = BigNumber.from(1000).mul(DECIMALS);

    await migFinanceReward.approve(staking.address, amountToApprove);
    expect(await migFinanceReward.allowance(contractSigner.address, staking.address)).to.equal(amountToApprove);

    await demoStakeToken.approve(staking.address, amountToApprove);
    expect(await demoStakeToken.allowance(contractSigner.address, staking.address)).to.equal(amountToApprove);

    //stake
    const stakeAmount = amountToApprove;
    await staking.stake(stakeAmount);

    //check
    expect(await staking.depositCount()).to.equal("1");
    expect(await staking.totalStakedAmount()).to.equal(stakeAmount.toString());
    expect(await demoStakeToken.balanceOf(contractSigner.address)).to.equal(TOTAL_SUPPLY.sub(stakeAmount));

    //increase time
    await ethers.provider.send("evm_increaseTime", [94694400]);
    await ethers.provider.send("evm_mine");
    const reward = await staking.checkReward("0")
    console.log(reward,"rewarddd")
    await staking.claim("0");
    expect(await staking.totalStakedAmount()).to.equal("0");
    expect(await demoStakeToken.balanceOf(contractSigner.address)).to.equal(TOTAL_SUPPLY);
    expect(await migFinanceReward.balanceOf(contractSigner.address)).to.equal(TOTAL_SUPPLY.sub(stakeAmount));

  });


});

