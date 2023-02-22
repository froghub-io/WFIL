const {loadFixture} = require("@nomicfoundation/hardhat-network-helpers");
const {expect} = require("chai");
// const {ethers} = require("hardhat");
const {BigNumber} = require("ethers");

const MAX = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

describe("WFIL - Flash Minting", () => {
    ////deploy WFIL
    async function deployFixture() {
        //deploy WFIL
        const WFIL = await ethers.getContractFactory("WFIL");
        const [owner, user1, user2, user3] = await ethers.getSigners();
        const wfil = await WFIL.deploy();
        await wfil.deployed();

        //deploy TestFlashLender
        const TestFlashLender = await ethers.getContractFactory("TestFlashLender");
        const flash = await TestFlashLender.deploy();
        await flash.deployed();

        // Fixtures can return anything you consider useful for your tests
        return {wfil, flash, owner, user1, user2, user3};
    }

    it('Should do a simple flash mint', async () => {
        const {wfil, flash, user1} = await loadFixture(deployFixture);

        await flash.connect(user1).flashLoan(wfil.address, 1)

        const balanceAfter = await wfil.balanceOf(user1.address)
        expect(balanceAfter).to.equal(BigNumber.from(0))

        const flashBalance = await flash.flashBalance()
        expect(flashBalance).to.equal(BigNumber.from(1))

        const flashValue = await flash.flashValue()
        expect(flashValue).to.equal(BigNumber.from(1))

        const flashSender = await flash.flashSender()
        expect(flashSender).to.equal(flash.address)
    })

    it('Should cannot flash mint beyond the total supply limit', async () => {
        const {wfil, flash, user1} = await loadFixture(deployFixture);

        await expect(flash.connect(user1).flashLoan(wfil.address, BigNumber.from(MAX)))
            .to.be.revertedWith('WFIL: individual loan limit exceeded')
    })

    it('Should be return funds after a flash mint', async () => {
        const {wfil, flash, owner} = await loadFixture(deployFixture);

        await expect(flash.connect(owner).flashLoanAndSteal(wfil.address, 1))
            .to.be.revertedWith('WFIL: request exceeds allowance')
    })

    it('Should do two nested flash loans', async () => {
        const {wfil, flash, owner} = await loadFixture(deployFixture);

        await flash.connect(owner).flashLoanAndReenter(wfil.address, 1)

        const flashBalance = await flash.flashBalance()
        expect(flashBalance).to.equal('3')
    })

    describe('With a non-zero WFIL supply', () => {
        // deployWFILFixture with non-zero WFIL supply
        async function WithNonZeroSupply() {
            const {wfil, flash, owner, user1, user2, user3} = await deployFixture();
            await wfil.connect(owner).deposit({value: 10})
            return {wfil, flash, owner, user1, user2, user3};
        }

        it('Should flash mint, withdraw & deposit', async () => {
            const {wfil, flash, owner} = await loadFixture(WithNonZeroSupply);

            await flash.connect(owner).flashLoanAndWithdraw(wfil.address, 1)

            const flashBalance = await flash.flashBalance()
            expect(flashBalance).to.equal('1')
        })
    })
});