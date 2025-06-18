// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./QUARTERSToken.sol";

contract BlockzoneGame {
    QUARTERSToken public quarters;

    constructor(address _quartersAddress) {
        quarters = QUARTERSToken(_quartersAddress);
    }

    function playGame(address player) public {
        // Game logic here
    }
}
