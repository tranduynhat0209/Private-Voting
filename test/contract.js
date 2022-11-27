const { ethers } = require("hardhat");
const { expect } = require("chai");
const poll = require("../scripts/poll");
const { utils } = require("ffjavascript");
describe("interract with contract", () => {
    it("test", async () => {
        const [deployer, user] = await ethers.getSigners();
        const babyJubJubFactory = await ethers.getContractFactory("CurveBabyJubJub");
        const calculatorFactory = await ethers.getContractFactory("contracts/Calculator.sol:Verifier");
        const voteFactory = await ethers.getContractFactory("contracts/Vote.sol:Verifier");
        const pollFactory = await ethers.getContractFactory("Poll");
        const babyJubJubContract = await babyJubJubFactory.deploy();
        const calculatorContract = await calculatorFactory.deploy();
        const voteContract = await voteFactory.deploy();
        const pollContract = await pollFactory.deploy(voteContract.address, calculatorContract.address, babyJubJubContract.address);

        //// create poll
        const pr = new poll();
        await pr.generateKeyPair();
        await pollContract.createPoll(2, 0, utils.stringifyFElements(pr.babyJub.F, pr.pubKey), "abc");

        /// vote
        var { a, b, c, encryptedVoteYes, encryptedVoteNo } = await pr.genProofVote(100, 20, 30);
        await pollContract.votePoll(a, b, c, 1, encryptedVoteYes, encryptedVoteNo, 100);

        var { a, b, c, encryptedVoteYes, encryptedVoteNo } = await pr.genProofVote(100, 70, 30);
        await pollContract.connect(user).votePoll(a, b, c, 1, encryptedVoteYes, encryptedVoteNo, 100);

        //// close polll
        ethers.provider.waitForTransaction()
        const poll1 = await pollContract.getEncryptedVote(1);
        const totalVoteYes = pr.findTotalVote(200, poll1[0]);
        const totalVoteNo = pr.findTotalVote(200, poll1[1]);

        var { a, b, c } = await pr.genProofTotalVote(poll1[0], totalVoteYes, poll1[1], totalVoteNo);
        await pollContract.closePoll(a, b, c, 1, [totalVoteYes, totalVoteNo]);
    })
})