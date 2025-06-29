const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying BlockZone contracts to Sonic Labs Blaze Testnet...");
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
    console.log("💰 Account balance:", (await deployer.getBalance()).toString());
    
    // Deploy QUARTERS Token first
    console.log("\n🪙 Deploying QUARTERS Token...");
    const QUARTERSToken = await ethers.getContractFactory("QUARTERSToken");
    const quarters = await QUARTERSToken.deploy();
    await quarters.waitForDeployment();
    console.log("✅ QUARTERS Token deployed to:", await quarters.getAddress());
    
    // Deploy Test Token Faucet
    console.log("\n🚰 Deploying Test Token Faucet...");
    const TestTokenFaucet = await ethers.getContractFactory("TestTokenFaucet");
    const faucet = await TestTokenFaucet.deploy(await quarters.getAddress());
    await faucet.waitForDeployment();
    console.log("✅ Test Token Faucet deployed to:", await faucet.getAddress());
    
    // Deploy BlockZone Game contract
    console.log("\n🎮 Deploying BlockZone Game contract...");
    const BlockzoneGame = await ethers.getContractFactory("BlockzoneGame");
    const game = await BlockzoneGame.deploy(await quarters.getAddress());
    await game.waitForDeployment();
    console.log("✅ BlockZone Game deployed to:", await game.getAddress());
    
    // Setup initial configuration
    console.log("\n⚙️ Setting up initial configuration...");
    
    // Add game contract as authorized minter for QUARTERS
    const addMinterTx = await quarters.addAuthorizedMinter(await game.getAddress());
    await addMinterTx.wait();
    console.log("✅ Game contract authorized to mint QUARTERS");
    
    // Transfer ownership of QUARTERS to game contract for tournament management
    const transferOwnershipTx = await quarters.transferOwnership(await game.getAddress());
    await transferOwnershipTx.wait();
    console.log("✅ QUARTERS ownership transferred to game contract");
    
    // Mint initial test tokens for deployer
    const testAmount = ethers.parseEther("1000"); // 1000 QUARTERS for testing
    const mintTx = await quarters.mintFromPayment(deployer.address, 250); // 250 USD worth = 1000 QUARTERS
    await mintTx.wait();
    console.log("✅ Minted 1000 QUARTERS for testing");
    
    // Fund the faucet with tokens
    const faucetFundTx = await quarters.transfer(await faucet.getAddress(), ethers.parseEther("10000")); // 10,000 QUARTERS for faucet
    await faucetFundTx.wait();
    console.log("✅ Funded faucet with 10,000 QUARTERS");
    
    // Deploy configuration
    const deploymentConfig = {
        network: "Sonic Labs Blaze Testnet",
        chainId: "11155420",
        contracts: {
            QUARTERS: await quarters.getAddress(),
            BLOCKZONE_GAME: await game.getAddress(),
            TEST_TOKEN_FAUCET: await faucet.getAddress()
        },
        deployer: deployer.address,
        timestamp: new Date().toISOString()
    };
    
    console.log("\n📋 Deployment Summary:");
    console.log(JSON.stringify(deploymentConfig, null, 2));
    
    // Save deployment info
    const fs = require('fs');
    fs.writeFileSync(
        'deployment-blaze.json', 
        JSON.stringify(deploymentConfig, null, 2)
    );
    console.log("\n💾 Deployment info saved to deployment-blaze.json");
    
    console.log("\n🎉 Deployment complete! Ready for Sonic Labs Blaze testnet integration.");
    console.log("\n🔗 Next steps:");
    console.log("1. Update contract addresses in rabby-integration.js");
    console.log("2. Test wallet connection and token faucet");
    console.log("3. Test tournament system with real tokens");
    console.log("4. Join Sonic Labs builders group for support");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 