// SPDX-License-Identifier: MIT
pragma solidity 0.8.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract MigFinance is ERC20, Ownable, Pausable {
    uint256 public constant PERCENTAGE_DECIMAL = 10000;
    uint256 public constant ONE_MONTH = 2678400; //31 * 24 * 60 * 60;

    uint256 public initialBurnRate = 100; //1%;
    uint256 public afterFirstMonthBurnRate = 50; //0.5%;
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

    function setBurnRate(uint256 _burnRate, uint256 _step) external onlyOwner {
        require(_burnRate <= 10000, "setBurnRate: INVALID_BURN_RATE");
        require(_step <= 2, "setBurnRate: INVALID_BURN_STEP");

        if (_step == 1 && block.timestamp < start + ONE_MONTH) {
            initialBurnRate = _burnRate;
        } else if (_step == 2) {
            afterFirstMonthBurnRate = _burnRate;
        }

        emit BurnRateUpdate(_burnRate, _step);
    }

    function pause() external onlyOwner {
        _pause();
    }

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
        uint256 _amount = _deduct(_msgSender(), amount);

        _transfer(_msgSender(), recipient, _amount);
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
        uint256 _amount = _deduct(sender, amount);
        _transfer(sender, recipient, _amount);

        uint256 currentAllowance = allowance(sender, _msgSender());
        require(
            currentAllowance >= amount,
            "ERC20: transfer amount exceeds allowance"
        );
        _approve(sender, _msgSender(), currentAllowance - amount);

        return true;
    }

    function getBurnPercentage() public view returns (uint256) {
        if (block.timestamp < start + ONE_MONTH) {
            return initialBurnRate;
        } else return afterFirstMonthBurnRate;
    }

    function _deduct(address sender, uint256 amount)
        internal
        returns (uint256)
    {
        uint256 toBurn = (amount * getBurnPercentage()) / PERCENTAGE_DECIMAL;
        _burn(sender, toBurn);
        return (amount - toBurn);
    }
}
