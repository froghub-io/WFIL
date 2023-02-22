const {loadFixture} = require("@nomicfoundation/hardhat-network-helpers");
const {expect} = require("chai");
// const {ethers} = require("hardhat");
const {BigNumber} = require("ethers");
const {signERC2612Permit} = require('eth-permit')

const MAX = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

describe("WFIL", () => {
    ////deploy WFIL
    async function deployWFILFixture() {
        const WFIL = await ethers.getContractFactory("WFIL");
        const [owner, user1, user2, user3] = await ethers.getSigners();
        const wfil = await WFIL.deploy();
        await wfil.deployed();
        // Fixtures can return anything you consider useful for your tests
        return {WFIL, wfil, owner, user1, user2, user3};
    }

    it("Should set the right name", async () => {
        const {wfil} = await loadFixture(deployWFILFixture);

        let name = await wfil.name()
        expect(name).to.equal("Wrapped Filecoin");
    });

    it('Should be able to deposit filecoin', async () => {
        const {wfil, user1} = await loadFixture(deployWFILFixture);

        const initialBalance = await wfil.balanceOf(user1.address)

        await wfil.connect(user1).deposit({value: 1})
        const balance = await wfil.balanceOf(user1.address)

        expect(balance).to.equal(initialBalance.add(BigNumber.from(1)));
    })

    it('Should be deposits filecoin using the legacy method', async () => {
        const {wfil, user1} = await loadFixture(deployWFILFixture);

        const initialBalance = await wfil.balanceOf(user1.address)
        await user1.sendTransaction({to: wfil.address, value: 1})
        const balance = await wfil.balanceOf(user1.address)

        expect(balance).to.equal(initialBalance.add(BigNumber.from(1)).toString())
    })

    it('Should be deposits filecoin to another account', async () => {
        const {wfil, user1, user2} = await loadFixture(deployWFILFixture);

        const initialBalance = await wfil.balanceOf(user2.address)
        await wfil.connect(user1).depositTo(user2.address, {value: 1})
        const balance = await wfil.balanceOf(user2.address)
        expect(balance).to.equal(initialBalance.add(BigNumber.from(1)).toString())
    })

    it('Should be deposits with depositToAndCall', async () => {
        const {wfil, user1} = await loadFixture(deployWFILFixture);

        const TestTransferReceiver = await ethers.getContractFactory("TestTransferReceiver");
        const testTransferReceiver = await TestTransferReceiver.deploy();
        await testTransferReceiver.deployed();

        const tx = await wfil.connect(user1).depositToAndCall(testTransferReceiver.address, '0x11', {value: 1})

        expect(tx).to.emit(testTransferReceiver, 'TransferReceived')
            .withNamedArgs({
                token: wfil.address,
                sender: user1.address,
                value: '1',
                data: '0x11'
            });
    })

    describe("With a positive balance", function () {

        // deployWFILFixture with a positive balance
        async function WithPositiveBalance() {
            const {WFIL, wfil, owner, user1, user2, user3} = await deployWFILFixture();
            await wfil.connect(user1).deposit({value: 10})
            return {WFIL, wfil, owner, user1, user2, user3};
        }

        it('Should be returns the filecoin balance as total supply', async () => {
            const {wfil} = await loadFixture(WithPositiveBalance);

            const totalSupply = await wfil.totalSupply()
            expect(totalSupply).to.equal(10);
        })

        it('Should be possible to withdraw filecoin', async () => {
            const {wfil, user1} = await loadFixture(WithPositiveBalance);

            const initialBalance = await wfil.balanceOf(user1.address)
            await wfil.connect(user1).withdraw(1)
            const balance = await wfil.balanceOf(user1.address)

            expect(balance).to.equal(initialBalance.sub(BigNumber.from(1)));
        })

        it('Should be possible to withdraws filecoin to another account', async () => {
            const {wfil, user1, user2} = await loadFixture(WithPositiveBalance);

            const fromBalanceBefore = await wfil.balanceOf(user1.address)
            const toBalanceBefore = BigNumber.from(await user2.getBalance())

            await wfil.connect(user1).withdrawTo(user2.address, 1)

            const fromBalanceAfter = await wfil.balanceOf(user1.address)
            const toBalanceAfter = BigNumber.from(await user2.getBalance())

            expect(fromBalanceAfter).to.equal(fromBalanceBefore.sub(BigNumber.from(1)))
            expect(toBalanceAfter).to.equal(toBalanceBefore.add(BigNumber.from(1)))
        })

        it('Should not withdraw beyond balance', async () => {
            const {wfil, user1, user2} = await loadFixture(WithPositiveBalance);

            await expect(wfil.connect(user1).withdraw(100)).to.be.revertedWith('WFIL: burn amount exceeds balance');
            await expect(wfil.connect(user1).withdrawTo(user2.address, 100)).to.be.revertedWith('WFIL: burn amount exceeds balance');
            await expect(wfil.connect(user1).withdrawFrom(user1.address, user2.address, 100)).to.be.revertedWith('WFIL: burn amount exceeds balance');
        })

        it('Should be possible to transfers filecoin', async () => {
            const {wfil, user1, user2} = await loadFixture(WithPositiveBalance);

            const initialBalance = await wfil.balanceOf(user2.address)
            await wfil.connect(user1).transfer(user2.address, 1)
            const balance = await wfil.balanceOf(user2.address)

            expect(balance).to.equal(initialBalance.add(BigNumber.from(1)))
        })

        it('Should be possible to withdraws filecoin by transferring to address(0)', async () => {
            const {wfil, user1, user2} = await loadFixture(WithPositiveBalance);

            const initialBalance = await wfil.balanceOf(user1.address)
            await wfil.connect(user1).transfer('0x0000000000000000000000000000000000000000', 1)
            const balance = await wfil.balanceOf(user1.address)

            expect(balance).to.equal(initialBalance.sub(BigNumber.from(1)))
        })

        it('Should be possible to transfers filecoin using transferFrom', async () => {
            const {wfil, user1, user2} = await loadFixture(WithPositiveBalance);

            const initialBalance = await wfil.balanceOf(user2.address)
            await wfil.connect(user1).transferFrom(user1.address, user2.address, 1)
            const balance = await wfil.balanceOf(user2.address)

            expect(balance).to.equal(initialBalance.add(BigNumber.from(1)))
        })

        it('Should be possible to withdraws filecoin by transferring from someone to address(0)', async () => {
            const {wfil, user1, user2} = await loadFixture(WithPositiveBalance);

            const initialBalance = await wfil.balanceOf(user1.address)
            await wfil.connect(user1).transferFrom(user1.address, '0x0000000000000000000000000000000000000000', 1)
            const balance = await wfil.balanceOf(user1.address)

            expect(balance).to.equal(initialBalance.sub(BigNumber.from(1)))
        })

        it('Should be possible to transfers with transferAndCall', async () => {
            const {wfil, user1} = await loadFixture(WithPositiveBalance);

            const TestTransferReceiver = await ethers.getContractFactory("TestTransferReceiver");
            const testTransferReceiver = await TestTransferReceiver.deploy();
            await testTransferReceiver.deployed();

            const tx = await wfil.connect(user1).transferAndCall(testTransferReceiver.address, 1, '0x11')

            expect(tx).to.emit(testTransferReceiver, 'TransferReceived')
                .withNamedArgs({
                    token: wfil.address,
                    sender: user1.address,
                    value: '1',
                    data: '0x11'
                });
        })

        it('Should not transfer and call to zero address', async () => {
            const {wfil, user1} = await loadFixture(WithPositiveBalance);

            const receiver = '0x0000000000000000000000000000000000000000'
            expect(wfil.connect(user1).transferAndCall(receiver, 100, '0x11')).to.be.reverted;
        })

        it('Should not transfer beyond balance', async () => {
            const {wfil, user1, user2} = await loadFixture(WithPositiveBalance);

            await expect(wfil.connect(user1).transfer(user2.address, 100)).to.be.revertedWith('WFIL: transfer amount exceeds balance')
            await expect(wfil.connect(user1).transferFrom(user1.address, user2.address, 100))
                .to.be.revertedWith('WFIL: transfer amount exceeds balance')

            const TestTransferReceiver = await ethers.getContractFactory("TestTransferReceiver");
            const testTransferReceiver = await TestTransferReceiver.deploy();
            await testTransferReceiver.deployed();
            await expect(wfil.connect(user1).transferAndCall(testTransferReceiver.address, 100, '0x11'))
                .to.be.revertedWith('WFIL: transfer amount exceeds balance')
        })

        it('Should be possible to approves to increase allowance', async () => {
            const {wfil, user1, user2} = await loadFixture(WithPositiveBalance);

            const initialAllowance = await wfil.allowance(user1.address, user2.address)
            await wfil.connect(user1).approve(user2.address, 1)
            const allowance = await wfil.allowance(user1.address, user2.address)

            expect(allowance).to.equal(initialAllowance.add(BigNumber.from(1)))
        })

        it('Should be possible to approves with approveAndCall', async () => {
            const {wfil, user1} = await loadFixture(WithPositiveBalance);

            const TestTransferReceiver = await ethers.getContractFactory("TestTransferReceiver");
            const testTransferReceiver = await TestTransferReceiver.deploy();
            await testTransferReceiver.deployed();

            const tx = await wfil.connect(user1).approveAndCall(testTransferReceiver.address, 1, '0x11')

            expect(tx).to.emit(testTransferReceiver, 'ApprovalReceived')
                .withNamedArgs({
                    token: wfil.address,
                    spender: user1.address,
                    value: 1,
                    data: '0x11'
                });
        })

        it('Should be possible to approves to increase allowance with permit', async () => {
            const {wfil, owner, user1, user2} = await loadFixture(WithPositiveBalance);

            const permitResult = await signERC2612Permit(owner, wfil.address, user1.address, user2.address, '1')
            await wfil.permit(user1.address, user2.address, '1', permitResult.deadline, permitResult.v, permitResult.r, permitResult.s)
            const allowance = await wfil.allowance(user1.address, user2.address)

            expect(allowance).to.equal(BigNumber.from(1))
        })

        it('Should not approve with expired permit', async () => {
            const {wfil, owner, user1, user2} = await loadFixture(WithPositiveBalance);

            const permitResult = await signERC2612Permit(owner, wfil.address, user1.address, user2.address, '1')
            await expect(wfil.permit(user1.address, user2.address, '1', 0, permitResult.v, permitResult.r, permitResult.s))
                .to.be.revertedWith('WFIL: Expired permit')
        })

        it('Should not approve with invalid permit', async () => {
            const {wfil, owner, user1, user2} = await loadFixture(WithPositiveBalance);

            const permitResult = await signERC2612Permit(owner, wfil.address, user1.address, user2.address, '1')
            await expect(wfil.permit(user1.address, user2.address, '2', permitResult.deadline, permitResult.v, permitResult.r, permitResult.s))
                .to.be.revertedWith('WFIL: invalid permit')
        })

        describe('With a positive allowance', async () => {
            // deployWFILFixture with a positive allowance
            async function WithPositiveAllowance() {
                const {WFIL, wfil, owner, user1, user2, user3} = await WithPositiveBalance();
                await wfil.connect(user1).approve(user2.address, 1)
                return {WFIL, wfil, owner, user1, user2, user3};
            }

            it('Should be possible to transfers filecoin using transferFrom and allowance', async () => {
                const {wfil, user1, user2} = await loadFixture(WithPositiveAllowance);

                const initialBalance = await wfil.balanceOf(user2.address)
                await wfil.connect(user2).transferFrom(user1.address, user2.address, 1)
                const balance = await wfil.balanceOf(user2.address)

                expect(balance).to.equal(initialBalance.add(BigNumber.from(1)))
            })

            it('Should not transfer beyond allowance', async () => {
                const {wfil, user1, user2} = await loadFixture(WithPositiveAllowance);

                await expect(wfil.connect(user2).transferFrom(user1.address, user2.address, 2))
                    .to.be.revertedWith('WFIL: request exceeds allowance')
            })

            it('Should be withdraws filecoin using withdrawFrom and allowance', async () => {
                const {wfil, user1, user2, user3} = await loadFixture(WithPositiveAllowance);

                const fromBalanceBefore = await wfil.balanceOf(user1.address)
                const toBalanceBefore = BigNumber.from(await user3.getBalance())

                await wfil.connect(user2).withdrawFrom(user1.address, user3.address, 1)

                const fromBalanceAfter = await wfil.balanceOf(user1.address)
                const toBalanceAfter = BigNumber.from(await user3.getBalance())

                expect(fromBalanceAfter).to.equal(fromBalanceBefore.sub(BigNumber.from(1)))
                expect(toBalanceAfter).to.equal(toBalanceBefore.add(BigNumber.from(1)))
            })

            it('Should not withdraw beyond allowance', async () => {
                const {wfil, user1, user2, user3} = await loadFixture(WithPositiveAllowance);

                await expect(wfil.connect(user2).withdrawFrom(user1.address, user3.address, 2))
                    .to.be.revertedWith('WFIL: request exceeds allowance')
            })
        });

        describe('With a maximum allowance', async () => {
            // deployWFILFixture with a maximum allowance
            async function WithMaximumAllowance() {
                const {WFIL, wfil, owner, user1, user2, user3} = await WithPositiveBalance();
                await wfil.connect(user1).approve(user2.address, MAX)
                return {WFIL, wfil, owner, user1, user2, user3};
            }

            it('Should does not decrease allowance using transferFrom', async () => {
                const {wfil, user1, user2, user3} = await loadFixture(WithMaximumAllowance);

                await wfil.connect(user2).transferFrom(user1.address, user2.address, 1)
                const allowance = await wfil.allowance(user1.address, user2.address)

                expect(allowance).to.equal(MAX)
            })

            it('Should does not decrease allowance using withdrawFrom', async () => {
                const {wfil, user1, user2, user3} = await loadFixture(WithMaximumAllowance);

                await wfil.connect(user2).withdrawFrom(user1.address, user2.address, 1)
                const allowance = await wfil.allowance(user1.address, user2.address)

                expect(allowance).to.equal(MAX)
            })
        })
    });


});