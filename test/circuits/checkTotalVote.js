const { expect } = require("chai");
const proposal = require("../../scripts/proposal");
const { utils } = require("ffjavascript");
const path = require("path");
const wasm_tester = require("circom_tester/wasm/tester");


describe("proposal", async () => {
    it("checkTotalVote", async () => {
        const pr = new proposal();
        await pr.generateKeyPair();
        let F = pr.babyJub.F;

        const totalVoteYes = 100;
        const totalVoteNo = 200;
        const voteYes = pr.vote(totalVoteYes);
        const voteNo = pr.vote(totalVoteNo);

        ///// vote
        const circuit = await wasm_tester(path.join("test", "circuits", "checkTotalVote.circom"));

        const w = await circuit.calculateWitness(
            {
                totalGammaYes: utils.stringifyFElements(pr.babyJub.F, voteYes.gamma),
                totalBetaYes: utils.stringifyFElements(pr.babyJub.F, voteYes.beta),
                totalVoteYes,
                totalGammaNo: utils.stringifyFElements(pr.babyJub.F, voteNo.gamma),
                totalBetaNo: utils.stringifyFElements(pr.babyJub.F, voteNo.beta),
                totalVoteNo,
                prvKey: pr.prvKey
            }
        )

        circuit.checkConstraints(w);


    })
})