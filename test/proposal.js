const { expect } = require("chai");
const proposal = require("../scripts/proposal");
const { utils } = require("ffjavascript");
describe("proposal", () => {
    it("vote and counting", async () => {
        const pr = new proposal();
        await pr.generateKeyPair();
        let F = pr.babyJub.F;
        let zero = [F.e("0"), F.e("1")];
        //console.log(pr.F);
        console.log(utils.stringifyFElements(pr.babyJub.F, zero[0]));
        console.log(utils.stringifyFElements(pr.babyJub.F, zero[1]));
        ///// vote
        let totalGamma = zero;
        let totalBeta = zero;
        let x1 = Math.floor(Math.random() * 1000);
        let x2 = Math.floor(Math.random() * 1000);
        let vote1 = pr.vote(x1);
        let vote2 = pr.vote(x2);
        totalGamma = pr.babyJub.addPoint(totalGamma, vote1.gamma);
        totalBeta = pr.babyJub.addPoint(totalBeta, vote1.beta);
        totalGamma = pr.babyJub.addPoint(totalGamma, vote2.gamma);
        totalBeta = pr.babyJub.addPoint(totalBeta, vote2.beta);

        expect(x1 + x2).equal(pr.findTotalVote(2000, totalGamma, totalBeta))
    })
})