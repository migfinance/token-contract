// SPDX-License-Identifier: MIT

pragma solidity 0.8.5;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is Context, Ownable, ReentrancyGuard {
    address public stakeToken;
    address public rewardToken;
    uint256 public totalStakedAmount;

    //2 years + 1 leap year => 24 * 60 * 60 * (3 * 365 + 1)
    uint256 public constant STAKING_PERIOD = 94694400;

    struct DepositInfo {
        uint256 amount;
        uint256 startTime;
        uint256 amountWithdrawn;
    }

    mapping(address => DepositInfo[]) public userInfo;
    event Staked(address indexed sender, uint256 amount, uint256 stakeId);

    modifier validateID(uint256 id) {
        require(
            id < userInfo[msg.sender].length,
            "Staking:checkReward:: ERR_INVALID_ID"
        );
        _;
    }

    constructor(address _stakeToken, address _rewardToken) {
        require(
            _stakeToken != address(0),
            "Staking:constructor:: ERR_ZERO_ADDRESS_STAKE_TOKEN"
        );
        require(
            _rewardToken != address(0),
            "Staking:constructor:: ERR_ZERO_ADDRESS_REWARD_TOKEN"
        );

        stakeToken = _stakeToken;
        rewardToken = _rewardToken;
    }

    function stake(uint256 amount) external {
        require(amount != 0, "Staking:stake:: ERR_STAKE_AMOUNT");

        DepositInfo memory depositInfo;
        depositInfo.amount = amount;
        depositInfo.startTime = block.timestamp;
        userInfo[msg.sender].push(depositInfo);

        uint256 stakeId = userInfo[msg.sender].length - 1;
        totalStakedAmount = totalStakedAmount + amount;

        IERC20(stakeToken).transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount, stakeId);
    }

    function checkReward(uint256 id) public view returns (uint256 reward) {
        if (id >= userInfo[msg.sender].length) return 0;

        DepositInfo storage depositInfo = userInfo[msg.sender][id];

        //reward = (currentTime/totalTime) * totalAmountStaked - amountWithdrawn
        uint256 timePassed = block.timestamp - depositInfo.startTime >
            STAKING_PERIOD
            ? STAKING_PERIOD
            : block.timestamp - depositInfo.startTime;

        uint256 canClaim = (depositInfo.amount * timePassed) / STAKING_PERIOD;
        reward = canClaim - depositInfo.amountWithdrawn;
    }

    function depositCount() external view returns (uint256) {
        return userInfo[msg.sender].length;
    }

    function claim(uint256 id) external validateID(id) {
        uint256 toClaim = checkReward(id);
        if (toClaim == 0) return;

        toClaim = _update(id, toClaim);
        totalStakedAmount = totalStakedAmount - toClaim;

        IERC20(rewardToken).transfer(msg.sender, toClaim);
        IERC20(stakeToken).transfer(msg.sender, toClaim);
    }

    function _update(uint256 id, uint256 toClaim)
        internal
        returns (uint256 claimAmount)
    {
        DepositInfo storage depositInfo = userInfo[msg.sender][id];

        claimAmount = toClaim;
        if (depositInfo.amount < depositInfo.amountWithdrawn + toClaim) {
            claimAmount = depositInfo.amount - depositInfo.amountWithdrawn;
        }

        depositInfo.amountWithdrawn += claimAmount;

        //remove user id if all tokens claimed
        if (depositInfo.amountWithdrawn == depositInfo.amount) {
            depositInfo = userInfo[msg.sender][userInfo[msg.sender].length - 1];
            delete userInfo[msg.sender][userInfo[msg.sender].length - 1];
            userInfo[msg.sender].pop();
        }
    }

    //In case tokens get stuck inside contract
    function withdrawToken(uint256 amount, address token) external onlyOwner {
        if (IERC20(token).balanceOf(address(this)) >= amount)
            IERC20(token).transfer(msg.sender, amount);
    }

    function setStakeToken(address _stakeToken) external onlyOwner {
        require(
            _stakeToken != address(0),
            "Staking:constructor:: ERR_ZERO_ADDRESS_STAKE_TOKEN"
        );
        stakeToken = _stakeToken;
    }

    function setRewardToken(address _rewardToken) external onlyOwner {
        require(
            _rewardToken != address(0),
            "Staking:constructor:: ERR_ZERO_ADDRESS_REWARD_TOKEN"
        );
        rewardToken = _rewardToken;
    }
}
