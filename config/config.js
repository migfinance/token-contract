const mockTokenDeployed = require("./addresses/MockToken.json") 
const migFinanceTokenDeployed = require("./addresses/MigFinance.json") 

const multiSigWalletConfig = {
    // owners: ["0x6eA5e82d0f47B3b84ae4Fc932b350F6070771412", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"],
    owners: ["0x0974825B7Bcb3F8649592342EC3C1c35971442f7", "0x6eA5e82d0f47B3b84ae4Fc932b350F6070771412", "0xDD70071E4611E568f850899dAdA09C9F58eEE0be"],
    required: 2
}

const migFinanceConfig = {
    name: "Mig Finance token",
    symbol: "MIGFINANCE"
}

const vestingConfig = {
    token: migFinanceTokenDeployed.address,
    startTime: Math.floor(Date.now()/1000),
    endTime: Math.floor(Date.now()/1000)+1000
}

const stakingConfig = {
    stakeToken: mockTokenDeployed.address,
    rewardToken: migFinanceTokenDeployed.address
}

const mockTokenConfig = {
    name: "Demo Staking Token",
    symbol: "Stake Token"
}

module.exports = {
    multiSigWalletConfig,
    vestingConfig,
    migFinanceConfig,
    stakingConfig,
    mockTokenConfig
}