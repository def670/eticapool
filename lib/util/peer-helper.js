


 
import TokenDataHelper from "./token-data-helper.js";
import Web3ApiHelper from "./web3-api-helper.js";
import LoggingHelper from "./logging-helper.js";

 
import web3utils from 'web3-utils'

export default class PeerHelper {


// ----------  Get Now time info (not blockchain but local using new Date() )  -----------  //

    //this is in seconds -- for now 
    static getTimeNowSeconds()
    {
      return Math.round((new Date()).getTime() / 1000);
    } 

    static getTimeNowUnix()
    {
      return Math.round((new Date()).getTime() );
    }
    
    // ----------  Get Now time info (not blockchain but local using new Date() )  -----------  //



    // ----------  Get Pool Minimum Difficulty and Pool Minimum Share Target from parameter object poolConfig -----------  //
    static getPoolMinimumShareDifficulty(poolConfig)
    {
      return  poolConfig.miningConfig.minimumShareDifficulty;
    } 


    static getPoolMinimumShareTarget( poolConfig ) //compute me
    { 
       let diff =   PeerHelper.getPoolMinimumShareDifficulty( poolConfig )
      
      return this.getTargetFromDifficulty(diff);
    } 

  // ----------  Get Pool Minimum Difficulty, Pool Minimum Share Target from parameter object poolConfig -----------  //


      
  // ----------  Hard: Get Pool Minimum Difficulty Hard and Pool Minimum Share Target from parameter object poolConfig -----------  //
      static getPoolMinimumShareDifficultyHard(poolConfig)
      {
        return  poolConfig.miningConfig.minimumShareDifficultyHard;
      } 
  
  
      static getPoolMinimumShareTargetHard( poolConfig ) //compute me
      { 
         let diff =   PeerHelper.getPoolMinimumShareDifficultyHard( poolConfig )
        
        return this.getTargetFromDifficulty(diff);
      } 
  
    // ----------  Hard: Get Pool Minimum Difficulty Hard, Pool Minimum Share Target from parameter object poolConfig -----------  //
 



   // ----------  Get Current Target from Difficulty -----------  //
    static getTargetFromDifficulty(difficulty)
    {
    
      var max_target = web3utils.toBN( 2 ).pow( web3utils.toBN( 224 ) ) ;
 
      var current_target = max_target.div( web3utils.toBN( difficulty) );
 
      return current_target ;
    } 
   // ----------  Get Current Target from Difficulty -----------  //
 

   
   // ----------  Get Pool Data (Token Fee, Minting address, Payment Address) -----------  //
   static   getPoolData(poolConfig)
    {
      return {
        tokenFee: this.poolConfig.poolTokenFee,
        mintingAddress: this.accountConfig.minting.address,
        paymentAddress: this.accountConfig.payment.address
      }
    } 
   // ----------  Get Pool Data (Token Fee, Minting address, Payment Address) -----------  //
    

    static getPoolEthAddress(poolConfig)
    {

      return poolConfig.mintingConfig.publicAddress

      
    } 

    
 
  // ---------  Get Balance of Payments of a specific Miner from Mongo DB ------------  //
    static async getMinerBalancePayments(minerAddress,  mongoInterface)
    { 
      var payments = await mongoInterface.findAllSortedWithLimit('balance_payments',{minerEthAddress: minerAddress.toString().toLowerCase()}, {block:-1} , 100)
   
      return payments

    }
   // ---------  Get Balance of Payments of a specific Miner from Mongo DB ------------  //



  // ---------  Get Details of challenges of a specific Miner from Mongo DB ------------  //
  static async getMinerChallengeDetails(minerAddress,  mongoInterface)
  { 
    
    var miningContracts = await mongoInterface.findAllSortedWithLimitonString('allminingContracts', {}, {epochCount:-1}, 10 );
    
    var challenges = [];
    for(let [index, oneminingcontract] of miningContracts.entries()){
      var challengedetails = {};
      challengedetails.miningcontract = oneminingcontract;
      challengedetails.miner_challengediff =  await mongoInterface.findOne('miner_challengediff', {challengeNumber: oneminingcontract.challengeNumber, minerEthAddress: minerAddress.toString().toLowerCase()});
      challengedetails.TotalDiffHard = await mongoInterface.findOne('totaldiff_challengenumber', {challengeNumber: oneminingcontract.challengeNumber, minerport: 8081}); 
      challengedetails.TotalDiffEasy = await mongoInterface.findOne('totaldiff_challengenumber', {challengeNumber: oneminingcontract.challengeNumber, minerport: 8080}); 

      challenges[index] = challengedetails;
    }

   return challenges
  }
  // ---------  Get Details of challenges of a specific Miner ------------  //


    // --------- Get Specific Miner or Create Miner if dont exist -------- //
    //this finds or creates miner data 
  static async getMinerData(minerEthAddress, mongoInterface)
  {
    
    if(minerEthAddress)
    {
      var minerData  = await mongoInterface.findOne("minerData", {minerEthAddress: minerEthAddress.toString().toLowerCase() } );

      if(minerData  == null)
      {
        let newMinerData =  PeerHelper.getDefaultMinerData(minerEthAddress)
        
        await mongoInterface.insertOne("minerData", newMinerData)

        
        return await mongoInterface.findOne("minerData", {minerEthAddress: minerEthAddress.toString().toLowerCase() } );

      }

      
       return minerData 
    }

     return null;

  } 
     // --------- Get Specific Miner or Create Miner if dont exist -------- //
 

    // -------  Returns Empty Object with structure of Miner fields to store in Mongo DB  -------- //
  static getDefaultMinerData(minerEthAddress){

    if(minerEthAddress == null) minerEthAddress = "0x0"; //this should not happen

    return {
      minerEthAddress: minerEthAddress.toString().toLowerCase(),
       shareCredits: 0,
      tokenBalance: 0, //what the pool owes currenc..deprecated
      alltimeTokenBalance: 0,  //total amt pool owes (total amt mined)
      tokensAwarded:0, //total amt added to balance payments !
      tokensReceived:0, //total amt confirmed and verified sent to miner !
   //   varDiff: 1, //default
       validSubmittedSolutionsCount: 0,
      lastSubmittedSolutionTime: 0
    }
  }
   // -------  Returns Empty Object with structure of Miner fields to store in Mongo DB  -------- //

   // -------  Returns Empty Object with hashrate field  -------- //
  static getDefaultSharesData(minerEthAddress){

    if(minerEthAddress == null) minerEthAddress = "0x0"; //this should not happen

    return {
      minerEthAddress: minerEthAddress.toString().toLowerCase(),
       shareCredits: 0,
      // varDiff: 1, //default
       validSubmittedSolutionsCount: 0,
       hashrate: 0
    }
  } 
   // -------  Returns Empty Object with hashrate field  -------- //

   
   // -------  Returns total totalShares by adding from all Miners  -------- //
  static async getTotalMinerShares(mongoInterface)
  {
    var allMinerData  = await PeerHelper.getMinerList(mongoInterface)
 


    var totalShares = 0;

    for(let minerData of  allMinerData)
    { 
      var minerShares = minerData.shareCredits;

      totalShares += minerShares;
    }

    //console.log('---- debug got miner total shares', totalShares)
    return totalShares;

  } 
   // -------  Returns total totalShares by adding from all Miners  -------- //

   // -------  Returns total totalHashrate by adding from all Miners  -------- //
  static async getTotalMinerHashrate(mongoInterface)
  {
    var allMinerData  = await PeerHelper.getMinerList(mongoInterface)
  
 
    var totalHashrate = 0;

    for(let minerData of  allMinerData)
    { 
         
       var hashrate = parseInt(minerData.hashRate)

      if(hashrate)
      {
        totalHashrate += hashrate;
      }

    }

    // console.log('---debug got miner total hashrate', totalHashrate)
    return totalHashrate;

  } 
   // -------  Returns total totalHashrate by adding from all Miners  -------- //


   // -------  Updates minerData fields shareCredits, validSubmittedSolutionsCount  -------- //
  static async awardShareCredits( minerEthAddress, shareCredits , mongoInterface)
  {


    let minerData = await PeerHelper.getMinerData(minerEthAddress, mongoInterface)

    await mongoInterface.updateOneCustom('minerData',{_id: minerData._id }, {$inc:{
      shareCredits: parseInt(shareCredits),
      validSubmittedSolutionsCount: 1 
    }} )
   
  } 
   // -------  Updates minerData fields shareCredits, validSubmittedSolutionsCount  -------- //
  

   // -------  Returns MinerShares from a specific Miner  -------- //
  static async getMinerShares(minerEthAddress, mongoInterface)
  {
    if(minerEthAddress)
    {
      minerEthAddress = minerEthAddress.toString().toLowerCase()


      var sharesData = await mongoInterface.findAllSortedWithLimit("miner_shares", {minerEthAddress: minerEthAddress}, {block:-1},100 );

      if(sharesData)
      {
         return  sharesData  ;
      }

      
    }

    return [] 

  }
   // -------  Returns MinerShares from a specific Miner  -------- //


      // -------  Returns MinerPreShares from a specific Miner  -------- //
  static async getMinerPreShares(minerEthAddress, mongoInterface)
  {
    if(minerEthAddress)
    {
      minerEthAddress = minerEthAddress.toString().toLowerCase()


      var sharesData = await mongoInterface.findAllSortedWithLimit("miner_pendingshares", {minerEthAddress: minerEthAddress}, {time:-1},100 );

      if(sharesData)
      {
         return  sharesData  ;
      }

      
    }

    return [] 

  }

  static async getLastMinerPreShare(minerEthAddress, mongoInterface)
  {
    if(minerEthAddress)
    {
      minerEthAddress = minerEthAddress.toString().toLowerCase()


      var sharesData = await mongoInterface.findAllSortedWithLimit("miner_pendingshares", {minerEthAddress: minerEthAddress}, {time:-1},1 );

      if(sharesData)
      {
         return  sharesData  ;
      }

      
    }

    return [] 

  }
   // -------  Returns MinerPreShares from a specific Miner  -------- //


   
  // -------  Updates alltimeTokenBalance field (with value tokenRewardAmt) for a specific Miner on Mongo DB -------- //
  static async awardTokensBalanceForShares( minerEthAddress, difficulty , totaldiff, minerport, poolConfig, mongoInterface)
  {

   var minerData = await PeerHelper.getMinerData(minerEthAddress,mongoInterface)
 
   //var sharesData = await PeerHelper.getSharesData(minerEthAddress,mongoInterface)
 
    //shareCredits is an int 
    let tokenRewardAmt = await PeerHelper.getTokenRewardForShareOfDifficulty(difficulty, totaldiff, minerport, poolConfig, mongoInterface)

     
    let tokensAwarded = Math.floor(  tokenRewardAmt );

    if(isNaN(tokensAwarded) || tokensAwarded == 0){
      LoggingHelper.appendLog( [ 'WARN: no tokens awardable for ',minerEthAddress, tokensAwarded ], LoggingHelper.TYPECODES.WARN , mongoInterface)

 
      return false 
    }
    
    await mongoInterface.updateOneCustom('minerData', {_id: minerData._id}, 
            {$inc:{alltimeTokenBalance: tokensAwarded}}   )

      LoggingHelper.appendLog( [ 'miner data - award tokenbalance ', minerEthAddress,tokensAwarded ], LoggingHelper.TYPECODES.SHARES, mongoInterface)

  } 
  // -------  Updates alltimeTokenBalance field (with value tokenRewardAmt) for a specific Miner on Mongo DB -------- //


    // -------  Increases total tokenreceived amount for a specific Miner on Mongo DB -------- //
    // ------- Function added to have a metric for total tokens sent by pool to miner address -------- //
    static async increaseTokensReceivedForMiner( minerEthAddress, balance_payment, mongoInterface)
    {
  
     var minerData = await PeerHelper.getMinerData(minerEthAddress,mongoInterface)

  
      let tokensReceived = minerData.tokensReceived;
  
      if(isNaN(tokensReceived)){
        //LoggingHelper.appendLog( [ 'WARN: no tokens awardable for ',minerEthAddress, tokensAwarded ], LoggingHelper.TYPECODES.WARN , mongoInterface)
        //console.log(' --debug-- setting tokensReceived to 0 for settup');
        tokensReceived = 0;
   
        //return false 
      }
  
      //console.log('  --debug--  updating minerData tokensReceived');
      await mongoInterface.updateOneCustom('minerData', {_id: minerData._id}, 
              {$inc:{tokensReceived: balance_payment.amountToPay}}   )
  
        LoggingHelper.appendLog( [ 'miner data - increased tokensReceived ', minerEthAddress,tokensReceived ], LoggingHelper.TYPECODES.SHARES, mongoInterface)
  
    } 
    // -------  Increases total tokenreceived amount for a specific Miner on Mongo DB -------- //



  

  /*
    This is multiplied by share credits (difficulty) to determine the number of tokens to reward
    This depends on:

    The difficulty of 0xbtc (avg 0xbtc per share)

    Less fees:      
    The estimated % of 0xbtc wasted on gas fees 

    
  */


  // -------  Returns netReward for specific miner based on its sharediff compared to totaldiff. taking into Bloackreward, account Pool fees and shareDiff and totalDifficulty  -------- //
  static async getTokenRewardForShareOfDifficulty(shareDiff, totalDiff, minerport, poolConfig, mongoInterface){

   // --> Now Gets total diff for this challenge number:
   // --> var totalDifficulty =  await  mongoInterface.findOne('totaldiff_challengenumber', {challengeNumber: challengeNumber}  );
   // --> totalDiff is totalDifficulty.totaldiff

    if(isNaN(totalDiff)){
      console.log('ERROR: totalDifficulty missing')
      return 0
    }


    let rewardFactor = PeerHelper.getRewardFactor(shareDiff,totalDiff)


    let totalBlockReward = await TokenDataHelper.getMiningReward(mongoInterface)
    if(isNaN(totalBlockReward)){
      console.log('ERROR: totalBlockReward missing')
      return 0
    }

    if(minerport == 8080){
      totalBlockReward = (totalBlockReward * 0) / 100; // low difficulty shares get 0% of rewards
    }
    /* commented since 2 ports system closed so totalBlockReward will be 100% for port 8081:
    if(minerport == 8081){
      totalBlockReward = (totalBlockReward * 85) / 100; // low difficulty shares get 85% of rewards
    } */

    let poolFeesMetrics = await PeerHelper.getPoolFeesMetrics(poolConfig, mongoInterface)
    let poolFeesFactor = poolFeesMetrics.overallFeeFactor

    //make pool fees factor above 0.005 
    if(poolFeesFactor < 0.005){
     poolFeesFactor = 0.005
    } 
   
    // max 10%
    if(poolFeesFactor > 0.10){
     poolFeesFactor = 0.10
    }

    let netBlockReward = totalBlockReward * PeerHelper.constrainToPercent(1.0 - poolFeesFactor) 

    let netReward = rewardFactor * netBlockReward; 

    // netreward can't be more than 30 eti per block, adding security in case of unexpected miscalculation. 
    // Never should this happen (unless one miner has almost all hashrate on the pool) but always good to have since otherwise could deplete mining pool funds
    if(netReward > 30000000000000000000){
      netReward = 30000000000000000000; // 30 eti
    }
    
    return netReward
  }
  // -------  Returns netReward for specific miner based on its sharediff compared to totaldiff. taking into Bloackreward, account Pool fees and shareDiff and totalDifficulty  -------- //


  //Just out of security but shareDiff / totalDiff  > 1 can't happen
  static getRewardFactor(shareDiff, totalDiff){
    return Math.min( ( shareDiff / totalDiff  ) , 1.0 ) 
  }
 

  // -------  Returns object with global Mining reward and Pool data  -------- //
  static async getPoolFeesMetrics(poolConfig, mongoInterface){

    let poolBaseFee = PeerHelper.constrainToPercent(poolConfig.mintingConfig.poolTokenFee / 100.0)

    let miningRewardRaw = await TokenDataHelper.getMiningReward(mongoInterface)
    let token_Eth_Price_Ratio = await TokenDataHelper.getMineableTokenToEthPriceRatio(mongoInterface)

    if(!token_Eth_Price_Ratio || token_Eth_Price_Ratio == 0){
      console.log('WARN: Missing price oracle for pool fees factor')
      return 1
    }

    const TOKEN_DECIMALS = 18 

    let miningRewardFormatted = Web3ApiHelper.rawAmountToFormatted(miningRewardRaw, TOKEN_DECIMALS) 

    let miningRewardInEth = (miningRewardFormatted * PeerHelper.constrainToPercent(token_Eth_Price_Ratio))

    let avgGasPriceGWei = 10
    
    const gasRequiredForMint = 94626
    const ethPerGWei = 0.000000001
    

    let ethRequiredForMint = gasRequiredForMint * avgGasPriceGWei * ethPerGWei

    
    //let gasFee = PeerHelper.constrainToPercent(ethRequiredForMint / miningRewardInEth);
    let gasFee = 0; // set gasFee to 0

    return  {
      poolBaseFee: poolBaseFee ,
      gasCostFee:gasFee,

      token_Eth_Price_Ratio: token_Eth_Price_Ratio, 

      miningRewardRaw: miningRewardRaw,
      miningRewardFormatted: miningRewardFormatted,  
      miningRewardInEth: miningRewardInEth, 

      avgGasPriceGWei: avgGasPriceGWei,
      miningRewardInEth: miningRewardInEth,
      ethRequiredForMint: ethRequiredForMint,
      overallFeeFactor: PeerHelper.constrainToPercent(poolBaseFee + gasFee) 

    }


  }
  // -------  Returns object with global Mining reward and Pool data  -------- //


  static constrainToPercent(x){
    return Math.min(Math.max(x,0), 1)
  }
   

  //this needs to use config adn oracles 
  static async getMaxGweiPriceUntilMiningSuspension(poolConfig, mongoInterface){
    return 100
  }
  
    // -------  Returns all Miners  -------- //
   static  async getMinerList( mongoInterface )
    {
        
        let minerData = await mongoInterface.findAll( "minerData", {} )
        
        return minerData;
 
    } 
   // -------  Returns all Miners  -------- //

     
    // -------  Returns all Shares  -------- //
    static  async getShareList( mongoInterface )
    {
        
        let minerShares = await mongoInterface.findAll( "miner_shares", {} )
        
        return minerShares;
 
    } 
   // -------  Returns all Shares  -------- //



       // -------  Returns all Pools  -------- //
       static  async getPoolList( poolConfig, mongoInterface )
       {
           
           let poolData = await mongoInterface.findAll( "network_pools", {} )

           let poolStatsRecord = await mongoInterface.findAllSortedWithLimit( "poolStatsRecords", {}, {recordedat:-1}, 1 );
           let _hashrate = 0;
           let _numberminers = 0;
           if(poolStatsRecord && poolStatsRecord.length > 0){
           _hashrate = poolStatsRecord[0].Hashrate;
           _numberminers = poolStatsRecord[0].Numberminers;
        }
        
        var poolInfo = {
         name: poolConfig.poolName,
         url: poolConfig.poolUrl,
         Hashrate: _hashrate,
         Numberminers: _numberminers,
         mintAddress: poolConfig.mintingConfig.publicAddress,
         poolserver:true,
        }
        poolData.push(poolInfo);
           
           return poolData;
    
       } 
      // -------  Returns all Pools  -------- //

      // -------  Returns all Pools mints addresses retrieved from network -------- //
      static  async getMintAddresses( mongoInterface )
      {
          
          let mintAddresses = await mongoInterface.findAll( "network_pools_addresses", {} )
          
          return mintAddresses;
   
      } 
     // -------  Returns all Pools mints addresses retrieved from network -------- //
   
        
       // -------  Returns all Mints  -------- //
       static  async getMintList( nbrecords, mongoInterface )
       {
    
        // max 100 to limit server cpu comsumption:
        if(nbrecords > 100){
          nbrecords = 100;
        }

           let alletiMints = await mongoInterface.findAllSortedWithLimitonString( "all_eti_mints", {}, {epochCount:-1}, nbrecords );
           
           return alletiMints;
    
       } 
      // -------  Returns all Mints  -------- //


    // --------  Returns Sharecredits (Math.floor(difficulty)) from Difficulty  ---------  // 
  static async getShareCreditsFromDifficulty(difficulty,shareIsASolution, minerport, poolConfig)
  {

    var minShareDifficulty;

    if(minerport == 8080){
      minShareDifficulty = PeerHelper.getPoolMinimumShareDifficulty(poolConfig)  ;  
    }
    else {
      minShareDifficulty = PeerHelper.getPoolMinimumShareDifficultyHard(poolConfig)  ;
    }

    const SOLUTION_FINDING_BONUS = 0

    if(shareIsASolution)//(difficulty >= miningDifficulty)
    {

     var amount = Math.floor( difficulty   ) ;
      

      amount += SOLUTION_FINDING_BONUS;
      return amount;

    }else if(difficulty >= minShareDifficulty)
    {

      var amount = Math.floor(  difficulty    ) ;
       
      return amount;
    }

    LoggingHelper.appendLog( [ 'no shares for this solve!!',difficulty,minShareDifficulty ], LoggingHelper.TYPECODES.WARN , mongoInterface)

 

    return 0;
  } 
   // --------  Returns Sharecredits (Math.floor(difficulty)) from Difficulty  ---------  //



  // --------  Stores minerEthAddress into DB  ---------  //
  static async saveMinerDataToRedisMongo(minerEthAddress, minerData, mongoInterface)
  {

    if(minerEthAddress == null) return;

    minerEthAddress = minerEthAddress.toString().toLowerCase()

    let result = await mongoInterface.upsertOne("minerData",{minerEthAddress: minerEthAddress},minerData)

    return result 
  } 
  // --------  Stores minerEthAddress into DB  ---------  //
  



     // -----  Returns Estimated Hashrate from (difficulty and timeToFindSeconds)  ---------- //
   static getEstimatedShareHashrate(difficulty, timeToFindSeconds )
   {

    // Prevents from returning hashrate equals 0 if solution found extrmly fast:
    if(timeToFindSeconds == 0){
      timeToFindSeconds = 1;
    }

     if(timeToFindSeconds!= null && timeToFindSeconds>0)
     {

        var hashrate = web3utils.toBN(difficulty).mul( web3utils.toBN(2).pow(  web3utils.toBN(22) )).div( web3utils.toBN( timeToFindSeconds ) )

        return hashrate.toNumber(); //hashes per second

      }else{
        return 0;
      }
   }
     // -----  Returns Estimated Hashrate from (difficulty and timeToFindSeconds)  ---------- // 










// ------------------  Added thanks to crnxhh --------------- //

     static async calculateMinerHashrateData(mongoInterface, poolConfig) {
         const HashRateCalculationPeriod = 60 * 60;  // 60 MINUTES
 
         var minerList = await PeerHelper.getMinerList( mongoInterface )
 
         const sharesDifficultySum = await PeerHelper.getMinerSharesDifficultySum(mongoInterface, (PeerHelper.getTimeNowSeconds() - HashRateCalculationPeriod))
         for (let minerData of minerList) {

             let minerTotalDifficulty = sharesDifficultySum.find(o => o._id === minerData.minerEthAddress);

             if (minerTotalDifficulty) {
                 let avgHashrate = web3utils.toBN(minerTotalDifficulty.difficulty).mul(web3utils.toBN(2).pow(web3utils.toBN(32))).div(web3utils.toBN(HashRateCalculationPeriod));
                 let convertedHashrate = avgHashrate.toNumber(); // MH unit
                 avgHashrate = parseInt((convertedHashrate).toFixed(6));
                 if (avgHashrate !== minerData.avgHashrate) {
                     var lastpreshareArray = await PeerHelper.getLastMinerPreShare(minerData.minerEthAddress, mongoInterface);
                     if(lastpreshareArray == null || lastpreshareArray.length<=0){
                      // Should never happen but just in case, If no lastpreshareArray it means skip this miner and continue loop
                      continue
                    }
                     await mongoInterface.updateOne('minerData', {_id: minerData._id}, {avgHashrate: avgHashrate, minerport: lastpreshareArray[0].minerport})
                 }
             } else if (minerData.avgHashrate !== 0) {
                 await mongoInterface.updateOne('minerData', {_id: minerData._id}, {avgHashrate: 0})
             }
 
         }
     }
     static async getMinerSharesDifficultySum(mongoInterface, unixTime) {
         let minerDifficultySum = await mongoInterface.aggregateOnCollection("miner_pendingshares",
             [{$match: {time: {$gt: unixTime}}},
                 {
                     $group:
                         {
                             _id: "$minerEthAddress",
                             difficulty: {$sum: "$difficulty"}
                         }
                 }
             ], {}
         )
 
 
         if (minerDifficultySum) {
             return minerDifficultySum;
         }
         return []
     }
     

// ------------------  Added thanks to crnxhh --------------- //




// ------------------  PoolStatsRecords --------------- //

static async calculatePoolhashrate(mongoInterface, poolConfig) {

  
  const poolHashrate = await PeerHelper.getPoolhashrate(mongoInterface)
  const poolNumberminers = await PeerHelper.getPoolnumberminers(mongoInterface)
  

  let newpoolrecord = {};

      if (poolHashrate) {
        // check if query result is format expected to avoid inserting query error data:
        if(poolHashrate[0]){
          newpoolrecord.Hashrate = poolHashrate[0].Hashrate;
        }
        else {
          newpoolrecord.Hashrate = 0;
        }
      }
      else {
        newpoolrecord.Hashrate = 0;
      }


      if (poolNumberminers > 0) {
        newpoolrecord.Numberminers = poolNumberminers;
      }
      else {
      newpoolrecord.Numberminers = 0;
      }
      
      newpoolrecord.recordedat = PeerHelper.getTimeNowSeconds();

      await mongoInterface.insertOne('poolStatsRecords', newpoolrecord);
}


static async getPoolhashrate(mongoInterface) {
  let poolHashrate = await mongoInterface.aggregateOnCollection("minerData",
      [ {
              $group:
                  {
                      _id: null,
                      Hashrate: {$sum: "$avgHashrate"}
                  }
        }
      ], {}
  )


  if (poolHashrate) {
      return poolHashrate;
  }
  return []
}


static async getPoolnumberminers(mongoInterface) {
  let numberMiners = await mongoInterface.countAll("minerData", {avgHashrate: {$gt: 0}});

  if (numberMiners) {
      return numberMiners;
  }
  return []
}


static  async getpoolStatsRecords( mongoInterface, nbrecords )
    {

        let poolStatsRecords = await mongoInterface.findAllSortedWithLimit( "poolStatsRecords", {}, {recordedat:-1}, nbrecords );
        
        return poolStatsRecords;
 
    }
    
// daytimestamp is timestamp of day start.(for instance for getting pool metrics of 02/11/2022, we need to pass timestamp of 02/11/2022 at 00:00 am)
static  async getpoolStatsRecordsofDay( mongoInterface, daytimestamp )
    {

        let enddaytimestamp = daytimestamp + 86400;
        // 86400 seconds in a day and metrics saved every 10 minutes => 144 records per day: 
        let poolStatsRecords = await mongoInterface.findAllSortedWithLimit( "poolStatsRecords", {recordedat: {$gte:daytimestamp, $lte:enddaytimestamp}}, {recordedat:-1}, 144 );
        
        return poolStatsRecords;
 
    }


// ------------------  PoolStatsRecords --------------- //


     // -----  Returns Estimated Hashrate from (MinerAddress)  ---------- //   
  static async estimateMinerHashrate(minerAddress, mongoInterface)
   {

      try {

        var submitted_shares = await PeerHelper.getSharesData(minerAddress, mongoInterface)

        if(submitted_shares == null || submitted_shares.length < 1)
        {
         // console.log('no submitted shares')
          return 0;
        }

        //need to use BN for totalDiff

        var totalDiff = web3utils.toBN(0);
        var CUTOFF_MINUTES = 90;
        var cutoff = PeerHelper.getTimeNowSeconds() - (CUTOFF_MINUTES * 60);

        // the most recent share seems to be at the front of the list
        var recentShareCount = 0;
        while (recentShareCount < submitted_shares.length && submitted_shares[recentShareCount].time > cutoff) {

          var diffDelta = submitted_shares[recentShareCount].difficulty;

          if(isNaN(diffDelta)) diffDelta = 0;

          totalDiff = totalDiff.add(  web3utils.toBN(diffDelta) );
          recentShareCount++;
        }

        if ( recentShareCount == 0 )
        {
        //  console.log('no recent submitted shares')
          return 0;
        }


        //console.log('miner recent share count: ', recentShareCount )
        var seconds = submitted_shares[0].time - submitted_shares[recentShareCount - 1].time;
        if (seconds == 0)
        {
          console.log('shares have no time between')
          return 0;
        }

        //console.log('hashrate calc ', totalDiff, seconds )
        var hashrate = PeerHelper.getEstimatedShareHashrate( totalDiff, seconds );
        return hashrate.toString();

      } catch(err)
      {
        console.log('Error in peer-interface::estimateMinerHashrate: ',err);
        return 0;
      }
  } 
  // -----  Returns Estimated Hashrate from (MinerAddress)  ---------- //

  //timeToFind
  // -----  Returns Average Time to find Solution from (MinerAddress)  ---------- //
  static async getAverageSolutionTime(minerAddress, mongoInterface)
  {
    if(minerAddress == null) return null;

    var submitted_shares =  await this.redisInterface.getRecentElementsOfListInRedis(('miner_submitted_share:'+minerAddress.toString().toLowerCase()), 3)

    var sharesCount = 0;

    if(submitted_shares == null || submitted_shares.length < 1)
    {
      return null;
    }


    var summedFindingTime  = 0;

    for (var i=0;i<submitted_shares.length;i++)
    {
      var share = submitted_shares[i];

      var findingTime = parseInt(share.timeToFind);

      if(!isNaN(findingTime) && findingTime> 0 && findingTime != null)
      {
          summedFindingTime += findingTime;
            sharesCount++;
       }
    }

    if(sharesCount <= 0)
    {
      return null;
    }


    var timeToFind = Math.floor(summedFindingTime / sharesCount);
    return timeToFind;
  } 
  // -----  Returns Average Time to find Solution from (MinerAddress)  ---------- //


  // -----  Check balanceTransfer.confirmed (for a paymentId)  ---------- //
   static async getBalanceTransferConfirmed(paymentId, mongoInterface)
   {
      //check balance payment

      var balanceTransferJSON = await this.redisInterface.findHashInRedis('balance_transfer',paymentId);
      var balanceTransfer = JSON.parse(balanceTransferJSON)


      if(balanceTransferJSON == null || balanceTransfer.txHash == null)
      {
        return false;
      }else{

        //dont need to check receipt because we wait many blocks between broadcasts - enough time for the monitor to populate this data correctly
        return balanceTransfer.confirmed;

      }


   } 
  // -----  Check balanceTransfer.confirmed (for a paymentId)  ---------- //


  // -----  Save submited Solution  ---------- //
   static  async saveSubmittedSolutionTransactionData(tx_hash,transactionData, mongoInterface)
     {
        await this.redisInterface.storeRedisHashData('submitted_solution_tx',tx_hash,JSON.stringify(transactionData) )
        await this.redisInterface.pushToRedisList('submitted_solutions_list',JSON.stringify(transactionData) )

     } 
  // -----  Save submited Solution  ---------- //

  // -----  Get saved submited Solution  ---------- //
     static async loadStoredSubmittedSolutionTransaction(tx_hash, mongoInterface )
   {
      var txDataJSON = await this.redisInterface.findHashInRedis('submitted_solution_tx',tx_hash);
      var txData = JSON.parse(txDataJSON)
      return txData
   } 
  // -----  Check balanceTransfer.confirmed (for a paymentId)  ---------- //


}
