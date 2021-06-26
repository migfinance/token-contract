const multiSigWalletConfig = {
    owners: ["0x6eA5e82d0f47B3b84ae4Fc932b350F6070771412", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"],
    required: 2
}

const vestingConfig = {
    token: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    startTime: 1624368807,
    endTime: 1624467807
}

const migFinanceConfig = {
    name: "Mig Finance token",
    symbol: "MIGFINANCE"
}

const stakingConfig = {
    stakeToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    rewardToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
}

module.exports = {
    multiSigWalletConfig,
    vestingConfig,
    migFinanceConfig,
    stakingConfig
}