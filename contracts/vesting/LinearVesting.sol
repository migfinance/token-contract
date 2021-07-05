// SPDX-License-Identifier: MIT

pragma solidity 0.8.5;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ILinearVesting.sol";

contract LinearVesting is ReentrancyGuard, Ownable, ILinearVesting {
    /// @notice start of vesting period as a timestamp
    uint256 public start;

    /// @notice end of vesting period as a timestamp
    uint256 public end;

    /// @notice amount vested for a beneficiary. Note beneficiary address can not be reused
    mapping(address => uint256) public vestedAmount;

    /// @notice cumulative total of tokens drawn down (and transferred from the deposit account) per beneficiary
    mapping(address => uint256) public totalDrawn;

    /// @notice ERC20 token we are vesting
    IERC20 public token;

    /// @notice start of vesting period as a timestamp
    //uint256 public constant FEE_DECIMAL= 10000;

    modifier checkStartTime() {
        require(
            _getNow() >= start,
            "Staking:checkReward:: ERR_START_TIME_NOT_REACHED"
        );
        _;
    }

    /**
     * @notice Construct a new vesting contract
     */
    constructor(
        address _token,
        uint256 _startTime,
        uint256 _endTime
    ) {
        token = IERC20(_token);
        start = _startTime;
        end = _endTime;

        predefinedBeneficiaries();
    }

    function predefinedBeneficiaries() internal returns (bool) {
        //To be updated before deployment
        vestedAmount[
            0x0b4d53152f882A219615F148e4C353390072D715
        ] = 1000000000000000000000000;
        return true;
    }

    /**
     * @notice Create new vesting schedules in a batch
     * @notice A transfer is used to bring tokens into the VestingDepositAccount so pre-approval is required
     * @param _beneficiaries array of beneficiaries of the vested tokens
     * @param _amounts array of amount of tokens (in wei)
     * @dev array index of address should be the same as the array index of the amount
     */
    function createVestingSchedules(
        address[] calldata _beneficiaries,
        uint256[] calldata _amounts
    ) external override onlyOwner checkStartTime returns (bool) {
        require(
            _beneficiaries.length > 0,
            "VestingContract::createVestingSchedules: ERR_NO_BENEFICIARY"
        );
        require(
            _beneficiaries.length == _amounts.length,
            "VestingContract::createVestingSchedules: ERR_ARR_LENGTH"
        );

        bool result = true;

        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            address beneficiary = _beneficiaries[i];
            uint256 amount = _amounts[i];
            _createVestingSchedule(beneficiary, amount);
        }

        return result;
    }

    /**
     * @notice Create a new vesting schedule
     * @notice A transfer is used to bring tokens into the VestingDepositAccount so pre-approval is required
     * @param _beneficiary beneficiary of the vested tokens
     * @param _amount amount of tokens (in wei)
     */
    function createVestingSchedule(address _beneficiary, uint256 _amount)
        external
        override
        onlyOwner
        checkStartTime
        returns (bool)
    {
        return _createVestingSchedule(_beneficiary, _amount);
    }

    /**
     * @notice Draws down any vested tokens due
     * @dev Must be called directly by the beneficiary assigned the tokens in the schedule
     */
    function drawDown() external nonReentrant returns (bool) {
        return _drawDown(msg.sender);
    }

    // Accessors

    /**
     * @notice Vested token balance for a beneficiary
     * @dev Must be called directly by the beneficiary assigned the tokens in the schedule
     * @return _tokenBalance total balance proxied via the ERC20 token
     */
    function tokenBalance() external view override returns (uint256) {
        return token.balanceOf(address(this));
    }

    /**
     * @notice Vesting schedule and associated data for a beneficiary
     * @dev Must be called directly by the beneficiary assigned the tokens in the schedule
     * @return _amount
     * @return _totalDrawn
     * @return _remainingBalance
     */
    function vestingScheduleForBeneficiary(address _beneficiary)
        external
        view
        override
        returns (
            uint256 _amount,
            uint256 _totalDrawn,
            uint256 _remainingBalance
        )
    {
        return (
            vestedAmount[_beneficiary],
            totalDrawn[_beneficiary],
            vestedAmount[_beneficiary] - (totalDrawn[_beneficiary])
        );
    }

    /**
     * @notice Draw down amount currently available (based on the block timestamp)
     * @param _beneficiary beneficiary of the vested tokens
     * @return _amount tokens due from vesting schedule
     */
    function availableDrawDownAmount(address _beneficiary)
        external
        view
        override
        returns (uint256 _amount)
    {
        return _availableDrawDownAmount(_beneficiary);
    }

    /**
     * @notice Balance remaining in vesting schedule
     * @param _beneficiary beneficiary of the vested tokens
     * @return _remainingBalance tokens still due (and currently locked) from vesting schedule
     */
    function remainingBalance(address _beneficiary)
        external
        view
        override
        returns (uint256)
    {   
        if(vestedAmount[_beneficiary] >= (totalDrawn[_beneficiary]))
            return vestedAmount[_beneficiary] - (totalDrawn[_beneficiary]);
        else
            return 0;
    }

    // Internal

    function _createVestingSchedule(address _beneficiary, uint256 _amount)
        internal
        returns (bool)
    {
        require(
            _beneficiary != address(0),
            "VestingContract::createVestingSchedule: INVALID_BENEFICIARY_ADDRESS"
        );
        require(
            _amount > 0,
            "VestingContract::createVestingSchedule: ERR_ZERO_AMOUNT"
        );

        // Ensure one per address
        require(
            vestedAmount[_beneficiary] == 0,
            "VestingContract::createVestingSchedule: ERR_BENEFICIARY_ALREADY_ADDED"
        );

        uint256 initialBalance = token.balanceOf(address(this));

        // Vest the tokens into the deposit account and delegate to the beneficiary
        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "VestingContract::createVestingSchedule: ERR_TRANSFER_FROM"
        );

        uint256 finalBalance = token.balanceOf(address(this));
        vestedAmount[_beneficiary] = finalBalance - initialBalance;

        emit ScheduleCreated(_beneficiary);

        return true;
    }

    function _drawDown(address _beneficiary) internal returns (bool) {
        require(
            vestedAmount[_beneficiary] > 0,
            "VestingContract::_drawDown: ERR_NO_VEST_SCHEDULED"
        );

        uint256 amount = _availableDrawDownAmount(_beneficiary);

        require(
            amount > 0,
            "VestingContract::_drawDown: ERR_NO_AMOUNT_WITHDRAWABLE"
        );

        // Increase total drawn amount
        totalDrawn[_beneficiary] = totalDrawn[_beneficiary] + (amount);

        // Safety measure - this should never trigger
        require(
            totalDrawn[_beneficiary] <= vestedAmount[_beneficiary],
            "VestingContract::_drawDown: ERR_AMOUNT_ALREADY_REDEEMED"
        );

        // Issue tokens to beneficiary
        require(
            token.transfer(_beneficiary, amount),
            "VestingContract::_drawDown: ERR_TOKEN_TRANSFER"
        );
        vestedAmount[_beneficiary] -= amount;

        emit DrawDown(_beneficiary, amount);

        return true;
    }

    function _getNow() internal view returns (uint256) {
        return block.timestamp;
    }

    function _availableDrawDownAmount(address _beneficiary)
        internal
        view
        returns (uint256 _amount)
    {
        if (_getNow() <= end || ( vestedAmount[_beneficiary] < (totalDrawn[_beneficiary])) ) {
            // the cliff period has not ended, no tokens to draw down
            // or vested amount is less then total drawn amount
            return 0;
        } 
        else{
            return vestedAmount[_beneficiary] - (totalDrawn[_beneficiary]);
        }
    }
}
