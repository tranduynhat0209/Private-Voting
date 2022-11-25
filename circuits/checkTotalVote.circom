pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/babyjub.circom";

template CheckTotalVote() {
    signal input totalGammaYes[2];
    signal input totalBetaYes[2];
    signal input totalVoteYes;

    signal input totalGammaNo[2];
    signal input totalBetaNo[2];
    signal input totalVoteNo;

    signal input prvKey;

    /// checkVoteYes
    component mulGammaYesAndPrvKey = BabyMul();
    mulGammaYesAndPrvKey.e <== prvKey;
    mulGammaYesAndPrvKey.xbase <== totalGammaYes[0];
    mulGammaYesAndPrvKey.ybase <== totalGammaYes[1];

    component mulTotalYesAndG = BabyPbk();
    mulTotalYesAndG.in <== totalVoteYes;

    component calTotalBetaYes = BabyAdd();
    calTotalBetaYes.x1 <== mulGammaYesAndPrvKey.xout;
    calTotalBetaYes.y1 <== mulGammaYesAndPrvKey.yout;
    calTotalBetaYes.x2 <== mulTotalYesAndG.Ax;
    calTotalBetaYes.y2 <== mulTotalYesAndG.Ay;

    calTotalBetaYes.xout === totalBetaYes[0];
    calTotalBetaYes.yout === totalBetaYes[1];

    //// checkVoteNo   
    
    component mulGammaNoAndPrvKey = BabyMul();
    mulGammaNoAndPrvKey.e <== prvKey;
    mulGammaNoAndPrvKey.xbase <== totalGammaNo[0];
    mulGammaNoAndPrvKey.ybase <== totalGammaNo[1];

    component mulTotalNoAndG = BabyPbk();
    mulTotalNoAndG.in <== totalVoteNo;

    component calTotalBetaNo = BabyAdd();
    calTotalBetaNo.x1 <== mulGammaNoAndPrvKey.xout;
    calTotalBetaNo.y1 <== mulGammaNoAndPrvKey.yout;
    calTotalBetaNo.x2 <== mulTotalNoAndG.Ax;
    calTotalBetaNo.y2 <== mulTotalNoAndG.Ay;

    calTotalBetaNo.xout === totalBetaNo[0];
    calTotalBetaNo.yout === totalBetaNo[1];
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