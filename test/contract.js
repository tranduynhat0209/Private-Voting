
const { expect } = require("chai");
const poll = require("../scripts/poll");
const { utils } = require("ffjavascript");
const { ethers } = require("hardhat");

describe("interract with contract", () => {
    it("test", async () => {
        const [deployer, user] = await ethers.getSigners();
        const tokenFactory = await ethers.getContractFactory("Token");
        const votingFactory = await ethers.getContractFactory("Voting");
        const tokenContract = await tokenFactory.deploy(deployer.address);
        const votingContract = await votingFactory.deploy(tokenContract.address);
        //// create poll
        await tokenContract.delegate(deployer.address);
        await tokenContract.transfer(user.address, 100000);
        await tokenContract.connect(user).delegate(user.address);
        const pr = new poll(votingContract.address, tokenContract.address, deployer);


        const id = await pr.createPoll(12345, 0, 10000, "abc");
        const vote = 123;
        await pr.votePoll(id, vote);
        await pr.votePoll(id, vote * 2);
        await pr.closePoll(12345, id);
        expect((await pr.contract.polls(id)).numberVote).equal(vote * 3);
        // await ethers.provider.send("evm_increaseTime", [1000]);
        // await ethers.provider.send("evm_mine");
        // await pr.votePoll(20, 30, id);
        // await expect(pr.votePoll(20, 30, id)).to.be.revertedWith("Private-Voting::vote poll: voter already voted");
        // await expect(pr.closePoll(123344, id)).to.be.revertedWith("Private-Voting::close poll: poll only can be closed if it is succeeded");
        // await pruser.votePoll(50, 30, id);
        // await ethers.provider.send("evm_increaseTime", [10000]);
        // await ethers.provider.send("evm_mine");
        // await pr.closePoll(123344, id);

    })
})