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
    console.log(prvKey);
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

    async createPoll(prvKey, delay, period, content) {
        const pubKey = power(this.g, prvKey);
        const transaction = await this.contract.createPoll(period, delay, pubKey, content, { gasLimit: 1e6 });
        return ((await transaction.wait()).events[0].topics[1]);
    }

    async getVotingPower(id) {
        const timestamp = (await this.contract.polls(id)).startTimeStamp;
        return (await this.tokenContract.getPriorVotes(this.signer.getAddress(), timestamp));
    }

    async votePoll(id, vote) {
        vote = BigInt(vote);
        const pubKey = (await this.contract.polls(id)).publicKey.toString();

        var r = BigInt(Math.floor(Math.random() * 1000));
        var kx = BigInt(Math.floor(Math.random() * 1000));
        var kr = BigInt(Math.floor(Math.random() * 1000));
        var pedersen = power(this.g, vote) * power(this.h, r) % mod;
        var gammaX = power(this.g, kx);
        var deltaX = power(pubKey, kx) * vote % mod;
        var gammaR = power(this.g, kr);
        var deltaR = power(pubKey, kr) * r % mod;

        await this.contract.votePoll(id, pedersen, gammaX, deltaX, gammaR, deltaR);

    }



    async closePoll(prvKey, id) {
        let filter = this.contract.filters.VotePoll(id, null, null, null, null);

        let events = await this.contract.queryFilter(filter, 0, await ethers.getDefaultProvider().getBlockNumber());
        let totalX = BigInt(0);
        let totalR = BigInt(0);

        events.forEach((e) => {
            totalX += decryptElgamma(prvKey, e.args["gammaX"], e.args["deltaX"]);
            totalR += decryptElgamma(prvKey, e.args["gammaR"], e.args["deltaR"]);
        })

        console.log(totalX);
        console.log(totalR);
        await this.contract.closePoll(id, totalX, totalR, { gasLimit: 1e6 });
    }


}


module.exports = poll;