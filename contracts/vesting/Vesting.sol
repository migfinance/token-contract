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

    /// @notice last drawn down time (seconds) per beneficiary
    mapping(address => uint256) public lastDrawnAt;

    /// @notice ERC20 token we are vesting
    IERC20 public token;
    
     /// @notice start of vesting period as a timestamp
    //uint256 public constant FEE_DECIMAL= 10000;

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
        vestedAmount[
            0xB32A83EEC46B116C53a957Cb07318310c390125F
        ] = 1000000000000000000000000;
        vestedAmount[
            0x03AeD197207C114a457361CA29e8FC059e66d850
        ] = 1000000000000000000000000;
        vestedAmount[
            0x145EF7025A9198954c87476537e0D574AD8290F7
        ] = 300000000000000000000000;
        vestedAmount[
            0xdC2CB83423Be01344a39Da294370D5c0B8E6F626
        ] = 300000000000000000000000;
        vestedAmount[
            0xaD8A9A4Fb7e93298A1662e018961716E761407E9
        ] = 200000000000000000000000;
        vestedAmount[
            0xb2abe10DAE11a6B46C9A77864961483a526FA02D
        ] = 200000000000000000000000;
        vestedAmount[
            0xE813Ff71e61E1a22976e6Ed56b021dF796A6c07E
        ] = 500000000000000000000000;
        vestedAmount[
            0x0b4d53152f882A219615F148e4C353390072D715
        ] = 2000000000000000000000000;
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
    ) external override onlyOwner returns (bool) {
        require(
            _beneficiaries.length > 0,
            "VestingContract::createVestingSchedules: Empty Data"
        );
        require(
            _beneficiaries.length == _amounts.length,
            "VestingContract::createVestingSchedules: Array lengths do not match"
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
     * @return _lastDrawnAt
     * @return _remainingBalance
     */
    function vestingScheduleForBeneficiary(address _beneficiary)
        external
        override
        view
        returns (
            uint256 _amount,
            uint256 _totalDrawn,
            uint256 _lastDrawnAt,
            uint256 _remainingBalance
        )
    {
        return (
            vestedAmount[_beneficiary],
            totalDrawn[_beneficiary],
            lastDrawnAt[_beneficiary],
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
        override
        view
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
        override
        view
        returns (uint256)
    {
        return vestedAmount[_beneficiary] - (totalDrawn[_beneficiary]);
    }

    // Internal

    function _createVestingSchedule(address _beneficiary, uint256 _amount)
        internal
        returns (bool)
    {
        require(
            _beneficiary != address(0),
            "VestingContract::createVestingSchedule: Beneficiary cannot be empty"
        );
        require(
            _amount > 0,
            "VestingContract::createVestingSchedule: Amount cannot be empty"
        );

        // Ensure one per address
        require(
            vestedAmount[_beneficiary] == 0,
            "VestingContract::createVestingSchedule: Schedule already in flight"
        );
        //uint256 burnPercent = token.getBurnPercentage();
        //uint256 fees = (_amount * burnPercent) / FEE_DECIMAL;
        //uint256 transferAmount = _amount + fees;   
        uint256 initialBalance = token.balanceOf(address(this));        

        // Vest the tokens into the deposit account and delegate to the beneficiary
        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "VestingContract::createVestingSchedule: Unable to escrow tokens"
        );

        uint256 finalBalance = token.balanceOf(address(this));
        vestedAmount[_beneficiary] = finalBalance - initialBalance;

        emit ScheduleCreated(_beneficiary);

        return true;
    }

    function _drawDown(address _beneficiary) internal returns (bool) {
        require(
            vestedAmount[_beneficiary] > 0,
            "VestingContract::_drawDown: There is no schedule currently in flight"
        );

        uint256 amount = _availableDrawDownAmount(_beneficiary);
        require(
            amount > 0,
            "VestingContract::_drawDown: No allowance left to withdraw"
        );

        // Update last drawn to now
        lastDrawnAt[_beneficiary] = _getNow();

        // Increase total drawn amount
        totalDrawn[_beneficiary] = totalDrawn[_beneficiary] + (amount);

        // Safety measure - this should never trigger
        require(
            totalDrawn[_beneficiary] <= vestedAmount[_beneficiary],
            "VestingContract::_drawDown: Safety Mechanism - Drawn exceeded Amount Vested"
        );

        // Issue tokens to beneficiary
        require(
            token.transfer(_beneficiary, amount),
            "VestingContract::_drawDown: Unable to transfer tokens"
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
        // Cliff Period

        if (_getNow() <= end) {
            // the cliff period has not ended, no tokens to draw down
            return 0;
        } else{

            return vestedAmount[_beneficiary] - (totalDrawn[_beneficiary]);
        }

    }
}
