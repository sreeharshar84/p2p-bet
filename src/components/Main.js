import React, { Component } from 'react'
import { Button, Table } from 'react-bootstrap';

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

    const renderConditionalElements = () => {
        if(this.BetOn == null) {
            this.BetOn = "ETH / USD";
        }
            
        return <select className="form-control mb-3" onChange={(e) => {
            this.BetOn = e.target.value;
            }}>
            {optionItems}
            </select>
    }
    
    const renderPlaceBetUI = () => {
        return <div className="card-body">
            <form className="mb-3" onSubmit={(event) => {
                event.preventDefault()
                let pricePrediction = this.pricePredictionForMakeBet.value
                let amount = this.bettingAmount1.value.toString()
                amount = window.web3.utils.toWei(amount, 'Ether')
                this.props.MakeBet(pricePrediction, amount, this.BetOn)
              }}>
              <div>
                <label className="float-left"><b>Bet Tokens</b></label>
              </div>
              <div className="input-group mb-4">
                <input
                  type="text"
                  ref={(bettingAmount1) => { this.bettingAmount1 = bettingAmount1 }}
                  className="form-control form-control-lg"
                  placeholder="0"
                  required />
                <div className="input-group-append">
                  <div className="input-group-text">
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
                  ref={(pricePredictionForMakeBet) => { this.pricePredictionForMakeBet = pricePredictionForMakeBet }}
                  className="form-control form-control-lg"
                  placeholder="0"
                  required />
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg"> {"Create new bet"} </button>
            </form>
        </div>
    }
    
    return (
      
        <div id="content" className="mt-3">
            {renderConditionalElements()}
            <div className="card mb-4" >
                {renderPlaceBetUI()}    
            </div>
        </div>
    );
  }
}

export default Main;
