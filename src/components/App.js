import React, { Component } from 'react'
import Web3 from 'web3'
import BetContractV3 from '../build/contracts/MultiBetContract.json'
import Navbar from './Navbar'
import Main from './Main' 
import AllBet from './AllBet'
import './App.css'

class App extends Component {
    
  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }
  
  async loadBlockchainData() {
    const web3 = window.web3
    const accounts = await web3.eth.getAccounts()
    this.setState({ mAccount : accounts[0] })

    const networkId = await web3.eth.net.getId()

    let kovanTokenConversions = new Map([
      ["LINK / USD", "0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0"],
      ["ETH / USD", "0x9326BFA02ADD2366b30bacB125260Af641031331"],
      ["AAVE / ETH", "0xd04647B7CB523bb9f26730E9B6dE1174db7591Ad"],
      ["AMPL / ETH", "0x562C092bEb3a6DF77aDf0BB604F52c018E4f2814"],
      ["AUD / USD", "0x5813A90f826e16dB392abd2aF7966313fc1fd5B8"],
      ["BAT / ETH", "0x0e4fcEC26c9f85c3D714370c98f43C4E02Fc35Ae"]
    ]);
    this.setState({mKovanTokenConversions : kovanTokenConversions})

    //Load PriceBet
    const betContractV3Data = BetContractV3.networks[networkId]
    
    if (betContractV3Data) {
      const betContractV3Instance = new web3.eth.Contract(BetContractV3.abi, betContractV3Data.address)
      this.setState({mBetContractV3Instance : betContractV3Instance})

      console.log("contract address = ", betContractV3Data.address);
    } else {
      window.alert('Betting contract not deployed to detect current network')
    }
    this.setState({mLoading : false })
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-ethereum browser detected. You should use Metamask')
    }
  }
  
  makeBet = (prediction, amount, betOn) => {
    this.setState({ mLoading: true })
    let kovanTokenConversionAddress = this.state.mKovanTokenConversions.get(betOn)

    // createBet(string memory _priceFeedName, address _priceFeed, int pricePrediction)
    this.state.mBetContractV3Instance.methods.createBet(betOn,
       kovanTokenConversionAddress, prediction).send({ from : this.state.mAccount,
          value: amount }).on('transactionHash', (hash) => {
            console.log("Created bet. Hash = ", hash );
            this.setState({ mLoading: false });
    })
    .catch((err) => {window.alert("Failed: " + err.message);})
  }
  
  makeCounterBet = (bettingPairId, prediction, amount) => {
    this.setState({ mLoading: true })

    // joinBet(uint256 interestedBet, int pricePrediction)
    this.state.mBetContractV3Instance.methods.joinBet(bettingPairId,
       prediction).send({ from: this.state.mAccount,
         value: amount }).on('transactionHash', (hash) => {
           console.log("Joined bet. Hash = ", hash );
           this.setState({ mLoading: false });
    })
    .catch((err) => {window.alert("Failed: " + err.message);})
  }
  
  getAllBets = () => {
      this.state.mBetContractV3Instance.methods.getActiveBets().call({from: this.state.mAccount})
      .then((returnVal, metaVal)=>{this.setState({mAllBets : returnVal}) ;})
  }
  
  getPriceFeedDescFromAddress = (priceFeedAddress) => {
      for (let [desc, address] of this.state.mKovanTokenConversions) {
          if(address == priceFeedAddress) {
              return desc
          }
      }
      return "ETH / USD"
  }

  withdraw = (betId) => {
    this.setState({ loading: true })
    this.state.mBetContractV3Instance.methods.withdraw(betId).send({ from: this.state.mAccount }).on('transactionHash', (hash) => {
      console.log('completed transfer. hash = ' +hash)
      this.setState({ loading: false })
    })
  }

  constructor(props) {
    super(props)
    this.state = {
      mAccount: '0x0',
      mBetContractV3Instance: {},
      mKovanTokenConversions : {},
      mLoading: true,
      mAllBets: []
    }
  }

  render() {
    let createBetSection
    let allBetSection
    if(this.state.mLoading) {
      createBetSection = <p id="loader" className="text-center">Loading...</p>
    } else {
      createBetSection = <Main
        CurrentAccount={this.state.mAccount}
        MakeBet={this.makeBet}
        JoinBet={this.makeCounterBet}
        GetAllBets={this.getAllBets}
        GetPriceFeedDesc={this.getPriceFeedDescFromAddress}
        AllBetsInContract = {this.state.mAllBets}
        Withdraw={this.withdraw}
      />
      allBetSection = <AllBet
        CurrentAccount={this.state.mAccount}
        MakeBet={this.makeBet}
        JoinBet={this.makeCounterBet}
        GetAllBets={this.getAllBets}
        GetPriceFeedDesc={this.getPriceFeedDescFromAddress}
        AllBetsInContract = {this.state.mAllBets}
        Withdraw={this.withdraw}
      />
    }

    return (
      <div>
        <Navbar account={this.state.mAccount} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '600px' }}>
              <div className="createBetSection mr-auto ml-auto float-left">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                >
                </a>
                { createBetSection }
              </div>
            </main>
          </div>
          <div className="row">
            <main role="main" className="col-lg-12 ml-auto mr-auto">
              <div className="createBetSection mr-auto ml-auto float-left">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                >
                </a>
                { allBetSection }
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
