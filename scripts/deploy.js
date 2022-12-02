const { ethers } = require("hardhat");

async function main() {
    const [deployer, user0, user1, user2] = await ethers.getSigners();
    const zeroAddress = '0x' + '0'.repeat(40);
    const testAddress = '0xa8C8d2E38407377bCF82d5AAe4783efaB87044f1'
    // account address
    console.log("DEPLOYER: " + deployer.address);
    console.log("user0:" + user0.address);
    console.log("user1:" + user1.address);
    console.log("user2:" + user2.address);
    // delploy token contract
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy(testAddress);
    console.log("Token: " + token.address);
    // deploy two proof contract
    const Calculator = await ethers.getContractFactory("contracts/proofs/Calculator.sol:Verifier");
    const calculator = await Calculator.deploy();
    console.log("calculator: " + calculator.address);
    const Vote = await ethers.getContractFactory("contracts/proofs/Vote.sol:Verifier");
    const vote = await Vote.deploy();
    console.log("vote: " + vote.address);
    //deploy baby jub contract
    const BabyJub = await ethers.getContractFactory("CurveBabyJubJub");
    const babyJub = await BabyJub.deploy();
    console.log("baby jub: " + babyJub.address);
    //deploy voting contract
    const Voting = await ethers.getContractFactory("Voting");
    const voting = await Voting.deploy(vote.address, calculator.address, babyJub.address, token.address);
    console.log("voting contract: " + voting.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });