// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IVote {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[11] memory input
    ) external view returns (bool r);
}

interface ICaculator {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[10] memory input
    ) external view returns (bool r);
}

interface ICurveBabyJubJub {
    function pointAdd(
        uint256 _x1,
        uint256 _y1,
        uint256 _x2,
        uint256 _y2
    ) external view returns (uint256 x3, uint256 y3);

    function isOnCurve(uint256 _x, uint256 _y) external pure returns (bool);
}

interface IToken {
    function getPriorVotes(
        address account,
        uint32 timestamp
    ) external view returns (uint96);
}

contract Voting {
    event CreatePoll(uint indexed pollCount, uint[2] indexed publicKey);
    enum PollState {
        Pending,
        Active,
        Done,
        Canceled,
        Succeeded
    }
    struct Poll {
        uint256 id;
        uint256[2] publicKey;
        uint256[4] encryptedVoteYes;
        uint256[4] encryptedVoteNo;
        uint256 numberVoteYes;
        uint256 numberVoteNo;
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
        uint256[4] encryptedVoteYes;
        uint256[4] encryptedVoteNo;
        uint256 votePowers;
        uint32 timeStamp;
    }
    uint256 public pollCount;
    mapping(uint256 => Poll) public polls;
    IVote voteVerifier;
    ICaculator caculatorVerifier;
    ICurveBabyJubJub curve;
    IToken token;

    constructor(
        address _voteVerifier,
        address _caculatorVerifier,
        address _curve,
        address _token
    ) {
        voteVerifier = IVote(_voteVerifier);
        caculatorVerifier = ICaculator(_caculatorVerifier);
        curve = ICurveBabyJubJub(_curve);
        token = IToken(_token);
    }

    function createPoll(
        uint256 votingPeriod,
        uint256 votingDelay,
        uint256[2] calldata publicKey,
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
        newPoll.encryptedVoteYes = [0, 1, 0, 1];
        newPoll.encryptedVoteNo = [0, 1, 0, 1];
        newPoll.daoManager = msg.sender;
        newPoll.canceled = false;
        newPoll.content = content;
        emit CreatePoll(pollCount, publicKey);
        return pollCount;
    }

    function votePoll(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint256 pollId,
        uint256[4] memory encryptedVoteYes,
        uint256[4] memory encryptedVoteNo
    ) external returns (bool) {
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
            voteVerifier.verifyProof(
                a,
                b,
                c,
                [
                    encryptedVoteYes[0],
                    encryptedVoteYes[1],
                    encryptedVoteYes[2],
                    encryptedVoteYes[3],
                    encryptedVoteNo[0],
                    encryptedVoteNo[1],
                    encryptedVoteNo[2],
                    encryptedVoteNo[3],
                    poll.publicKey[0],
                    poll.publicKey[1],
                    votes
                ]
            ),
            "Private-Voting::vote poll: proof is incorect"
        );
        (poll.encryptedVoteYes[0], poll.encryptedVoteYes[1]) = curve.pointAdd(
            poll.encryptedVoteYes[0],
            poll.encryptedVoteYes[1],
            encryptedVoteYes[0],
            encryptedVoteYes[1]
        );
        (poll.encryptedVoteYes[2], poll.encryptedVoteYes[3]) = curve.pointAdd(
            poll.encryptedVoteYes[2],
            poll.encryptedVoteYes[3],
            encryptedVoteYes[2],
            encryptedVoteYes[3]
        );
        (poll.encryptedVoteNo[0], poll.encryptedVoteNo[1]) = curve.pointAdd(
            poll.encryptedVoteNo[0],
            poll.encryptedVoteNo[1],
            encryptedVoteNo[0],
            encryptedVoteNo[1]
        );
        (poll.encryptedVoteNo[2], poll.encryptedVoteNo[3]) = curve.pointAdd(
            poll.encryptedVoteNo[2],
            poll.encryptedVoteNo[3],
            encryptedVoteNo[2],
            encryptedVoteNo[3]
        );
        receipt.hasVoted = true;
        receipt.encryptedVoteYes = encryptedVoteYes;
        receipt.encryptedVoteNo = encryptedVoteNo;
        receipt.votePowers = votes;
        receipt.timeStamp = uint32(block.timestamp);
        return true;
    }

    function closePoll(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint256 pollId,
        uint256[2] memory totalDecryptVote
    ) external returns (bool) {
        require(
            state(pollId) == PollState.Succeeded ||
                state(pollId) == PollState.Active,
            "Private-Voting::close poll: poll only can be closed if it is succeeded or active"
        );
        Poll storage poll = polls[pollId];
        require(
            caculatorVerifier.verifyProof(
                a,
                b,
                c,
                [
                    poll.encryptedVoteYes[0],
                    poll.encryptedVoteYes[1],
                    poll.encryptedVoteYes[2],
                    poll.encryptedVoteYes[3],
                    totalDecryptVote[0],
                    poll.encryptedVoteNo[0],
                    poll.encryptedVoteNo[1],
                    poll.encryptedVoteNo[2],
                    poll.encryptedVoteNo[3],
                    totalDecryptVote[1]
                ]
            ),
            "Private-Voting::close poll: proof is incorect"
        );
        uint32 eta = uint32(block.timestamp);
        poll.eta = eta;
        poll.numberVoteYes = totalDecryptVote[0];
        poll.numberVoteNo = totalDecryptVote[1];
        return true;
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

    function getEncryptedVote(
        uint pollId
    ) public view returns (uint[4] memory, uint[4] memory) {
        return (polls[pollId].encryptedVoteYes, polls[pollId].encryptedVoteNo);
    }

    function getPublicKey(uint pollId) public view returns (uint[2] memory) {
        return (polls[pollId].publicKey);
    }
}
