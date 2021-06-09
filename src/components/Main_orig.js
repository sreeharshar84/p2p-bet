import React, { Component } from 'react'
import dai from '../dai.png'


class Main extends Component {
  
  render() {
    let obj = {
      KovanTokenConversions: [        
        ["ETH / USD"],
        ["LINK / USD"],
        ["AAVE / ETH"],
        ["AMPL / ETH"],
        ["AUD / USD"],
        ["BAT / ETH"]
      ]
    };
    let optionItems = obj.KovanTokenConversions.map((item) =>
        <option key={item}>{item}</option>
    );
    
    const renderConditionalElements = () =>{

      console.log('In renderConditionalElements-> No. of bets placed = '+ this.props.BetsPlacedSofar)
      if (this.props.BetsPlacedSofar == '0') {
        if (this.props.Player1Address == this.props.CurrentAccount) {
          return <select className="form-control mb-3" onChange={(e) => {
                    console.log("option selected = ", e.target.value);
                    this.BetOn = e.target.value;
                    this.isLoggedIn = true;
                  }}>
                 {optionItems}
                </select>
        }
        else {
          return <p></p>
        }
      } else{
        // Not working currently. Need to store BetOn in the smart contract
        return <p>This bet will track the price of {this.props.PriceFeedName}</p> 
      }
     }     
    
    const renderPlaceBetUI = () =>{
      if (this.props.BetsPlacedSofar == '0' || // No Bet has been placed
          (this.props.BetsPlacedSofar == '1' && // Bet created. Now a new player will join
           this.props.Player2Address == "0x0000000000000000000000000000000000000000" &&
           this.props.Player1Address != this.props.CurrentAccount)) {
             console.log('inside the if condition in renderPlaceBetUI')

             let buttonMessage = ''
             if (this.props.BetsPlacedSofar == '0') {
               buttonMessage = 'Create A Bet'
             }
             else {
              buttonMessage = 'Join A Bet' 
             }
             
        return <div className="card-body">

            <form className="mb-3" onSubmit={(event) => {
                event.preventDefault()
                let pricePrediction = this.pricePrediction.value
                let amount = this.input.value.toString()
                amount = window.web3.utils.toWei(amount, 'Ether')

                console.log('amount = ' + amount)
                console.log('pricePrediction = ' + pricePrediction)
                console.log('BetOn = ', this.BetOn )
                
                this.props.MakeBet(amount, pricePrediction, this.BetOn)
              }}>
              <div>
                <label className="float-left"><b>Bet Tokens</b></label>
              </div>
              <div className="input-group mb-4">
                <input
                  type="text"
                  ref={(input) => { this.input = input }}
                  className="form-control form-control-lg"
                  placeholder="0"
                  required />
                <div className="input-group-append">
                  <div className="input-group-text">
                    <img src={dai} height='32' alt=""/>
                    &nbsp;&nbsp;&nbsp; Testnet ETH
                  </div>
                </div>
              </div>
              <div>
                <label className="float-left"><b>What is your price prediction?</b></label>
              </div>
              <div className="input-group mb-4">
                <input
                  type="text"
                  ref={(pricePrediction) => { this.pricePrediction = pricePrediction }}
                  className="form-control form-control-lg"
                  placeholder="0"
                  required />
                <div className="input-group-append">
                  <div className="input-group-text">
                    <img src={dai} height='32' alt=""/>
                    &nbsp;&nbsp;&nbsp; USD
                  </div>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg"> {buttonMessage} </button>
            </form>
          </div>
      } else {
          return <table className="table table-borderless text-muted text-center">
                  <thead>
                    <tr>
                      <th scope="col">Player1 {this.props.Player1Address}</th>
                      <th scope="col">Player2 {this.props.Player2Address}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Bet Amount: {this.props.Player1Deposit} ETH</td>
                      <td>Bet Amount: {this.props.Player2Deposit} ETH</td>
                    </tr>
                    <tr>
                      <td>Price Prediction: {this.props.Player1Prediction} </td>
                      <td>Price Prediction: {this.props.Player2Prediction} </td>
                    </tr>
                  </tbody>
                </table>
      }
    }

    const renderDeclareWinner = () =>{
      if (this.props.BetsPlacedSofar == '2') {
        if (this.props.Winner == this.props.CurrentAccount) {
          return <div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-block btn-lg"
                    onClick={(event) => {
                      event.preventDefault()
                      this.props.Withdraw()
                    }}>
                     You won the Bet on {this.props.PriceFeedName}! WITHDRAW Your winnings...
                  </button>
                 </div>
        }
        else {
          return <h2> You lost the Bet on {this.props.PriceFeedName}! The Current Value on ChainLink is {this.props.CurrentPriceFromChainLink}</h2>
        }
      }
      else {
        return <p>Waiting for the result.....</p>
      }
    }

    return (
      <div id="content" className="mt-3">

       {renderConditionalElements()}

        <div className="card mb-4" >
        {renderPlaceBetUI()}    

        </div>
        {renderDeclareWinner()}    
        
      </div>
    );
  }
}

export default Main;
