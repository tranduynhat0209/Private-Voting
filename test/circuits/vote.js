const { expect } = require("chai");
const poll = require("../../scripts/poll");
const { utils } = require("ffjavascript");
const path = require("path");
const wasm_tester = require("circom_tester/wasm/tester");


describe("vote circom", async () => {
    it("test", async () => {
        const pr = new poll();
        await pr.generateKeyPair();

        const x = 400;
        const yes = 100;
        const no = 200;

        const rYes = 1234;
        const rNo = 4567;

        ///// vote
        const circuit = await wasm_tester(path.join("circuits", "vote.circom"));

        const w = await circuit.calculateWitness(
            {
                Dx: utils.stringifyFElements(pr.babyJub.F, pr.pubKey[0]),
                Dy: utils.stringifyFElements(pr.babyJub.F, pr.pubKey[0]),
                x, yes, no, rYes, rNo
            }
        )

        circuit.checkConstraints(w);
    })
})