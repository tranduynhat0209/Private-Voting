// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./interfaces/IRegister.sol";

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
    struct AllowedQuery {
        uint256 issuerId;
        uint256 factor;
        uint128 claimSchema;
        uint16 from;
        uint16 to;
        uint8 slotIndex;
    }
    struct Cryption {
        uint256 gammaX;
        uint256 deltaX;
        uint256 gammaR;
        uint256 deltaR;
    }
    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
        uint256[12] pubSigs;
        uint256 queryId;
        uint64 fromTimestamp;
        uint64 toTimestamp;
    }
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
        string tittle;
        string content;
        bool isTokenVote;
        mapping(uint256 => bool) isUsedZiden;
        mapping(uint256 => bool) queryIds;
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
    IRegister register;
    uint256 public constant Q =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 public constant G = 7907;
    uint256 public constant H = 7867;

    constructor(address _verifier, address _token, address _register) {
        verifier = IVerifier(_verifier);
        token = IToken(_token);
        register = IRegister(_register);
    }

    event CreatePoll(uint indexed pollCount, uint indexed publicKey);

    function createPoll(
        uint256 votingPeriod,
        uint256 votingDelay,
        uint256 publicKey,
        string calldata tittle,
        string calldata content,
        bool isTokenVote,
        uint256[] calldata queryIds
    ) external returns (uint256) {
        for (uint i = 0; i < queryIds.length; ) {
            require(
                register.queryDisabled(queryIds[i]) == false,
                "Private-Voting::create poll: queryId is disabled."
            );
            unchecked {
                i += 1;
            }
        }
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
        newPoll.tittle = tittle;
        newPoll.content = content;
        newPoll.isTokenVote = isTokenVote;
        for (uint i = 0; i < queryIds.length; ) {
            newPoll.queryIds[queryIds[i]] = true;
            unchecked {
                i += 1;
            }
        }
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

    function getVotingPower(
        uint256 pollId,
        Proof[] calldata proofs,
        address voter
    ) public view returns (uint256 votes) {
        Poll storage poll = polls[pollId];
        votes = 0;
        if (poll.isTokenVote) {
            votes += uint256(token.getPriorVotes(voter, poll.startTimeStamp));
        }
        for (uint i = 0; i < proofs.length; i++) {
            require(
                isQueryOf(proofs[i].queryId, pollId) == true,
                "Private-Voting::get voting power: queryId not avaible"
            );
            require(
                proofs[i].fromTimestamp >= poll.startTimeStamp,
                "Private-Voting::get voting power: timeStamp not avaible"
            );
            require(
                poll.isUsedZiden[proofs[i].pubSigs[0]] == false,
                "one of Metric Ziden is use"
            );
            votes += register.getVotingPower(
                proofs[i].a,
                proofs[i].b,
                proofs[i].c,
                proofs[i].pubSigs,
                proofs[i].queryId,
                proofs[i].fromTimestamp,
                proofs[i].toTimestamp
            );
        }
        return votes;
    }

    function votePoll(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint256 pollId,
        uint256 encryptedVote,
        Cryption calldata cryption,
        Proof[] calldata proofs
    ) external {
        require(
            state(pollId) == PollState.Active,
            "Private-Voting::vote poll: poll is not activate."
        );
        address voter = msg.sender;
        Poll storage poll = polls[pollId];
        Receipt storage receipt = poll.receipts[voter];
        require(
            receipt.hasVoted == false,
            "Private-Voting::vote poll: voter already voted"
        );
        uint256 votes = getVotingPower(pollId, proofs, voter);
        require(
            verifier.verifyProof(
                a,
                b,
                c,
                [
                    encryptedVote,
                    cryption.gammaX,
                    cryption.deltaX,
                    cryption.gammaR,
                    cryption.deltaR,
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
        for (uint i = 0; i < proofs.length; i++) {
            poll.isUsedZiden[proofs[i].pubSigs[0]] == true;
        }
        receipt.hasVoted = true;
        receipt.encryptedVote = encryptedVote;
        receipt.votePowers = votes;
        receipt.timeStamp = uint32(block.timestamp);
        emit VotePoll(
            pollId,
            cryption.gammaX,
            cryption.deltaX,
            cryption.gammaR,
            cryption.deltaR
        );
    }

    function expmod(
        uint256 base,
        uint256 exponent
    ) public view returns (uint256 res) {
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

    function isQueryOf(
        uint256 queryId,
        uint256 pollId
    ) public view returns (bool) {
        return polls[pollId].queryIds[queryId];
    }

    function getReceipt(
        address user,
        uint256 pollId
    ) public view returns (Receipt memory) {
        return polls[pollId].receipts[user];
    }
}
