pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/babyjub.circom";

template CheckTotalVote() {
    signal input totalGammaYes[2];
    signal input totalDeltaYes[2];
    signal input totalVoteYes;

    signal input totalGammaNo[2];
    signal input totalDeltaNo[2];
    signal input totalVoteNo;

    signal input prvKey;

    /// checkVoteYes
    component mulGammaYesAndPrvKey = BabyMul();
    mulGammaYesAndPrvKey.e <== prvKey;
    mulGammaYesAndPrvKey.xbase <== totalGammaYes[0];
    mulGammaYesAndPrvKey.ybase <== totalGammaYes[1];

    component mulTotalYesAndG = BabyPbk();
    mulTotalYesAndG.in <== totalVoteYes;

    component calTotalDeltaYes = BabyAdd();
    calTotalDeltaYes.x1 <== mulGammaYesAndPrvKey.xout;
    calTotalDeltaYes.y1 <== mulGammaYesAndPrvKey.yout;
    calTotalDeltaYes.x2 <== mulTotalYesAndG.Ax;
    calTotalDeltaYes.y2 <== mulTotalYesAndG.Ay;

    calTotalDeltaYes.xout === totalDeltaYes[0];
    calTotalDeltaYes.yout === totalDeltaYes[1];

    //// checkVoteNo   
    
    component mulGammaNoAndPrvKey = BabyMul();
    mulGammaNoAndPrvKey.e <== prvKey;
    mulGammaNoAndPrvKey.xbase <== totalGammaNo[0];
    mulGammaNoAndPrvKey.ybase <== totalGammaNo[1];

    component mulTotalNoAndG = BabyPbk();
    mulTotalNoAndG.in <== totalVoteNo;

    component calTotalDeltaNo = BabyAdd();
    calTotalDeltaNo.x1 <== mulGammaNoAndPrvKey.xout;
    calTotalDeltaNo.y1 <== mulGammaNoAndPrvKey.yout;
    calTotalDeltaNo.x2 <== mulTotalNoAndG.Ax;
    calTotalDeltaNo.y2 <== mulTotalNoAndG.Ay;

    calTotalDeltaNo.xout === totalDeltaNo[0];
    calTotalDeltaNo.yout === totalDeltaNo[1];
}

template BabyMul() {
    signal input e;
    signal output xout;
    signal output yout;
    signal input xbase;
    signal input ybase;
    component eBits = Num2Bits(255);
    eBits.in <== e;
    
    component mulFix = SegmentMulFix(85);
    var i;
    for (i=0; i<255; i++) {
        mulFix.e[i] <== eBits.out[i];
    }
    mulFix.base[0] <== xbase;
    mulFix.base[1] <== ybase;

    xout <== mulFix.out[0];
    yout <== mulFix.out[1];
    
}

component main  {public [totalGammaYes,totalDeltaYes,totalVoteYes,totalGammaNo,totalDeltaNo,totalVoteNo]}  = CheckTotalVote();