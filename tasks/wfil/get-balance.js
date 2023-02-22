task(
  "get-balance",
  "Calls the WFIL contract to read the amount of WFILs owned by the account."
)
  .addParam("contract", "The address the WFIL contract")
  .addParam("account", "The address of the account you want the balance for")
  .setAction(async (taskArgs) => {
      //store taskargs as useable variables
      const contractAddr = taskArgs.contract
      const account = taskArgs.account
      const networkId = network.name
      console.log("Reading WFIL owned by", account, "on network", networkId)
      
      //create a new wallet instance
      const wallet = new ethers.Wallet(network.config.accounts[0], ethers.provider)

      //create a SimpleCoin contract factory
      const WFIL = await ethers.getContractFactory("WFIL", wallet)
      //Create a SimpleCoin contract instance 
      //This is what we will call to interact with the contract
      const wfil = await WFIL.attach(contractAddr)
       
      //Call the getBalance method 1
      let result = BigInt(await wfil.balanceOf(account)).toString()
      console.log("Amount of WFIL owned by", account, "is", result)

      let totalSupply = await wfil.totalSupply()
      console.log("total supply of WFIL is", totalSupply.toString())


      // await wfil.deposit({ from: wallet.address, value: 1 })


      result = BigInt(await wfil.balanceOf(account)).toString()
      console.log("Amount of WFIL owned by", account, "is", result)

  })
