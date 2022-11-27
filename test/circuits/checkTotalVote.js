const { expect } = require("chai");
const poll = require("../../scripts/poll");
const { utils } = require("ffjavascript");
const path = require("path");
const wasm_tester = require("circom_tester/wasm/tester");


describe("checkTotalVote circom", async () => {
    it("test", async () => {
        const pr = new poll();
        await pr.generateKeyPair();
        let F = pr.babyJub.F;

        const totalVoteYes = 100;
        const totalVoteNo = 200;
        const voteYes = pr.vote(totalVoteYes);
        const voteNo = pr.vote(totalVoteNo);

        ///// vote
        const circuit = await wasm_tester(path.join("circuits", "checkTotalVote.circom"));

        const w = await circuit.calculateWitness(
            {
                totalGammaYes: utils.stringifyFElements(pr.babyJub.F, voteYes.gamma),
                totalDeltaYes: utils.stringifyFElements(pr.babyJub.F, voteYes.delta),
                totalVoteYes,
                totalGammaNo: utils.stringifyFElements(pr.babyJub.F, voteNo.gamma),
                totalDeltaNo: utils.stringifyFElements(pr.babyJub.F, voteNo.delta),
                totalVoteNo,
                prvKey: pr.prvKey
            }
        )

        circuit.checkConstraints(w);


    })
})