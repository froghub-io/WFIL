task(
  "total-supply",
  "Call the WFIL contract to read the total supply"
)
  .addParam("contract", "The address the WFIL contract")
  .setAction(async (taskArgs) => {
      //store taskargs as useable variables
      const contractAddr = taskArgs.contract
      const networkId = network.name
      console.log("Reading WFIL total supply on network", networkId)
      
      //create a new wallet instance
      const wallet = new ethers.Wallet(network.config.accounts[0], ethers.provider)

      //create a SimpleCoin contract factory
      const WFIL = await ethers.getContractFactory("WFIL", wallet)
      //Create a SimpleCoin contract instance 
      //This is what we will call to interact with the contract
      const wfil = await WFIL.attach(contractAddr)
       
      //Call the totalSupply method 
      let totalSupply = await wfil.totalSupply()
      console.log("total supply of WFIL is", totalSupply.toString())

  })
