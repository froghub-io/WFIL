require("hardhat-deploy")
require("hardhat-deploy-ethers")

const private_key = network.config.accounts[0]
const wallet = new ethers.Wallet(private_key, ethers.provider)

module.exports = async function ({deployments}) {
  console.log("Wallet Ethereum Address:", wallet.address)
  const {deploy} = deployments;

  //deploy WFIL
  const WFIL = await ethers.getContractFactory('WFIL', wallet);
  console.log('Deploying WFIL...');

  const wfil = await WFIL.deploy();
  await wfil.deployed()
  console.log('WFIL deployed to:', wfil.address);

}
module.exports.tags = ["WFIL"]
