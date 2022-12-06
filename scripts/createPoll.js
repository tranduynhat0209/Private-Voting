const { ethers } = require("hardhat");
const poll = require("./poll.js")
const main = async () => {
    const [deployer] = await ethers.getSigners();

    console.log(deployer._isSigner);
    console.log(await deployer.getAddress())
    const pr = new poll("0x59ed3b3073443656CD0854857865f77C51BFa9AB", "0x4c4274e95baff67F0687EFd1D93f3e56e12b399D", deployer);

    //await pr.createPoll(1234, 0, 1000000, "xyz");
    console.log(await pr.contract.pollCount());

}

main();