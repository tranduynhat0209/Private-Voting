pragma circom 2.0.0;

template Pedersen() {
    signal input x;
    signal input r;
    signal input g;
    signal input h;
    signal input D;
    signal input kX;
    signal input kR;

    signal output ped;
    signal output gammaX;
    signal output deltaX;
    signal output gammaR;
    signal output deltaR;


    // encrypt pedersen g^x * h^r
    component pow1 = Power(256);
    component pow2 = Power(256);
    pow1.a <== g;
    pow1.x <== x;
    pow2.a <== h;
    pow2.x <== r;
    ped <== pow1.out * pow2.out; 

    //encrypt Elgamal 

    component pow3 = Power(256);
    pow3.a <== g;
    pow3.x <== kX;
    gammaX <== pow3.out;

    component pow4 = Power(256);
    pow4.a <== D;
    pow4.x <== kX;
    deltaX <== x * pow4.out;

    component pow5 = Power(256);
    pow5.a <== g;
    pow5.x <== kR;
    gammaR <== pow5.out;

    component pow6 = Power(256);
    pow6.a <== D;
    pow6.x <== kR;
    deltaR <== r * pow6.out;
}


template Power(n) {
    signal input a;
    signal input x;
    signal bit[n];
    signal output out;
    signal result[n+1];
    var lc1=0;
    var e2=1;
    var e3;
    signal mu[n];
    mu[0] <== a;
    for (var i=1;i<n;i++) {
        mu[i] <== mu[i-1]**2;
    }

    result[0] <-- 1;
    for (var i = 0; i<n; i++) {
        bit[i] <-- (x >> i) & 1;
        bit[i] * (bit[i] -1) === 0;
        lc1 += bit[i] * e2;
        if ((x>>i) &1) {
            e3 = bit[i] * mu[i];
        } else {
            e3 = 1;
        }
        result[i+1] <-- result[i] * e3;
        e2 = e2+e2;
    }
    lc1 === x;
    out <== result[n];   
}
component main{public [g, h, D]}= Pedersen();