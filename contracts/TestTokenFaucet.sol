// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./QUARTERSToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * Test Token Faucet for Sonic Labs Testnet
 * Distributes free QUARTERS tokens for testing and development
 */
contract TestTokenFaucet is Ownable, ReentrancyGuard {
    QUARTERSToken public quarters;
    
    // Faucet configuration
    uint256 public constant FAUCET_AMOUNT = 100 * 10**18; // 100 QUARTERS per request
    uint256 public constant COOLDOWN_PERIOD = 1 hours; // 1 hour between requests
    
    // User tracking
    mapping(address => uint256) public lastRequestTime;
    mapping(address => uint256) public totalRequested;
    
    // Events
    event TokensRequested(address indexed user, uint256 amount, uint256 timestamp);
    event FaucetRefilled(uint256 amount, uint256 timestamp);
    
    constructor(address _quartersAddress) {
        quarters = QUARTERSToken(_quartersAddress);
    }
    
    /**
     * Request test tokens
     */
    function requestTokens() external nonReentrant {
        require(block.timestamp >= lastRequestTime[msg.sender] + COOLDOWN_PERIOD, "Cooldown period not elapsed");
        require(quarters.balanceOf(address(this)) >= FAUCET_AMOUNT, "Faucet is empty");
        
        // Update tracking
        lastRequestTime[msg.sender] = block.timestamp;
        totalRequested[msg.sender] += FAUCET_AMOUNT;
        
        // Transfer tokens
        require(quarters.transfer(msg.sender, FAUCET_AMOUNT), "Token transfer failed");
        
        emit TokensRequested(msg.sender, FAUCET_AMOUNT, block.timestamp);
    }
    
    /**
     * Check if user can request tokens
     */
    function canRequest(address user) external view returns (bool) {
        return block.timestamp >= lastRequestTime[user] + COOLDOWN_PERIOD && 
               quarters.balanceOf(address(this)) >= FAUCET_AMOUNT;
    }
    
    /**
     * Get time until next request is available
     */
    function timeUntilNextRequest(address user) external view returns (uint256) {
        uint256 nextRequestTime = lastRequestTime[user] + COOLDOWN_PERIOD;
        if (block.timestamp >= nextRequestTime) {
            return 0;
        }
        return nextRequestTime - block.timestamp;
    }
    
    /**
     * Refill faucet (owner only)
     */
    function refillFaucet(uint256 amount) external onlyOwner {
        require(quarters.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit FaucetRefilled(amount, block.timestamp);
    }
    
    /**
     * Emergency withdraw (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = quarters.balanceOf(address(this));
        require(quarters.transfer(owner(), balance), "Transfer failed");
    }
    
    /**
     * Get faucet status
     */
    function getFaucetStatus() external view returns (
        uint256 balance,
        uint256 faucetAmount,
        uint256 cooldownPeriod
    ) {
        return (
            quarters.balanceOf(address(this)),
            FAUCET_AMOUNT,
            COOLDOWN_PERIOD
        );
    }
} 