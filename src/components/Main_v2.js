import React, { Component } from 'react'
import { Button, Table } from 'react-bootstrap';
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
                  ref={(pricePredictionForMakeBet) => { this.pricePredictionForMakeBet = pricePredictionForMakeBet }}
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
              <button type="submit" className="btn btn-primary btn-block btn-lg"> {"Create new bet"} </button>
            </form>
        </div>
    }
    
    const renderJoinBetUI = () => {
        return <div className="card-body">
            <form className="mb-3" onSubmit={(event) => {
                event.preventDefault()
                let bettingPairId = this.bettingPairId.value
                let pricePrediction = this.pricePredictionForJoinBet.value
                let amount = this.bettingAmount2.value.toString()
                amount = window.web3.utils.toWei(amount, 'Ether')
                this.props.JoinBet(bettingPairId, pricePrediction, amount, this.BetOn)
              }}>
              <div>
                <label className="float-left"><b>Betting Pair Id.</b></label>
              </div>
              <div className="input-group mb-4">
                <input
                  type="text"
                  ref={(bettingPairId) => { this.bettingPairId = bettingPairId }}
                  className="form-control form-control-lg"
                  placeholder="0"
                  required />
                <div className="input-group-append">
                  <div className="input-group-text">
                    <img src={dai} height='32' alt=""/>
                    &nbsp;&nbsp;&nbsp; ID
                  </div>
                </div>
              </div>
              <div>
                <label className="float-left"><b>Bet Tokens</b></label>
              </div>
              <div className="input-group mb-4">
                <input
                  type="text"
                  ref={(bettingAmount2) => { this.bettingAmount2 = bettingAmount2 }}
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
                  ref={(pricePredictionForJoinBet) => { this.pricePredictionForJoinBet = pricePredictionForJoinBet }}
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
              <button type="submit" className="btn btn-primary btn-block btn-lg"> {"Join existing bet"} </button>
            </form>
        </div>
    }
    
    const GetAllBetsParsedInTableFormat = () => {
        if((this.props.AllBetsInContract != 'undefined') && (this.props.AllBetsInContract.length > 0)) {
            let i = 1
            let tableItems = this.props.AllBetsInContract.map((item) =>
                (<tr>
                <td>{i++}</td>
                <td>{item.bettingPairId}</td>                
                <td>{item.priceFeedName}</td>
                <td>{item.currentPriceFromChainLink}</td>
                <td>{(item.player1 == 0x0) ? "No player 1" : ( (this.props.CurrentAccount == item.player1)? "Current player account" : item.player1)}</td>
                <td>{item.player1Deposit}</td>
                <td>{item.player1PricePrediction}</td>
                <td>{(item.player2 == 0x0) ? "No player 2" : ( (this.props.CurrentAccount == item.player2)? "Current player account" : item.player2)}</td>
                <td>{item.player2Deposit}</td>
                <td>{item.player2PricePrediction}</td>
                <td>{item.gameFinished == 1 ? "Bet Finished" : "Bet Not Finished"}</td>
                <td>{item.gameFinished == 1 ?
                      item.theWinner == this.props.CurrentAccount ?
                        item.withdrawCompleted == 0 ?
                          <button type="submit"
                            className="btn btn-primary btn-block btn-lg"
                            onClick={(event) => {
                                      event.preventDefault()
                                      this.props.Withdraw(parseInt(item.bettingPairId))
                          }}>
                            You won the Bet on {item.priceFeedName}! WITHDRAW Your winnings...
                          </button>
                          : "You Won! Withdrawal Completed."  
                        : "You Lost" 
                       : "Bet Not Finished"                       
                 }</td>
                </tr>)
            );
            let tableMain = <Table striped bordered hover>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Betting Pair ID</th>
                    <th>PriceFeed Name</th>                    
                    <th>Actual Price from Chainlink</th>
                    <th>Player 1 Address</th>
                    <th>Player 1 Deposit</th>
                    <th>Player 1 Prediction</th>
                    <th>Player 2 Address</th>
                    <th>Player 2 Deposit</th>
                    <th>Player 2 Prediction</th>
                    <th>Bet Status</th>
                    <th>Winner</th>
                </tr>
            </thead>
            <tbody>
            {tableItems}
            </tbody>
            </Table>
            return tableMain
        } else {
            return <p>No bets on smart contract.</p>
        }
    }
    
    const renderGetAllBetUI = () => {
        let content = GetAllBetsParsedInTableFormat();
        return <div className="card-body">
            <form className="mb-4" onSubmit={(event) => {
                event.preventDefault()
                this.props.GetAllBets()
              }}>
              <button type="submit" className="btn btn-primary btn-block btn-lg"> {"Get all bets"} </button>
            </form>
            <div className="float-left">
                {content}
            </div>
        </div>
    }
    
    return (
        <div id="content" className="mt-3">
            {renderConditionalElements()}
            <div className="card mb-4" >
                {renderPlaceBetUI()}    
            </div>
            <div className="card mb-4" >
                {renderJoinBetUI()}
            </div>
            <div className="card mb-4" >
                {renderGetAllBetUI()}
            </div>
        </div>
    );
  }
}

export default Main;
