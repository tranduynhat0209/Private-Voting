const { ethers } = require("hardhat");
const poll = require("./poll.js");
const tokenContract = "0xB1DFEcE55eb3D6898CcDB6308a6516838ff8910B"
const votingContract = "0x399530e173E569AE8De5258bf391d58a3e7AE31a"
const tokenJson = require("../artifacts/contracts/Token.sol/Token.json");
const main = async () => {
    const [deployer] = await ethers.getSigners();

    console.log(deployer._isSigner);
    console.log(await deployer.getAddress())
    const pr = new poll(votingContract, tokenContract, deployer);
    //await pr.tokenContract.transfer("0x6d9175EE493c9f8730202Cf807b853F9Ce651B42", 2000)
    //await pr.tokenContract.delegate(deployer.address);
    //await pr.createPoll(1234, 0, 1000000, "1th poll", "demo", true, [0, 1, 2]);
    //console.log(await pr.tokenContract.getCurrentVotes(deployer.address));
    //console.log(await pr.contract.pollCount())
    //console.log(await pr.tokenContract.balanceOf(deployer.address));
    //const token = await ethers.getContractAt(tokenJson.abi, tokenContract, await ethers.getSigner())
    //console.log(await token.balanceOf("0x6d9175EE493c9f8730202Cf807b853F9Ce651B42"))
    //console.log(await pr.tokenContract.balanceOf(deployer.address))
    await pr.closePoll(1234, 1)
}

main();