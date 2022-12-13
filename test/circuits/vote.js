const snarkjs = require("snarkjs");
const path = require("path");
const assert = require("assert");

describe("test", async () => {
    it("test circom", async () => {
        for (var itest = 0; itest <= 10; itest++) {
            let x, r, g, h, D, kX, kR, X, sign;
            let p = BigInt(
                "21888242871839275222246405745257275088548364400416034343698204186575808495617"
            );
            x = BigInt(Math.floor(Math.random() * 1000000 + 2));
            sign = BigInt(Math.floor(Math.random() * 10) % 2);
            sign = 0;
            X = x + BigInt(12);
            r = BigInt(Math.floor(Math.random() * 1000000 + 2));
            g = BigInt(Math.floor(Math.random() * 1000000 + 2));
            h = BigInt(Math.floor(Math.random() * 1000000 + 2));
            D = BigInt(Math.floor(Math.random() * 1000000 + 2));
            kX = BigInt(Math.floor(Math.random() * 1000000 + 2));
            kR = BigInt(Math.floor(Math.random() * 1000000 + 2));


            var { proof, publicSignals } = await snarkjs.groth16.fullProve(
                {
                    xFake: x,
                    sign: sign,
                    X: X,
                    r: r,
                    g: g,
                    h: h,
                    D: D,
                    kX: kX,
                    kR: kR,
                },
                path.join("circuits", "vote.wasm"),
                path.join("circuits", "vote.zkey")

            );
            let mod = BigInt(
                "21888242871839275222246405745257275088548364400416034343698204186575808495617"
            );
            let valueee;
            let x2;
            if (sign == 1) {
                valueee = (power(g, x) * power(h, r)) % mod;
                x2 = x;
            } else {
                valueee = (power(g, mod - x - BigInt(1)) * power(h, r)) % mod;
                x2 = mod - x;
            }
            console.log(1);
            assert.equal(publicSignals[0], valueee);
            assert.equal(publicSignals[1], power(g, kX) % mod);
            assert.equal(publicSignals[2], (x2 * power(D, kX)) % mod);
            assert.equal(publicSignals[3], power(g, kR));
            assert.equal(publicSignals[4], (r * power(D, kR)) % mod);
            assert.equal(publicSignals[5], X);
            assert.equal(publicSignals[6], g);
            assert.equal(publicSignals[7], h);
            assert.equal(publicSignals[8], D);
            console.log("test random", itest, " is ok!");
        }
    })

})


const mod = BigInt(
    "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);
const power = (base, exponent) => {
    var res = BigInt(1);
    base = BigInt(base);
    exponent = BigInt(exponent);
    for (var i = 0; i < 255; i++) {
        if ((exponent >> BigInt(i)) & BigInt(1)) res = (res * base) % mod;
        base = (base * base) % mod;
    }
    return res;
};