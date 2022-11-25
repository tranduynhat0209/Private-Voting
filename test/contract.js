const { ethers } = require("hardhat");
const { expect } = require("chai");
const proposal = require("../scripts/proposal");
const { utils } = require("ffjavascript");
describe("contract", () => {
    it("vote and counting", async () => {
        const [deployer] = await ethers.getSigners();
        const babyJubJubFactory = await ethers.getContractFactory("CurveBabyJubJub");
        const verifierFactory = await ethers.getContractFactory("Verifier");
        const proposalFactory = await ethers.getContractFactory("Proposal");
        const verifierContract = await verifierFactory.deploy();
        const baybyJubJubContract = await babyJubJubFactory.deploy();
        const proposalContract = await proposalFactory.deploy(verifierContract.address, baybyJubJubContract.address);

        const pr = new proposal();
        await pr.generateKeyPair();
        await proposalContract.generateProposal();
        const voteYes = pr.vote(100);
        const voteNo = pr.vote(200);
        await proposalContract.vote(1, {
            gammaYes: utils.stringifyFElements(pr.babyJub.F, voteYes.gamma),
            betaYes: utils.stringifyFElements(pr.babyJub.F, voteYes.beta),
            gammaNo: utils.stringifyFElements(pr.babyJub.F, voteNo.gamma),
            betaNo: utils.stringifyFElements(pr.babyJub.F, voteNo.beta)
        });

        const { a, b, c, totalVoteYes, totalVoteNo } = await pr.genProofTotalVote(
            utils.stringifyFElements(pr.babyJub.F, voteYes.gamma),
            utils.stringifyFElements(pr.babyJub.F, voteYes.beta),
            100,
            utils.stringifyFElements(pr.babyJub.F, voteNo.gamma),
            utils.stringifyFElements(pr.babyJub.F, voteNo.beta),
            200
        )
        await proposalContract.calTotalVote(1, a, b, c, [totalVoteYes, totalVoteNo]);

        console.log(await proposalContract.totalVoteYesOfProposal(1));
        console.log(await proposalContract.totalVoteNoOfProposal(1));
    })
})