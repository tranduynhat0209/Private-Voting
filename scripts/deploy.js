const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const zeroAddress = '0x' + '0'.repeat(40);
    const registerAddress = '0xDF69B1DdF58a063FD6573065c106589E1Ca3984B'
    // account address
    console.log("DEPLOYER: " + deployer.address);

    const verifierFactory = await ethers.getContractFactory("Verifier");
    const tokenFactory = await ethers.getContractFactory("Token");
    const votingFactory = await ethers.getContractFactory("Voting");
    const verifierContract = await verifierFactory.deploy();
    const tokenContract = await tokenFactory.deploy(deployer.address);
    const votingContract = await votingFactory.deploy(verifierContract.address, tokenContract.address, registerAddress);
    console.log("token contract: " + tokenContract.address)
    console.log("voting contract: " + votingContract.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });