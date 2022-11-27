pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/babyjub.circom";

template Vote() {
    //public input 
    signal input Dx, Dy;
    signal input x;
    //private input
    signal input yes, no;
    signal input rYes, rNo;
    //public output;
    signal output gammaYesX, gammaYesY, deltaYesX, deltaYesY ;
    signal output gammaNoX, gammaNoY, deltaNoX, deltaNoY;

    //constraint 2:   yes + no <= X
    component lessEqThan = LessEqThan(252);
    lessEqThan.in[0] <== yes + no;
    lessEqThan.in[1] <== x;
    lessEqThan.out === 1;

    //compute Myes
    component mYes = MultiplicationWithGeneratorPoint();
    mYes.in <== yes;
    // check grammaYes
    component computeGammaYes = MultiplicationWithGeneratorPoint();
    computeGammaYes.in <== rYes;
    gammaYesX <== computeGammaYes.Ax;
    gammaYesY <== computeGammaYes.Ay;
    // check DeltaYes
    component computeDeltaYes = MultiplicationWithDPointAndAddWithM();
    computeDeltaYes.in <== rYes;
    computeDeltaYes.Mx <== mYes.Ax;
    computeDeltaYes.My <== mYes.Ay;
    computeDeltaYes.Dx <== Dx;
    computeDeltaYes.Dy <== Dy;


    deltaYesX <== computeDeltaYes.Ax;
    deltaYesY <== computeDeltaYes.Ay;


    //compute mNo
    component mNo = MultiplicationWithGeneratorPoint();
    mNo.in <== no;
    // check grammaNo
    component computeGammaNo = MultiplicationWithGeneratorPoint();
    computeGammaNo.in <== rNo;
    gammaNoX <== computeGammaNo.Ax;
    gammaNoY <== computeGammaNo.Ay;
    // check DeltaNo
    component computeDeltaNo = MultiplicationWithDPointAndAddWithM();
    computeDeltaNo.in <== rNo;
    computeDeltaNo.Mx <== mNo.Ax;
    computeDeltaNo.My <== mNo.Ay;
    computeDeltaNo.Dx <== Dx;
    computeDeltaNo.Dy <== Dy;

    deltaNoX <== computeDeltaNo.Ax;
    deltaNoY <== computeDeltaNo.Ay;

}

template MultiplicationWithGeneratorPoint() {
    signal input in;
    signal output Ax;
    signal output Ay;
    component pvkBits = Num2Bits(255);
    pvkBits.in <== in;
    var G[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];
    component mulFix = EscalarMulFix(253,G);
    var i;
    for (i=0; i<253; i++) {
        mulFix.e[i] <== pvkBits.out[i];
    }
    Ax  <== mulFix.out[0];
    Ay  <== mulFix.out[1];
}

template MultiplicationWithDPointAndAddWithM() {
    signal input in;
    signal input Mx, My;
    signal output Ax;
    signal output Ay;
    signal input Dx;
    signal input Dy;
    component pvkBits = Num2Bits(255);
    pvkBits.in <== in;
    var D[2] = [Dx,Dy];
    
    component mulFix = SegmentMulFix(85);
    var i;
    for (i=0; i<255; i++) {
        mulFix.e[i] <== pvkBits.out[i];
    }
    mulFix.base[0] <== Dx;
    mulFix.base[1] <== Dy;

    component addM = BabyAdd();
    addM.x1 <== mulFix.out[0];
    addM.y1 <== mulFix.out[1];
    addM.x2 <== Mx;
    addM.y2 <== My;

    Ax  <== addM.xout;
    Ay  <== addM.yout;
}

component main {public [Dx, Dy, x]} = Vote();