<template>

<div>



 
        <Navbar />
     

   <div class="section bg-slate-etica slate-min-height-65 text-white  pb-8">
     <div class="w-container pt-8">

       
 

      <h1 class="title font-primary-title color-primary mb-4">
        Pool Overview
      </h1>
      

      
      <HorizontalNav 
          class="mb-8"
         v-bind:activeSection="activeSection" 
         v-bind:activeColor="'green'" 
         v-bind:buttonClickedCallback="onHorizontalNavClicked" 
         v-bind:buttonNamesArray="['Mining Data','Pool Status','Recent Transactions' ]"
   
       />
        



        <div v-if="poolData && poolStatus && activeSection=='Mining Data'"  class="overflow-x-auto mb-4">
            <div class="my-4">
            <div v-if="poolName" style="color:green;"> {{ poolName }} is Active </div>
              <div>Minting Account Address: <a class="color-eticacyan" v-if="getExplorerBaseURLFromType('solutions')" target="_blank" v-bind:href="getExplorerBaseURLFromType('solutions') + 'address/' + poolData.mintingAddress  "> {{poolData.mintingAddress}}  </a> </div>
              <div>Minting Network Name: {{poolData.mintingNetwork}}</div>
              <div v-if="poolStatus.mintingAccountBalances">Minting Balance: {{rawAmountToFormatted(poolStatus.mintingAccountBalances['ETH'] , 18 ) }} EGAZ (ETH)</div>
              <div v-if="poolStatus.mintingAccountBalances">Minting Balance: {{rawAmountToFormatted(poolStatus.mintingAccountBalances['token'], 18)}} ETI</div>
              <span>(Eti mined are immediately sent to reward process)</span>
            </div>
            <div class="my-4">
              <div>Payments Accounts Address: <a class="color-eticacyan" v-if="getExplorerBaseURLFromType('payments')" target="_blank" v-bind:href="getExplorerBaseURLFromType('payments') + 'address/' + poolData.paymentsAddress  "> {{poolData.paymentsAddress}} </a> </div>
              <div>Payments Network Name: {{poolData.paymentsNetwork}}</div>
              <div v-if="poolStatus.paymentsAccountBalances">Payments Balance EGAZ: {{rawAmountToFormatted(poolStatus.paymentsAccountBalances['ETH'],18)}} EGAZ (ETH)</div>

              <div v-if="poolData.batchedPaymentsContractAddress">Batched Payments Contract Address: <a class="color-eticacyan" v-if="getExplorerBaseURLFromType('payments')" target="_blank" v-bind:href="getExplorerBaseURLFromType('payments') + 'address/' + poolData.batchedPaymentsContractAddress  ">  {{poolData.batchedPaymentsContractAddress}}  </a> </div>
              <div v-if="poolStatus.paymentsAccountBalances">Mining Pool Balance: {{rawAmountToFormatted(poolStatus.paymentsAccountBalances['token'], 18)}} ETI</div>
              
            </div>
            <div class="my-4">
              <div>Last Known Block Number: {{poolData.ethBlockNumber}}</div>
              <div>Minimum User Balance For Payment: {{rawAmountToFormatted(poolData.minBalanceForPayment,18)}} ETI</div>
            </div>
        </div> 

          

         <div v-if="poolData && poolData.miningContract && activeSection=='Mining Data'"  class="overflow-x-auto  mb-4">
           
            <div>Current Challenge Number: {{poolData.miningContract.challengeNumber}}</div>

            <div>epochCount: {{poolData.miningContract.epochCount}}</div> 

            <div style="text-decoration:underline;">Blockchain difficulty:</div>
            <div>Current ETI Mining Difficulty: {{poolData.miningContract.miningDifficulty}}</div>

          <br>
          <div style="text-decoration:underline;">Mining Pool difficulty:</div>
          <!-- <div style="color:#135e56;">Low Hashrates (port 8080):</div>
          <div>Minimum Shares Difficulty: {{poolData.minimumShareDifficulty}}</div> -->
          <!--<div>Rewards: 14% of Rewards</div>-->
          <div style="color:#135e56;">Port 8081:</div>
          <div>Minimum Shares Difficulty: {{poolData.minimumShareDifficultyHard}}</div> 
          <div>Rewards: 100% of Rewards on port 8081</div> 
        </div> 


        <div v-if="poolStatus && activeSection=='Pool Status'" class="overflow-x-auto  mb-4">
          
          <div class="mb-4">
            <div v-if="poolName" style="color:green;">Pool status: {{ poolName }} is Active </div>
    
          </div>
        <!--  <div style="text-decoration:underline;">Low Hashrates (port 8080):</div>
          <div>Minimum Shares Difficulty: {{poolData.minimumShareDifficulty}}</div>
          <div>Rewards: 14% of Rewards</div>
          <br> -->
          <div style="text-decoration:underline;">Port 8081:</div>
          <div>Minimum Shares Difficulty: {{poolData.minimumShareDifficultyHard}}</div> 
          <div>Rewards: 100% of Rewards o port 8081</div>


          <div class="mb-4">avgGasPriceGWei: {{poolStatus.poolFeesMetrics.avgGasPriceGWei}}</div>
          
          
          <div>Full Mining Reward: {{Number.parseFloat(rawAmountToFormatted(poolStatus.poolFeesMetrics.miningRewardRaw,18))}} ETI</div>

          <div>miningRewardInEth: {{poolStatus.poolFeesMetrics.miningRewardInEth}}</div>

           <div>poolBaseFeeFactor: {{poolStatus.poolFeesMetrics.poolBaseFee}}</div>
          
        </div> 


          

        <div v-if="activeSection =='Recent Transactions'" class="mb-4">

        <section>
          <TransactionsTable
            class="mb-4"
            label="Recent Payments" 
            v-bind:transactionsList="recentPaymentTx"
          />
        </section>


        </div>

       

 


     </div>


    
   </div>

   

 
    

  <Footer    />

</div>
</template>


<script>
import Navbar from './components/Navbar.vue';
import AppPanel from './components/AppPanel.vue';
import VerticalNav from './components/VerticalNav.vue'
import Footer from './components/Footer.vue';
 

import TransactionsTable from './components/TransactionsTable.vue';
import HashrateChart from './components/HashrateChart.vue';

import HorizontalNav from './components/HorizontalNav.vue';

import SocketHelper from '../js/socket-helper'

 import FrontendHelper from '../js/frontend-helper';
 

import MathHelper from '../js/math-helper'

export default {
  name: 'Accounts',
  props: [],
  components: {Navbar,AppPanel,VerticalNav,Footer,TransactionsTable, HorizontalNav},
  data() {
    return {
      poolName: null,
      poolData: null,
      poolStatus: null,

      activeSection: 'Mining Data',

       
      accountList: [] ,

      recentSolutionTx:[],
      recentPaymentTx:[] 
    }
  },
 

  created(){
     this.socketHelper = new SocketHelper()
      
      setInterval(this.pollSockets.bind(this),30000)


      this.socketsListener = this.socketHelper.initSocket()
     
     

        this.socketsListener.on('poolName', (name) => {   
            this.poolName = name;
        });

       this.socketsListener.on('poolData', (data) => {   
            console.log('poolData is', data);
            this.poolData = data 
        });

         this.socketsListener.on('poolStatus', (data) => {   
            this.poolStatus = data 
            
        });


         this.socketsListener.on('recentSolutions', (data) => {  
            this.recentSolutionTx=data

            this.recentSolutionTx.map( x => this.addExplorerUrl(x, 'solutions')  )
        });

         this.socketsListener.on('recentPayments', (data) => {  
            this.recentPaymentTx=data
            
            this.recentPaymentTx.map( x => this.addExplorerUrl(x, 'payments')  )

            console.log('recent payment tx ',this.recentPaymentTx)


        });

      this.pollSockets()
  },
  methods: {
    pollSockets(){
      this.socketHelper.emitEvent('getPoolName')
      this.socketHelper.emitEvent('getPoolData')
      this.socketHelper.emitEvent('getPoolStatus')
      this.socketHelper.emitEvent('getRecentSolutions')
      this.socketHelper.emitEvent('getRecentPayments')
    },

    rawAmountToFormatted(amount, decimals){
      return MathHelper.rawAmountToFormatted(amount,decimals)
    },

    onHorizontalNavClicked(item){
     
      this.activeSection = item


    },

    addExplorerUrl(txData, txType){

      
      if(!this.poolData) return ; 
      
      const solutionsNetworkName = this.poolData.mintingNetwork

      const paymentsNetworkName = this.poolData.paymentsNetwork

   
      
      let baseURL = ''
 
      if(txType == 'payments'){
        baseURL =  FrontendHelper.getExplorerBaseURL(paymentsNetworkName)
      }else{
        baseURL = FrontendHelper.getExplorerBaseURL(solutionsNetworkName) 
      }



      txData.txURL=baseURL.concat('tx/').concat(txData.txHash)

    },

    getExplorerBaseURLFromType(txType){

      if(!this.poolData) return null; 
      
      const solutionsNetworkName = this.poolData.mintingNetwork

      const paymentsNetworkName = this.poolData.paymentsNetwork

     if(txType == 'payments'){
        return FrontendHelper.getExplorerBaseURL(paymentsNetworkName)
      }else{
        return FrontendHelper.getExplorerBaseURL(solutionsNetworkName) 
      }

 
    }

 

  }
}
</script>
