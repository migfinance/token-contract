// SPDX-License-Identifier: MIT

pragma solidity 0.8.5;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is Context, Ownable, ReentrancyGuard {
    address public stakeToken;
    address public rewardToken;
    // uint256 public SECONDS_IN_A_DAY = 28800;
    uint256 public constant SECONDS_IN_A_DAY = 1;
    uint256 public constant STAKING_DAYS_MIN = 7;
    uint256 public constant STAKING_DAYS_REWARD = 30;
    uint256 public constant STAKING_AMOUNT_MIN = 10000000000000000000; //10
    uint256 public constant VESTING_PERIOD = 60;
    uint256 public constant VESTING_AMOUNT = 100000000000000000000000; //100000
    uint256 public constant REWARD_PER_DAY = 5000000000000000000000; //5000

    uint256 vestingStart;
    uint256 totalStakingAmount;

    struct DepositInfo {
        uint256 amount;
        uint256 time;
        bool isLpToken;
    }

    mapping(address => DepositInfo[]) public userInfo;
    event Staked(address indexed sender, uint256 amount, bool isLpToken);

    constructor(address _stakeToken, address _rewardToken) {
        stakeToken = _stakeToken;
        rewardToken = _rewardToken;
        vestingStart = block.number;
    }

    function staking(uint256 amount, bool isLpToken) external {
        require(
            amount >= STAKING_AMOUNT_MIN,
            "Staking: Invalid Staking Amount"
        );
        if (isLpToken) {
            IERC20(rewardToken).transferFrom(msg.sender, address(this), amount);
        } else {
            IERC20(stakeToken).transferFrom(msg.sender, address(this), amount);
        }

        DepositInfo memory depositInfo;
        depositInfo.amount = amount;
        depositInfo.time = block.number;
        depositInfo.isLpToken = isLpToken;
        userInfo[msg.sender].push(depositInfo);

        totalStakingAmount = totalStakingAmount + (amount);

        emit Staked(msg.sender, amount, isLpToken);
    }

    function checkReward(uint256 id) public view returns (uint256) {
        require(id < userInfo[msg.sender].length, "Staking: Invalid Id");
        DepositInfo storage depositInfo = userInfo[msg.sender][id];
        require(
            depositInfo.time + STAKING_DAYS_MIN * SECONDS_IN_A_DAY <=
                block.number,
            "Staking: Can not unstaking yet"
        );

        uint256 reward;
        uint256 rewardFactor = 1;
        if (
            depositInfo.time + STAKING_DAYS_REWARD * SECONDS_IN_A_DAY <=
            block.number
        ) {
            rewardFactor = 2; //should be updated
        }

        if (depositInfo.isLpToken) {
            reward =
                ((depositInfo.amount *
                    (block.number - depositInfo.time) *
                    REWARD_PER_DAY *
                    75) / (100 * totalStakingAmount)) *
                rewardFactor;
        } else {
            reward =
                ((depositInfo.amount *
                    (block.number - depositInfo.time) *
                    REWARD_PER_DAY *
                    25) / (100 * totalStakingAmount)) *
                rewardFactor;
        }

        return reward;
    }

    function depositCount() public view returns (uint256) {
        return userInfo[msg.sender].length;
    }

    function unstaking(uint256 id, bool isLpToken) external {
        uint256 reward = checkReward(id);
        if (isLpToken) {
            IERC20(rewardToken).transfer(
                msg.sender,
                userInfo[msg.sender][id].amount + reward
            );
        } else {
            IERC20(stakeToken).transfer(
                msg.sender,
                userInfo[msg.sender][id].amount + reward
            );
        }
        totalStakingAmount =
            totalStakingAmount -
            (userInfo[msg.sender][id].amount);
        userInfo[msg.sender][id] = userInfo[msg.sender][
            userInfo[msg.sender].length - 1
        ];
        delete userInfo[msg.sender][userInfo[msg.sender].length - 1];
        userInfo[msg.sender].pop();
    }

    function withdrawToken(uint256 amount, bool isLpToken) external onlyOwner {
        if (isLpToken) {
            IERC20(rewardToken).transfer(msg.sender, amount);
        } else {
            IERC20(stakeToken).transfer(msg.sender, amount);
        }
    }

    function setTBIT(address _stakeToken) external onlyOwner {
        stakeToken = _stakeToken;
    }

    function setLPToken(address _rewardToken) external onlyOwner {
        rewardToken = _rewardToken;
    }

    function withdrawLiquidity(address to) external onlyOwner {
        require(
            vestingStart + VESTING_PERIOD * SECONDS_IN_A_DAY <= block.number,
            "Staking: Vesting is not available yet"
        );
        IERC20(stakeToken).transfer(to, VESTING_AMOUNT);
    }
}
