// SPDX-License-Identifier: MIT
pragma solidity 0.8.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract MigFinance is ERC20, Ownable, Pausable {
    uint256 public constant PERCENTAGE_DECIMAL = 10000;
    uint256 public constant ONE_MONTH = 2678400; //31 * 24 * 60 * 60;

    uint256 public initialBurnRate = 100; //1%;
    uint256 public afterFirstMonthBurnRate = 50; //0.5%;   15000
    uint256 public initialSupply = 1000000;

    uint256 public start;

    event BurnRateUpdate(uint256 burnRate, uint256 step);

    /**
     * @dev Sets the values for {name} and {symbol}, initializes {decimals} with
     * a default value of 18.
     *
     * To select a different value for {decimals}, use {_setupDecimals}.
     *
     * All three of these values are immutable: they can only be set once during
     * construction.
     */
    constructor(string memory _name, string memory _symbol)
        ERC20(_name, _symbol)
    {
        _mint(_msgSender(), initialSupply * 10**(decimals()));
        start = block.timestamp;
    }

    /**
     * @dev Sets burn rate of token.
     * @param _burnRate new burn rate to set
     * @param _step specifies time period to set burn rate. Can be 1 or 2
     *
     * Requirements:
     *
     * - `_burnRate` should be less than 10000.
     * - `_step` should be less than 2.
     */
    function setBurnRate(uint256 _burnRate, uint256 _step) external onlyOwner {
        require(
            _burnRate <= 10000,
            "MigFinance:setBurnRate:: INVALID_BURN_RATE"
        );
        require(_step <= 2, "MigFinance:setBurnRate:: INVALID_BURN_STEP");

        if (_step == 1 && block.timestamp < start + ONE_MONTH) {
            initialBurnRate = _burnRate;
        } else if (_step == 2) {
            afterFirstMonthBurnRate = _burnRate;
        }

        emit BurnRateUpdate(_burnRate, _step);
    }

    /**
     * @dev pauses contract.
     *
     * Requirements:
     *
     * - `onlyOwner` should be true.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev unpauses contract.
     *
     * Requirements:
     *
     * - `onlyOwner` should be true.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `recipient` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     * overrided hence cannot be external
     */
    function transfer(address recipient, uint256 amount)
        public
        override
        whenNotPaused
        returns (bool)
    {
        uint256 toBurn = _toBurn(amount);

        _transfer(_msgSender(), recipient, amount - toBurn);
        _burn(_msgSender(), toBurn);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * Requirements:
     *
     * - `sender` and `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     * - the caller must have allowance for ``sender``'s tokens of at least
     * `amount`.
     * overrided hence cannot be external
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override whenNotPaused returns (bool) {
        uint256 toBurn = _toBurn(amount);

        uint256 currentAllowance = allowance(sender, _msgSender());
        require(
            currentAllowance >= amount,
            "MigFinance:transferFrom:: TRANSFER AMOUNT EXCEEDS ALLOWANCE"
        );
        _approve(sender, _msgSender(), currentAllowance - amount);

        _transfer(sender, recipient, amount - toBurn);
        _burn(sender, toBurn);
        return true;
    }

    /**
     * @dev Returns burn percentage.
     */
    function getBurnPercentage() public view returns (uint256) {
        if (block.timestamp < start + ONE_MONTH) {
            return initialBurnRate;
        } else return afterFirstMonthBurnRate;
    }

    /**
     * @dev Returns amount to transfer after burning fees.
     * @param amount amount of tokens to transfer
     */
    function _toBurn(uint256 amount) internal view returns (uint256 toBurn) {
        toBurn = (amount * getBurnPercentage()) / PERCENTAGE_DECIMAL;
    }
}
