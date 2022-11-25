const circomlibjs = require("circomlibjs");
const crypto = require("crypto");
const { wasm_tester } = require("circom_tester")
const { utils } = require("ffjavascript");
const snarkjs = require("snarkjs");
const path = require("path");

const genCallData = async (proof, publicSignals) => {
    var callData = (
        await snarkjs.groth16.exportSolidityCallData(proof, publicSignals)
    )
        .toString()
        .split(",")
        .map((e) => {
            return e.replaceAll(/([\[\]\s\"])/g, "");
        });
    let a,
        b = [],
        c,
        publicInputs;
    a = callData.slice(0, 2).map((e) => BigInt(e));
    b[0] = callData.slice(2, 4).map((e) => BigInt(e));
    b[1] = callData.slice(4, 6).map((e) => BigInt(e));
    c = callData.slice(6, 8).map((e) => BigInt(e));
    publicInputs = callData.slice(8, callData.length).map((e) => BigInt(e));
    return { a, b, c, publicInputs };
}

class proposal {
    constructor() {

    }
    async generateKeyPair() {
        this.babyJub = await circomlibjs.buildBabyjub();
        this.prvKey = BigInt(`0x${crypto.randomBytes(31).toString('hex')}`);
        this.pubKey = this.babyJub.mulPointEscalar(this.babyJub.Base8, this.prvKey);
        return { prvKey: this.prvKey, pubKey: this.pubKey };
    }

    findTotalVote(maxVote, totalGamma, totalBeta) {
        totalGamma = this.babyJub.mulPointEscalar(totalGamma, this.prvKey);
        const F = this.babyJub.F;
        let mul = [F.e("0"), F.e("1")];

        for (var i = 0; i <= maxVote; i++) {
            if (JSON.stringify(this.babyJub.addPoint(mul, totalGamma)) === JSON.stringify(totalBeta)) {
                return i;
            }
            mul = this.babyJub.addPoint(mul, this.babyJub.Base8);

        }
    }

    vote(x) {
        var r = Math.floor(Math.random() * 1000);
        var M = this.babyJub.mulPointEscalar(this.babyJub.Base8, x);
        var gamma = this.babyJub.mulPointEscalar(this.babyJub.Base8, r);
        var beta = this.babyJub.mulPointEscalar(this.pubKey, r);
        beta = this.babyJub.addPoint(beta, M);
        return { gamma, beta };
    }

    async genProofTotalVote(totalGammaYes, totalBetaYes, totalVoteYes, totalGammaNo, totalBetaNo, totalVoteNo) {
        const input = {
            totalGammaYes,
            totalBetaYes,
            totalVoteYes,
            totalGammaNo,
            totalBetaNo,
            totalVoteNo,
            prvKey: this.prvKey
        }
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            path.join("checkTotalVote_js", "checkTotalVote.wasm"),
            path.join("circuit_final.zkey")
            // path.resolve("./update_js/update.wasm"),
            // path.resolve("./update_final.zkey")
        );
        const { a, b, c, publicInputs } = await genCallData(proof, publicSignals);
        return { a, b, c, totalVoteYes, totalVoteNo };
    }

}

module.exports = proposal;