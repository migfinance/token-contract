// SPDX-License-Identifier: MIT

pragma solidity 0.8.5;

interface ILinearVesting {
    /// @notice event emitted when a vesting schedule is created
    event ScheduleCreated(address indexed _beneficiary);

    /// @notice event emitted when a successful drawn down of vesting tokens is made
    event DrawDown(address indexed _beneficiary, uint256 indexed _amount);

    function createVestingSchedules(
        address[] calldata _beneficiaries,
        uint256[] calldata _amounts
    ) external returns (bool);

    /**
     * @notice Create a new vesting schedule
     * @notice A transfer is used to bring tokens into the VestingDepositAccount so pre-approval is required
     * @param _beneficiary beneficiary of the vested tokens
     * @param _amount amount of tokens (in wei)
     */
    function createVestingSchedule(address _beneficiary, uint256 _amount)
        external
        returns (bool);

    /**
     * @notice Vested token balance for a beneficiary
     * @dev Must be called directly by the beneficiary assigned the tokens in the schedule
     * @return _tokenBalance total balance proxied via the ERC20 token
     */
    function tokenBalance() external view returns (uint256);

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
        returns (
            uint256 _amount,
            uint256 _totalDrawn,
            uint256 _remainingBalance
        );

    /**
     * @notice Draw down amount currently available (based on the block timestamp)
     * @param _beneficiary beneficiary of the vested tokens
     * @return _amount tokens due from vesting schedule
     */
    function availableDrawDownAmount(address _beneficiary)
        external
        view
        returns (uint256 _amount);

    /**
     * @notice Balance remaining in vesting schedule
     * @param _beneficiary beneficiary of the vested tokens
     * @return _remainingBalance tokens still due (and currently locked) from vesting schedule
     */
    function remainingBalance(address _beneficiary)
        external
        view
        returns (uint256);
}
