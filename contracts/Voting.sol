// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";

interface IToken {
    function getPriorVotes(
        address account,
        uint32 timestamp
    ) external view returns (uint96);
}

interface IVerifier {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[9] memory input
    ) external view returns (bool r);
}

contract Voting {
    enum PollState {
        Pending,
        Active,
        Done,
        Canceled,
        Succeeded
    }
    struct Poll {
        uint256 id;
        uint256 publicKey;
        uint256 encryptedVote;
        int256 numberVote;
        address daoManager;
        uint32 startTimeStamp;
        uint32 duration;
        uint32 eta;
        bool canceled;
        string content;
        mapping(address => Receipt) receipts;
    }
    struct Receipt {
        bool hasVoted;
        uint256 encryptedVote;
        uint256 votePowers;
        uint32 timeStamp;
    }

    uint256 public pollCount;
    mapping(uint256 => Poll) public polls;
    IVerifier verifier;
    IToken token;
    uint256 public constant Q =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 public constant G = 7907;
    uint256 public constant H = 7867;

    constructor(address _verifier, address _token) {
        verifier = IVerifier(_verifier);
        token = IToken(_token);
    }

    event CreatePoll(uint indexed pollCount, uint indexed publicKey);

    function createPoll(
        uint256 votingPeriod,
        uint256 votingDelay,
        uint256 publicKey,
        string calldata content
    ) external returns (uint256) {
        pollCount++;
        Poll storage newPoll = polls[pollCount];
        uint32 startTimeStamp = uint32(block.timestamp + votingDelay);
        uint32 duration = uint32(votingPeriod);
        newPoll.id = pollCount;
        newPoll.eta = 0;
        newPoll.startTimeStamp = startTimeStamp;
        newPoll.duration = duration;
        newPoll.publicKey = publicKey;
        newPoll.encryptedVote = 1;
        newPoll.daoManager = msg.sender;
        newPoll.canceled = false;
        newPoll.content = content;
        emit CreatePoll(pollCount, publicKey);
        return pollCount;
    }

    event VotePoll(
        uint256 indexed pollId,
        uint256 gammaX,
        uint256 deltaX,
        uint256 gammaR,
        uint256 deltaR
    );

    function votePoll(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint256 pollId,
        uint256 encryptedVote,
        uint256 gammaX,
        uint256 deltaX,
        uint256 gammaR,
        uint256 deltaR
    ) external {
        require(
            state(pollId) == PollState.Active,
            "Private-Voting::vote poll: poll is closed."
        );
        address voter = msg.sender;
        Poll storage poll = polls[pollId];
        Receipt storage receipt = poll.receipts[voter];
        require(
            receipt.hasVoted == false,
            "Private-Voting::vote poll: voter already voted"
        );
        uint256 votes = uint256(
            token.getPriorVotes(voter, poll.startTimeStamp)
        );
        require(
            verifier.verifyProof(
                a,
                b,
                c,
                [
                    encryptedVote,
                    gammaX,
                    deltaX,
                    gammaR,
                    deltaR,
                    votes,
                    G,
                    H,
                    poll.publicKey
                ]
            ),
            "Private-Voting::vote poll: proof is incorect"
        );
        polls[pollId].encryptedVote = mulmod(
            polls[pollId].encryptedVote,
            encryptedVote,
            Q
        );
        receipt.hasVoted = true;
        receipt.encryptedVote = encryptedVote;
        receipt.votePowers = votes;
        receipt.timeStamp = uint32(block.timestamp);
        emit VotePoll(pollId, gammaX, deltaX, gammaR, deltaR);
    }

    function expmod(
        uint256 base,
        uint256 exponent
    ) public returns (uint256 res) {
        res = 1;
        for (uint32 i = 0; i < 255; i++) {
            if ((exponent >> i) & 1 == 1) res = mulmod(res, base, Q);
            base = mulmod(base, base, Q);
        }
        return res;
    }

    function closePoll(
        uint256 pollId,
        uint256 totalVote,
        uint256 totalRandom
    ) external {
        require(
            state(pollId) == PollState.Succeeded ||
                state(pollId) == PollState.Active,
            "Private-Voting::close poll: poll only can be closed if it is succeeded or active"
        );
        Poll storage poll = polls[pollId];
        require(
            totalVote < Q && totalRandom < Q,
            "totalVote and totalRandom must module Q"
        );
        uint checkNegative = (totalVote > Q / 2) ? 1 : 0;
        require(
            mulmod(
                expmod(G, totalVote - checkNegative),
                expmod(H, totalRandom),
                Q
            ) == poll.encryptedVote,
            "decrypt wrong"
        );

        uint32 eta = uint32(block.timestamp);
        poll.eta = eta;
        poll.numberVote = int(totalVote) - int(checkNegative * Q);
    }

    function state(uint256 pollId) public view returns (PollState) {
        Poll storage poll = polls[pollId];
        require(
            poll.startTimeStamp > 0,
            "Private-Voting::state: poll not existed."
        );
        if (poll.canceled) {
            return PollState.Canceled;
        } else if (block.timestamp <= poll.startTimeStamp) {
            return PollState.Pending;
        } else if (poll.eta != 0) {
            return PollState.Done;
        } else if (block.timestamp <= (poll.startTimeStamp + poll.duration)) {
            return PollState.Active;
        } else return PollState.Succeeded;
    }
}
