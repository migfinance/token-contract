// SPDX-License-Identifier: MIT

pragma solidity 0.8.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract MigFinance is ERC20, Ownable, Pausable {
    uint256 public constant PERCENTAGE_DECIMAL = 10000;

    uint256 public initialSupply = 1000000;
    uint64 public burnPercentage = 1;

    /**
     * @dev Sets the values for {name} and {symbol}, initializes {decimals} with
     * a default value of 18.
     *
     * To select a different value for {decimals}, use {_setupDecimals}.
     *
     * All three of these values are immutable: they can only be set once during
     * construction.
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint64 _burnPercentage
    ) ERC20(_name, _symbol) {
        _mint(_msgSender(), initialSupply * 10**(decimals()));
        burnPercentage = _burnPercentage;
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `recipient` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address recipient, uint256 amount)
        public
        override
        whenNotPaused
        returns (bool)
    {
        uint256 _amount = _deduct(_msgSender(), amount);
        return super.transfer(recipient, _amount);
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
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override whenNotPaused returns (bool) {
        uint256 _amount = _deduct(sender, amount);
        return super.transferFrom(sender, recipient, _amount);
    }

    function _deduct(address sender, uint256 amount)
        internal
        returns (uint256)
    {
        uint256 toBurn = (amount * burnPercentage) / PERCENTAGE_DECIMAL;
        _burn(sender, toBurn);
        return (amount - toBurn);
    }
}
