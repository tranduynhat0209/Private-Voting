const snarkjs = require("snarkjs");
const { utils } = require("ffjavascript");
const fs = require("fs");

const circomlibjs = require("circomlibjs");
const { assert } = require("console");

async function Generator() {
    const d = 13082002;

    babyjub = await circomlibjs.buildBabyjub();
    console.log(babyjub.Base8);
    var D = babyjub.mulPointEscalar(babyjub.Base8, d);
    console.log(" d = ", d);
    console.log(" D = ", D);

    var x = 13000;
    var yes = 7000;
    var no = 5000;

    var ryes = 14022002;
    var rno = 14112002;

    console.log(utils.stringifyFElements(babyjub.F, D[0]));
    console.log(utils.stringifyFElements(babyjub.F, D[1]));

    var { proof, publicSignals } = await snarkjs.groth16.fullProve({
        Dx: utils.stringifyFElements(babyjub.F, D[0]),
        Dy: utils.stringifyFElements(babyjub.F, D[1]),
        x: x,
        yes: yes,
        no: no,
        rYes: ryes,
        rNo: rno
    },
        "./verify.wasm",
        "./circuit_final.zkey"
    );
    console.log(publicSignals);
    const vKey = JSON.parse(fs.readFileSync("./verification_key.json"));

    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    if (res === true) {
        console.log("Verification OK");
    } else {
        console.log("Invalid proof");
    }

    // Check Circuit compute

    var Myes = babyjub.mulPointEscalar(babyjub.Base8, yes);
    var GammaYes = babyjub.mulPointEscalar(babyjub.Base8, ryes);

    console.log(" GammaYesX =", utils.stringifyFElements(babyjub.F, GammaYes[0]));
    console.log(" GammaYesY =", utils.stringifyFElements(babyjub.F, GammaYes[1]));
    var assert = require('assert');
    //assert.equal(utils.stringifyFElements(babyjub.F, GammaYes[0]), publicSignals[0]);


}

Generator();