// SPDX-License-Identifier: MIT

pragma solidity 0.8.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockStakeToken is ERC20 {
    uint256 initialSupply = 1000000;
    constructor(string memory name, string memory symbol) ERC20( name, symbol ) {
        _mint(msg.sender, initialSupply * 10**18);
    }
}
