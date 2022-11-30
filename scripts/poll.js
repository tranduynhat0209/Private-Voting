// import circomlibjs from "circomlibjs";
// import crypto from "crypto";
// import snarkjs from "snarkjs";
// import path from "path";
// import { utils } from "ffjavascript";
// import ethers from "ethers";
const circomlibjs = require("circomlibjs");
const crypto = require("crypto");
const snarkjs = require("snarkjs");
const path = require("path");
const { utils } = require("ffjavascript");
const { ethers } = require("ethers");
const votingJson = require("../public/Voting.json");
const tokenJson = require("../public/Token.json");
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
    constructor(address, tokenAddress, signer) {
        this.signer = signer;
        this.contract = new ethers.Contract(address, votingJson.abi, signer);
        this.tokenContract = new ethers.Contract(tokenAddress, tokenJson.abi, signer);
    }

    async createPoll(prvKey, delay, period, content) {
        const babyJub = await circomlibjs.buildBabyjub();
        const pubKey = babyJub.mulPointEscalar(babyJub.Base8, prvKey);
        const transaction = await this.contract.createPoll(period, delay, utils.stringifyFElements(babyJub.F, pubKey), content, { gasLimit: 1e6 });
        return ((await transaction.wait()).events[0].topics[1]);
    }

    async getVotingPower(id) {
        const timestamp = (await this.contract.polls(id)).startTimeStamp;
        return (await this.tokenContract.getPriorVotes(this.signer.getAddress(), timestamp));
    }

    async votePoll(yes, no, id) {
        const pubKey = await this.contract.getPublicKey(id);
        const babyJub = await circomlibjs.buildBabyjub();
        const x = utils.stringifyFElements(babyJub.F, await this.getVotingPower(id));
        const rYes = BigInt(`0x${crypto.randomBytes(31).toString('hex')}`);
        const rNo = BigInt(`0x${crypto.randomBytes(31).toString('hex')}`);
        const input = {
            Dx: utils.stringifyFElements(babyJub.F, pubKey[0]),
            Dy: utils.stringifyFElements(babyJub.F, pubKey[1]),
            x, yes, no, rYes, rNo
        }
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            path.join("circuits", "vote.wasm"),
            path.join("circuits", "vote.zkey")
        );

        const { a, b, c, publicInputs } = await genCallData(proof, publicSignals);

        const encryptedVoteYes = publicInputs.filter((e, index) => index < 4);
        const encryptedVoteNo = publicInputs.filter((e, index) => 4 <= index && index < 8);

        const transaction = await this.contract.votePoll(a, b, c, id, encryptedVoteYes, encryptedVoteNo, { gasLimit: 1e6 });
        await transaction.wait();
    }

    async findTotalVote(encryptedVote, prvKey) {

        const babyJub = await circomlibjs.buildBabyjub();
        let totalGamma = [encryptedVote[0], encryptedVote[1]];
        let totalDelta = [encryptedVote[2], encryptedVote[3]];

        totalGamma = utils.stringifyFElements(babyJub.F, totalGamma);
        totalDelta = utils.stringifyFElements(babyJub.F, totalDelta);

        totalGamma = utils.unstringifyFElements(babyJub.F, totalGamma);
        totalDelta = utils.unstringifyFElements(babyJub.F, totalDelta);

        totalGamma = babyJub.mulPointEscalar(totalGamma, prvKey);
        const F = babyJub.F;
        let mul = [F.e("0"), F.e("1")];

        for (var i = 0; ; i++) {

            if (JSON.stringify(babyJub.addPoint(mul, totalGamma)) === JSON.stringify(totalDelta)) {
                return i;
            }
            mul = babyJub.addPoint(mul, babyJub.Base8);
        }
    }

    async closePoll(prvKey, id) {

        const babyJub = await circomlibjs.buildBabyjub();
        const encrytedVote = await this.contract.getEncryptedVote(id);

        const encryptedVoteYes = encrytedVote[0];
        const encryptedVoteNo = encrytedVote[1];

        let totalGammaYes = [encryptedVoteYes[0], encryptedVoteYes[1]];
        let totalDeltaYes = [encryptedVoteYes[2], encryptedVoteYes[3]];

        totalGammaYes = utils.stringifyFElements(babyJub.F, totalGammaYes);
        totalDeltaYes = utils.stringifyFElements(babyJub.F, totalDeltaYes);

        //////////////////////////////
        let totalGammaNo = [encryptedVoteNo[0], encryptedVoteNo[1]];
        let totalDeltaNo = [encryptedVoteNo[2], encryptedVoteNo[3]];

        totalGammaNo = utils.stringifyFElements(babyJub.F, totalGammaNo);
        totalDeltaNo = utils.stringifyFElements(babyJub.F, totalDeltaNo);


        const totalVoteYes = await this.findTotalVote(encryptedVoteYes, prvKey);
        const totalVoteNo = await this.findTotalVote(encryptedVoteNo, prvKey);

        const input = {
            totalGammaYes,
            totalDeltaYes,
            totalVoteYes,
            totalGammaNo,
            totalDeltaNo,
            totalVoteNo,
            prvKey
        }


        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            path.join("circuits", "checkTotalVote.wasm"),
            path.join("circuits", "checkTotalVote.zkey")
        );
        const { a, b, c, publicInputs } = await genCallData(proof, publicSignals);
        const transaction = await this.contract.closePoll(a, b, c, id, [totalVoteYes, totalVoteNo], { gasLimit: 1e6 });
        await transaction.wait();
    }


}




//export default poll;
module.exports = poll;