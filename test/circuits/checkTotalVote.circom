pragma circom 2.0.0;

include "../../circuits/checkTotalVote.circom";

component main  {public [totalGammaYes,totalBetaYes,totalVoteYes,totalGammaNo,totalBetaNo,totalVoteNo]}  = CheckTotalVote();


