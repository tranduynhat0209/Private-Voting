pragma solidity ^0.8.0;

interface IVerifier {
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
}

contract Proposal {
    struct encryptVote {
        uint[2] gammaYes;
        uint[2] betaYes;
        uint[2] gammaNo;
        uint[2] betaNo;
    }
    mapping(uint32 => encryptVote) encryptTotalVoteOfProposal;
    mapping(uint32 => uint) public totalVoteYesOfProposal;
    mapping(uint32 => uint) public totalVoteNoOfProposal;
    uint32 count;
    IVerifier verifier;
    ICurveBabyJubJub curveBabyJubJub;

    constructor(address _veryfier, address _babyjubjub) {
        verifier = IVerifier(_veryfier);
        curveBabyJubJub = ICurveBabyJubJub(_babyjubjub);
    }

    function generateProposal() public {
        ++count;
        encryptTotalVoteOfProposal[count].gammaYes = [0, 1];
        encryptTotalVoteOfProposal[count].betaYes = [0, 1];
        encryptTotalVoteOfProposal[count].gammaNo = [0, 1];
        encryptTotalVoteOfProposal[count].betaNo = [0, 1];
    }

    function addPoint(
        uint[2] memory a,
        uint[2] memory b
    ) public view returns (uint[2] memory) {
        uint[2] memory c;
        (c[0], c[1]) = curveBabyJubJub.pointAdd(a[0], a[1], b[0], b[1]);
        return c;
    }

    function vote(uint32 idProposal, encryptVote memory a) public {
        encryptVote memory b = encryptTotalVoteOfProposal[idProposal];
        b.gammaYes = addPoint(a.gammaYes, b.gammaYes);
        b.betaYes = addPoint(a.betaYes, b.betaYes);
        b.gammaNo = addPoint(a.gammaNo, b.gammaNo);
        b.betaNo = addPoint(a.betaNo, b.betaNo);
        encryptTotalVoteOfProposal[idProposal] = b;
    }

    function calTotalVote(
        uint32 idProposal,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory totalDecryptVote
    ) public {
        encryptVote memory x = encryptTotalVoteOfProposal[idProposal];
        require(
            verifier.verifyProof(
                a,
                b,
                c,
                [
                    x.gammaYes[0],
                    x.gammaYes[1],
                    x.betaYes[0],
                    x.betaYes[1],
                    totalDecryptVote[0],
                    x.gammaNo[0],
                    x.gammaNo[1],
                    x.betaNo[0],
                    x.betaNo[1],
                    totalDecryptVote[1]
                ]
            ),
            "incorect proof"
        );
        totalVoteYesOfProposal[idProposal] = totalDecryptVote[0];
        totalVoteNoOfProposal[idProposal] = totalDecryptVote[1];
    }
}
