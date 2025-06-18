// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * QUARTERS Token - BlockZone Gaming Currency
 * ERC-20 token for in-game purchases and tournament entry fees
 * Integrated with Apple Pay and traditional payment systems
 */
contract QUARTERSToken is ERC20, Ownable, Pausable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion QUARTERS
    uint256 public constant QUARTERS_PER_USD = 4; // 1 USD = 4 QUARTERS (25 cents each)
    
    // Apple Pay integration
    mapping(address => bool) public authorizedMinters;
    mapping(string => bool) public processedApplePayTransactions;
    
    // Events
    event ApplePayPurchase(address indexed user, uint256 amount, string transactionId);
    event QuartersPurchased(address indexed user, uint256 quarters, uint256 usdAmount);
    
    constructor() ERC20("QUARTERS", "QTR") {
        // Initial supply for liquidity and testing
        _mint(msg.sender, 10_000_000 * 10**18); // 10 million initial
    }
    
    /**
     * Mint QUARTERS from Apple Pay purchases
     */
    function mintFromApplePay(
        address recipient,
        uint256 usdAmount,
        string memory applePayTransactionId
    ) external onlyAuthorizedMinter whenNotPaused {
        require(!processedApplePayTransactions[applePayTransactionId], "Transaction already processed");
        require(usdAmount > 0, "Invalid USD amount");
        
        uint256 quartersAmount = usdAmount * QUARTERS_PER_USD * 10**18;
        require(totalSupply() + quartersAmount <= MAX_SUPPLY, "Would exceed max supply");
        
        processedApplePayTransactions[applePayTransactionId] = true;
        _mint(recipient, quartersAmount);
        
        emit ApplePayPurchase(recipient, quartersAmount, applePayTransactionId);
        emit QuartersPurchased(recipient, quartersAmount, usdAmount);
    }
    
    /**
     * Mint QUARTERS from other payment methods
     */
    function mintFromPayment(
        address recipient,
        uint256 usdAmount
    ) external onlyAuthorizedMinter whenNotPaused {
        require(usdAmount > 0, "Invalid USD amount");
        
        uint256 quartersAmount = usdAmount * QUARTERS_PER_USD * 10**18;
        require(totalSupply() + quartersAmount <= MAX_SUPPLY, "Would exceed max supply");
        
        _mint(recipient, quartersAmount);
        emit QuartersPurchased(recipient, quartersAmount, usdAmount);
    }
    
    /**
     * Burn QUARTERS (for tournament entry fees, etc.)
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    /**
     * Admin functions
     */
    function addAuthorizedMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
    }
    
    function removeAuthorizedMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _;
    }
}
