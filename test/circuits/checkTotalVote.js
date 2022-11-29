// import poll from "../../scripts/poll";
// import { utils } from "ffjavascript";
// import path from "path";
// import wasm_tester from "circom_tester/wasm/tester";
const { expect } = require("chai");

const { utils } = require("ffjavascript");
const path = require("path");
const wasm_tester = require("circom_tester/wasm/tester");
const circomlibjs = require("circomlibjs");
const crypto = require("crypto");
class poll {
    async generateKeyPair() {
        this.babyJub = await circomlibjs.buildBabyjub();
        this.prvKey = BigInt(`0x${crypto.randomBytes(31).toString('hex')}`);
        this.pubKey = this.babyJub.mulPointEscalar(this.babyJub.Base8, this.prvKey);
        return { prvKey: this.prvKey, pubKey: this.pubKey };
    }

    vote(x) {
        const r = Math.floor(Math.random() * 1000);
        var M = this.babyJub.mulPointEscalar(this.babyJub.Base8, x);
        var gamma = this.babyJub.mulPointEscalar(this.babyJub.Base8, r);
        var delta = this.babyJub.mulPointEscalar(this.pubKey, r);
        delta = this.babyJub.addPoint(delta, M);
        return { gamma, delta };
    }
}

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