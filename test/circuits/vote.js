// import poll from "../../scripts/poll";
// import { utils } from "ffjavascript";
// import path from "path";
// import wasm_tester from "circom_tester/wasm/tester";

const { expect } = require("chai");
const { utils } = require("ffjavascript");
const path = require("path");
const wasm_tester = require("circom_tester/wasm/tester");



describe("vote circom", async () => {
    it("test", async () => {
        let x, r, g, h, D, kX, kR;

        x = BigInt(Math.floor(Math.random() * 10));
        r = BigInt(Math.floor(Math.random() * 10));
        g = BigInt(Math.floor(Math.random() * 10));
        h = BigInt(Math.floor(Math.random() * 10));
        D = BigInt(Math.floor(Math.random() * 10));
        kX = BigInt(Math.floor(Math.random() * 10));
        kR = BigInt(Math.floor(Math.random() * 10));

        ///// vote
        const circuit = await wasm_tester(path.join("circuits", "vote.circom"));

        const w = await circuit.calculateWitness(
            {
                x: x,
                r: r,
                g: g,
                h: h,
                D: D,
                kX: kX,
                kR: kR
            }
        )

        circuit.checkConstraints(w);
    })
})