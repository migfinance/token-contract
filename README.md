Commands used for Verifying Contracts:

1. MockStakeToken:

Deploy and Verify command: 
npm run deployDemoStakeToken

Separately Verify:
npx hardhat verify --show-stack-traces --network kovan --contract contracts/mocks/MockStakeToken.sol:MockStakeToken 0xeb2CD0f6F3C0eE6dfA1C33EbfA7FF78e3c20618f "MockToken" "MOCKTOKEN"

2. MigFinance:
Deploy and Verify command: 
npm run deployMigFinance

Separately Verify:
npx hardhat verify --show-stack-traces --network bscTestnet --contract contracts/MigFinance.sol:MigFinance 0x37a593e85c42D688c7e7838F41113E7aAb3a011b "Mig Finance token" "MIGFINACE"

3. LinearVesting:
Deploy and Verify command: 
npm run deployVesting

Separately Verify:
npx hardhat verify --show-stack-traces --network bscTestnet --contract contracts/vesting/LinearVesting.sol:LinearVesting 0x1e8F999327c160F037D848A06569672d27441cd5 "0xd5e71aEa9bf2B44363Da88caBc2F50F4f13169B4" "1624985041" "1624986041"

4. Staking:
Deploy and Verify command: 
npm run deployStaking

Separately Verify
npx hardhat verify --show-stack-traces --network bscTestnet --contract contracts/staking/Staking.sol:Staking 0x6acA1367479A986FFc4c6c998a0eFdA3E1558cCD "0x03CB274ee2A0A4D12d672c6E306C08a6d5dAc20e" "0xd5e71aEa9bf2B44363Da88caBc2F50F4f13169B4"

5. MultiSigWallet: (Currently Not Working)
Deploy and Verify command: 
npm run deployMultiSig

Separately Verify
npx hardhat verify --show-stack-traces --constructor-args verifyMultiSigArguments.js --network bscTestnet --contract contracts/multisig/MultiSigWallet.sol:MultiSigWallet 0x9Cf96430B000D75672aa1F6f3f6281f2009c1487 
