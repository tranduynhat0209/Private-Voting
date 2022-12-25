const circomlibjs = require("circomlibjs");
const crypto = require("crypto");
const snarkjs = require("snarkjs");
const path = require("path");
const { utils } = require("ffjavascript");
const { ethers } = require("ethers");
const tokenJson = require("../artifacts/contracts/Token.sol/Token.json");
const votingJson = require("../artifacts/contracts/Voting.sol/Voting.json");
const { mainModule } = require("process");
const { timeStamp } = require("console");
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

const mod = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const power = (base, exponent) => {

    var res = BigInt(1);
    base = BigInt(base);
    exponent = BigInt(exponent);
    for (var i = 0; i < 255; i++) {
        if ((exponent >> BigInt(i)) & BigInt(1)) res = res * base % mod;
        base = base * base % mod;
    }
    return res;
}

const decryptElgamma = (prvKey, gamma, delta) => {

    prvKey = BigInt(prvKey);
    gamma = BigInt(gamma.toString());
    delta = BigInt(delta.toString());
    return delta * power(power(gamma, prvKey), mod - BigInt(2)) % mod;
}
class poll {
    constructor(address, tokenAddress, signer) {
        this.signer = signer;
        this.contract = new ethers.Contract(address, votingJson.abi, signer);
        this.tokenContract = new ethers.Contract(tokenAddress, tokenJson.abi, signer);
        this.g = 7907;
        this.h = 7867;
    }

    async createPoll(prvKey, delay, period, title, content, isTokenVote, queryIds) {
        const pubKey = power(this.g, prvKey);
        await this.contract.createPoll(period, delay, pubKey, title, content, isTokenVote, queryIds, { gasLimit: 1e6 });

    }

    async getVotingPower(id) {
        const timestamp = (await this.contract.polls(id)).startTimeStamp;
        return (await this.tokenContract.getPriorVotes(this.signer.getAddress(), timestamp));
    }

    async votePoll(id, vote, sign) {
        vote = BigInt(vote);
        const pubKey = (await this.contract.polls(id)).publicKey.toString();
        var power = BigInt((await this.getVotingPower(id)).toString());
        var r = BigInt(Math.floor(Math.random() * 1000));
        var kx = BigInt(Math.floor(Math.random() * 1000));
        var kr = BigInt(Math.floor(Math.random() * 1000));


        var { proof, publicSignals } = await snarkjs.groth16.fullProve(
            {
                xFake: vote,
                sign,
                X: power,
                r,
                g: this.g,
                h: this.h,
                D: pubKey,
                kX: kx,
                kR: kr,
            },
            path.join("circuits", "vote.wasm"),
            path.join("circuits", "vote.zkey")

        );
        const { a, b, c, publicInputs } = await genCallData(proof, publicSignals)
        await this.contract.votePoll(a, b, c, id, publicInputs[0], publicInputs[1], publicInputs[2], publicInputs[3], publicInputs[4], { gasLimit: 1e6 });

    }



    async closePoll(prvKey, id) {
        let filter = this.contract.filters.VotePoll(id, null, null, null, null);

        let events = await this.contract.queryFilter(filter,
            25767970,
            25767980);
        console.log(events);
        let totalX = BigInt(0);
        let totalR = BigInt(0);

        events.forEach((e) => {
            totalX = (totalX + decryptElgamma(prvKey, e.args["gammaX"], e.args["deltaX"])) % mod;
            totalR = (totalR + decryptElgamma(prvKey, e.args["gammaR"], e.args["deltaR"])) % mod;
        })


        await this.contract.closePoll(id, totalX, totalR, { gasLimit: 1e6 });
    }


}


module.exports = poll;