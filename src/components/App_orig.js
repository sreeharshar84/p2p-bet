import React, { Component } from 'react'
import Web3 from 'web3'
import PriceBet from '../build/contracts/BetContractV2.json'
import Navbar from './Navbar'
import Main from './Main' 
import './App.css'

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadBlockchainData() {
    const web3 = window.web3
    const accounts = await web3.eth.getAccounts()
    this.setState({ account : accounts[0] })

    console.log('current account = '+ this.state.account)

    const networkId = await web3.eth.net.getId()
    console.log(networkId)

    let kovanTokenConversions = new Map([
      ["LINK / USD", "0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0"],
      ["ETH / USD", "0x9326BFA02ADD2366b30bacB125260Af641031331"],
      ["AAVE / ETH", "0xd04647B7CB523bb9f26730E9B6dE1174db7591Ad"],
      ["AMPL / ETH", "0x562C092bEb3a6DF77aDf0BB604F52c018E4f2814"],
      ["AUD / USD", "0x5813A90f826e16dB392abd2aF7966313fc1fd5B8"],
      ["BAT / ETH", "0x0e4fcEC26c9f85c3D714370c98f43C4E02Fc35Ae"]
    ]);
    console.log('Kovan TokenConversions = ', kovanTokenConversions )
    this.setState({KovanTokenConversions : kovanTokenConversions})

    //Load PriceBet
    const priceBetData = PriceBet.networks[networkId]
    
    if (priceBetData) {
      const priceBetContract = new web3.eth.Contract(PriceBet.abi, priceBetData.address)
      this.setState({priceBetContract})
      console.log('contract address ' + priceBetData.address)

      let Player1 = await priceBetContract.methods.player1().call();
      console.log('Player1 = '+ Player1.toString()) 
      let Player2 = await priceBetContract.methods.player2().call();
      console.log('Player2 = '+ Player2.toString()) 
     
      this.setState({Player1Address: Player1.toString()})
      this.setState({Player2Address: Player2.toString()})
 
      let priceFeedAddress = await priceBetContract.methods.priceFeedAddress().call();
      console.log('priceFeedAddress = '+ priceFeedAddress.toString())

      let winner = await priceBetContract.methods.theWinner().call();
      console.log('winner = '+ winner.toString()) 
      this.setState({Winner : winner})

      let player1Deposit = await priceBetContract.methods.player1Deposit().call();
      console.log('player1Deposit = '+ player1Deposit.toString()) 
      let player1PricePrediction = await priceBetContract.methods.player1PricePrediction().call();
      console.log('player1PricePrediction = '+ player1PricePrediction.toString()) 

      let player2Deposit = await priceBetContract.methods.player2Deposit().call();
      console.log('player2Deposit = '+ player2Deposit.toString())
      let player2PricePrediction = await priceBetContract.methods.player2PricePrediction().call();
      console.log('player2PricePrediction = '+ player2PricePrediction.toString()) 
      
      this.setState({Player1Deposit: player1Deposit.toString()})
      this.setState({Player2Deposit: player2Deposit.toString()})
      this.setState({Player1Prediction: player1PricePrediction.toString()})
      this.setState({Player2Prediction: player2PricePrediction.toString()})

      let gains = await priceBetContract.methods.gains().call();
      console.log('gains = '+ gains.toString())
      
      let currentPriceFromChainLink = await priceBetContract.methods.currentPriceFromChainLink().call();
      console.log('currentPriceFromChainLink = '+ currentPriceFromChainLink.toString())
      this.setState({CurrentPriceFromChainLink: currentPriceFromChainLink.toString()})

      let betsPlaced = 0;
      if (this.state.Player1Deposit != 0) {
        betsPlaced++;
      }
      if (this.state.Player2Deposit != 0) {
        betsPlaced++;
      }
      this.setState({BetsPlacedSofar : betsPlaced});
 
      let PriceFeedName = await priceBetContract.methods.priceFeedName().call();
      console.log('PriceFeedName = '+ PriceFeedName.toString()) 
      this.setState({PriceFeedName: PriceFeedName.toString()})
    } else {
      window.alert('PriceBet contract not deployed to detect network')
    }
    this.setState({loading : false })
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
  
  makeBet = (amount, prediction, betOn) => {
    this.setState({ loading: true })
    console.log(this.state.account + ' will try to put a bet')
    console.log(amount + ' bet')
    console.log(prediction + ' is the predicted amount')

    let kovanTokenConversionAddress = this.state.KovanTokenConversions.get(betOn)
    console.log("Bet will be placed on " + betOn + " => " + kovanTokenConversionAddress)
    
    if (this.state.Player2Address == "0x0000000000000000000000000000000000000000" && 
    this.state.Player1Address != this.state.account){     
      this.state.priceBetContract.methods.joinBet(prediction).send({ from: this.state.account, value: amount }).on('transactionHash', (hash) => {
          console.log('Bet placed successfully')
          this.state.Player2Address = this.state.account
          this.setState({ loading: false })
      })
    }
    else {
      console.log('This guy is  = '+ this.state.account)
      this.state.priceBetContract.methods.createBet(betOn, kovanTokenConversionAddress, prediction).send({ from : this.state.account, value: amount }).on('transactionHash', (hash) => {
        console.log('Player1 placed a bet of ' + amount)
        this.setState({ loading: false })
      })
    }    
  }

  withdraw = (amount) => {
    this.setState({ loading: true })
    this.state.priceBetContract.methods.withdraw().send({ from: this.state.account }).on('transactionHash', (hash) => {
      console.log('completed transfer')
      this.setState({ loading: false })
    })    
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '0x0',
      priceBetContract: {},
      Player1Address: '0x0',
      Player2Address: '0x0',
      Winner: '0x0',
      PriceFeedName: '',
      Player1Deposit: '0',
      Player2Deposit: '0',
      Player1Prediction: '0',
      Player2Prediction: '0',
      CurrentPriceFromChainLink: '0',
      BetsPlacedSofar: '0',
      loading: true
    }
  }

  render() {
    let content
    if(this.state.loading) {
      content = <p id="loader" className="text-center">Loading...</p>
    } else {
      content = <Main
        Player1Deposit={this.state.Player1Deposit}
        Player2Deposit={this.state.Player2Deposit}
        Player1Prediction={this.state.Player1Prediction}
        Player2Prediction={this.state.Player2Prediction}
        MakeBet={this.makeBet}
        Withdraw={this.withdraw}
        Player1Address={this.state.Player1Address}
        Player2Address={this.state.Player2Address}
        CurrentPriceFromChainLink ={this.state.CurrentPriceFromChainLink}
        BetsPlacedSofar={this.state.BetsPlacedSofar}
        CurrentAccount={this.state.account}
        Winner={this.state.Winner}
        PriceFeedName={this.state.PriceFeedName}
      />
    }

    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '600px' }}>
              <div className="content mr-auto ml-auto">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                >
                </a>

                { content }
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
