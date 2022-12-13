
const { expect } = require("chai");
const poll = require("../scripts/poll");
const { utils } = require("ffjavascript");
const { ethers } = require("hardhat");

describe("interract with contract", () => {
    it("test", async () => {
        const [deployer, user] = await ethers.getSigners();
        const verifierFactory = await ethers.getContractFactory("Verifier");
        const tokenFactory = await ethers.getContractFactory("Token");
        const votingFactory = await ethers.getContractFactory("Voting");
        const verifierContract = await verifierFactory.deploy();
        const tokenContract = await tokenFactory.deploy(deployer.address);
        const votingContract = await votingFactory.deploy(verifierContract.address, tokenContract.address);
        //// create poll
        await tokenContract.delegate(deployer.address);
        await tokenContract.transfer(user.address, 100000);
        await tokenContract.connect(user).delegate(user.address);
        const pr = new poll(votingContract.address, tokenContract.address, deployer);
        const puser = new poll(votingContract.address, tokenContract.address, user);

        const id = await pr.createPoll(12345, 0, 10000, "abc");
        const vote = 1234567;
        await pr.votePoll(id, vote, 1);
        await expect(pr.votePoll(id, vote, 1)).to.be.revertedWith("Private-Voting::vote poll: voter already voted");
        await puser.votePoll(id, vote * 2, 0);
        await ethers.provider.send("evm_increaseTime", [20000]);
        await ethers.provider.send("evm_mine");
        await expect(pr.votePoll(id, vote, 1)).to.be.revertedWith("Private-Voting::vote poll: poll is closed.");
        await pr.closePoll(12345, id);
        expect((await pr.contract.polls(id)).numberVote).equal(-vote);

    })
})