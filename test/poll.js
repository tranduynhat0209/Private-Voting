const { expect } = require("chai");
const poll = require("../scripts/poll");
const { utils } = require("ffjavascript");
describe("poll script", () => {
    it("test", async () => {
        const pr = new poll();
        await pr.generateKeyPair();
        let F = pr.babyJub.F;
        let zero = [F.e("0"), F.e("1")];
        //console.log(pr.F);

        ///// vote
        let totalGamma = zero;
        let totalDelta = zero;
        let x1 = Math.floor(Math.random() * 1000);
        let x2 = Math.floor(Math.random() * 1000);
        let vote1 = pr.vote(x1);
        let vote2 = pr.vote(x2);
        totalGamma = pr.babyJub.addPoint(totalGamma, vote1.gamma);
        totalDelta = pr.babyJub.addPoint(totalDelta, vote1.delta);
        totalGamma = pr.babyJub.addPoint(totalGamma, vote2.gamma);
        totalDelta = pr.babyJub.addPoint(totalDelta, vote2.delta);

        expect(x1 + x2).equal(pr.findTotalVote(2000, [totalGamma[0], totalGamma[1], totalDelta[0], totalDelta[1]]))
    })
})