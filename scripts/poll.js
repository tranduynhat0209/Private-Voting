const circomlibjs = require("circomlibjs");
const crypto = require("crypto");
const snarkjs = require("snarkjs");
const path = require("path");
const { utils } = require("ffjavascript");

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

class poll {
    constructor() {

    }
    async generateKeyPair() {
        this.babyJub = await circomlibjs.buildBabyjub();
        this.prvKey = BigInt(`0x${crypto.randomBytes(31).toString('hex')}`);
        this.pubKey = this.babyJub.mulPointEscalar(this.babyJub.Base8, this.prvKey);
        return { prvKey: this.prvKey, pubKey: this.pubKey };
    }

    findTotalVote(maxVote, encryptedVote) {
        //console.log(encryptedVote)
        let totalGamma = [encryptedVote[0], encryptedVote[1]];
        let totalDelta = [encryptedVote[2], encryptedVote[3]];

        totalGamma = utils.stringifyFElements(this.babyJub.F, totalGamma);
        totalDelta = utils.stringifyFElements(this.babyJub.F, totalDelta);

        totalGamma = utils.unstringifyFElements(this.babyJub.F, totalGamma);
        totalDelta = utils.unstringifyFElements(this.babyJub.F, totalDelta);
        //console.log(totalGamma, totalDelta);
        totalGamma = this.babyJub.mulPointEscalar(totalGamma, this.prvKey);
        const F = this.babyJub.F;
        let mul = [F.e("0"), F.e("1")];

        for (var i = 0; i <= maxVote; i++) {
            if (JSON.stringify(this.babyJub.addPoint(mul, totalGamma)) === JSON.stringify(totalDelta)) {
                return i;
            }
            mul = this.babyJub.addPoint(mul, this.babyJub.Base8);
        }
    }

    vote(x) {
        const r = Math.floor(Math.random() * 1000);
        var M = this.babyJub.mulPointEscalar(this.babyJub.Base8, x);
        var gamma = this.babyJub.mulPointEscalar(this.babyJub.Base8, r);
        var delta = this.babyJub.mulPointEscalar(this.pubKey, r);
        delta = this.babyJub.addPoint(delta, M);
        return { gamma, delta };
    }
    async genProofVote(x, yes, no) {
        const rYes = BigInt(`0x${crypto.randomBytes(31).toString('hex')}`);
        const rNo = BigInt(`0x${crypto.randomBytes(31).toString('hex')}`);
        const input = {
            Dx: utils.stringifyFElements(this.babyJub.F, this.pubKey[0]),
            Dy: utils.stringifyFElements(this.babyJub.F, this.pubKey[1]),
            x, yes, no, rYes, rNo
        }
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            path.join("circuits", "vote.wasm"),
            path.join("circuits", "vote.zkey")
        );
        //console.log(publicSignals);
        const { a, b, c, publicInputs } = await genCallData(proof, publicSignals);
        //console.log(publicInputs)
        const encryptedVoteYes = publicInputs.filter((e, index) => index < 4);
        const encryptedVoteNo = publicInputs.filter((e, index) => 4 <= index && index < 8);
        return { a, b, c, encryptedVoteYes, encryptedVoteNo };
    }
    async genProofTotalVote(encryptedVoteYes, totalVoteYes, encryptedVoteNo, totalVoteNo) {


        let totalGammaYes = [encryptedVoteYes[0], encryptedVoteYes[1]];
        let totalDeltaYes = [encryptedVoteYes[2], encryptedVoteYes[3]];

        totalGammaYes = utils.stringifyFElements(this.babyJub.F, totalGammaYes);
        totalDeltaYes = utils.stringifyFElements(this.babyJub.F, totalDeltaYes);

        //////////////////////////////
        let totalGammaNo = [encryptedVoteNo[0], encryptedVoteNo[1]];
        let totalDeltaNo = [encryptedVoteNo[2], encryptedVoteNo[3]];

        totalGammaNo = utils.stringifyFElements(this.babyJub.F, totalGammaNo);
        totalDeltaNo = utils.stringifyFElements(this.babyJub.F, totalDeltaNo);


        const input = {
            totalGammaYes,
            totalDeltaYes,
            totalVoteYes,
            totalGammaNo,
            totalDeltaNo,
            totalVoteNo,
            prvKey: this.prvKey
        }
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            path.join("circuits", "checkTotalVote.wasm"),
            path.join("circuits", "checkTotalVote.zkey")
        );
        const { a, b, c, publicInputs } = await genCallData(proof, publicSignals);
        return { a, b, c };
    }

}

module.exports = poll;