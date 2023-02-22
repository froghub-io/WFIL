require("hardhat-deploy")
require("hardhat-deploy-ethers")
require('hardhat-gas-reporter')
require("@nomiclabs/hardhat-waffle");
require("./tasks")
require("dotenv").config()
require('solidity-coverage')

const PRIVATE_KEY = process.env.PRIVATE_KEY
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: '0.7.6',
        settings: {
            optimizer: {
                enabled: true,
                runs: 20000,
            },
        },
    },
    defaultNetwork: "hardhat",
    networks: {
        hyperspace: {
            chainId: 3141,
            url: "https://api.hyperspace.node.glif.io/rpc/v1",
            accounts: [PRIVATE_KEY],
        },
    },
    paths: {
        sources: './contracts',
        tests: './test',
        cache: './cache',
        coverage: './coverage',
        coverageJson: './coverage.json',
        artifacts: './artifacts',
    },
    gasReporter: {
        enabled: true,
    },
}
