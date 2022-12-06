const poll = require("./poll");
const { ethers } = require("hardhat");
const VOTE = "0xe32ED7aEE08BcAaaf4Ff1426dd472557b47e350e";
const TOKEN = "0xECB91C95f10beF9549e554151b32ef5A5bfDe320";
async function main() {
    const [ADDRESS] = await ethers.getSigners();
    const pr = new poll(VOTE, TOKEN, ADDRESS);
    await pr.createPoll(15666, 0, 43200, "Proposal title 3|description of proposal title 3");
    // await pr.closePoll(15666, 3);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });