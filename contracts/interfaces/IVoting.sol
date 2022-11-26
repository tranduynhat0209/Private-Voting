// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IVoting {
    enum PollState {
        Active,
        Done,
        Canceled,
        Expired
    }

    function createPoll(
        uint256 votingDelay,
        uint256 publicKey,
        string calldata content
    ) external returns (uint256 pollId);

    function votePoll(uint256 pollId) external;
}
