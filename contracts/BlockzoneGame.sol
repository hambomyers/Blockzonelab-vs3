// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./QUARTERSToken.sol";
import "./STARDUSTToken.sol";

contract BlockzoneGame {
    QUARTERSToken public quarters;
    STARDUSTToken public stardust;

    constructor(address _quartersAddress, address _stardustAddress) {
        quarters = QUARTERSToken(_quartersAddress);
        stardust = STARDUSTToken(_stardustAddress);
    }

    function playGame(address player) public {
        // Game logic here
    }
}
