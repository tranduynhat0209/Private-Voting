// import { ethers } from "hardhat";
// import { expect } from "chai";
// import poll from "../scripts/poll";
// import utils from "ffjavascript";
const { expect } = require("chai");
const poll = require("../scripts/poll");
const { utils } = require("ffjavascript");
const { ethers } = require("hardhat");

describe("interract with contract", () => {
    it("test", async () => {
        const [deployer, user] = await ethers.getSigners();
        const babyJubJubFactory = await ethers.getContractFactory("CurveBabyJubJub");
        const calculatorFactory = await ethers.getContractFactory("contracts/proofs/Calculator.sol:Verifier");
        const voteFactory = await ethers.getContractFactory("contracts/proofs/Vote.sol:Verifier");
        const tokenFactory = await ethers.getContractFactory("Token");
        const pollFactory = await ethers.getContractFactory("Voting");
        const tokenContract = await tokenFactory.deploy(deployer.address);
        const babyJubJubContract = await babyJubJubFactory.deploy();
        const calculatorContract = await calculatorFactory.deploy();
        const voteContract = await voteFactory.deploy();
        const pollContract = await pollFactory.deploy(voteContract.address, calculatorContract.address, babyJubJubContract.address, tokenContract.address);
        //// create poll
        await tokenContract.delegate(deployer.address);
        await tokenContract.transfer(user.address, 100000);
        await tokenContract.connect(user).delegate(user.address);
        const pr = new poll(pollContract.address, tokenContract.address, deployer);

        const pruser = new poll(pollContract.address, tokenContract.address, user);
        const id = await pr.createPoll(123344, 0, 5000, "abc");
        await ethers.provider.send("evm_increaseTime", [1000]);
        await ethers.provider.send("evm_mine");
        await pr.votePoll(20, 30, id);
        await expect(pr.votePoll(20, 30, id)).to.be.revertedWith("Private-Voting::vote poll: voter already voted");
        await expect(pr.closePoll(123344, id)).to.be.revertedWith("Private-Voting::close poll: poll only can be closed if it is succeeded");
        await pruser.votePoll(50, 30, id);
        await ethers.provider.send("evm_increaseTime", [10000]);
        await ethers.provider.send("evm_mine");
        await pr.closePoll(123344, id);

    })
})