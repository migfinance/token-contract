const { ethers } = require("hardhat");

const mockTokenDeployed = require("./addresses/MockToken.json");
const migFinanceTokenDeployed = require("./addresses/MigFinance.json");

const multiSigWalletConfig = {
  required: 2,
};

const migFinanceConfig = {
  name: "MigFinanceToken",
  symbol: "MIGFINANCE",
};

const vestingConfig = {
  token: migFinanceTokenDeployed.address,
  startTime: Math.floor(Date.now() / 1000),
  endTime: Math.floor(Date.now() / 1000) + 43200,
};

const stakingConfig = {
  stakeToken: mockTokenDeployed.address,
  rewardToken: migFinanceTokenDeployed.address,
};

const mockTokenConfig = {
  name: "MockToken",
  symbol: "MOCKTOKEN",
};

const waitBeforeVerification = 120000;

module.exports = {
  multiSigWalletConfig,
  vestingConfig,
  migFinanceConfig,
  stakingConfig,
  mockTokenConfig,
  waitBeforeVerification
};
