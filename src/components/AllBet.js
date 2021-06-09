import React, { Component } from 'react'
import { Button, Table } from 'react-bootstrap';

class AllBet extends Component {
  
  render() {
    
    const renderJoinBetUI = () => {
        return <div className="card-body">
            <form className="mb-3" onSubmit={(event) => {
                event.preventDefault()
                let bettingPairId = this.bettingPairId.value
                let pricePrediction = this.pricePredictionForJoinBet.value
                let amount = this.bettingAmount2.value.toString()
                amount = window.web3.utils.toWei(amount, 'Ether')
                this.props.JoinBet(bettingPairId, pricePrediction, amount)
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
            let tableItems = this.props.AllBetsInContract.map((item) =>
                (<tr>
                <td>{item.bettingPairId}</td>
                <td>{item.priceFeedName}</td>
                <td>{item.currentPriceFromChainLink}</td>
                <td>{item.player1.substring(1,4) +'.....'}</td>
                <td>{window.web3.utils.fromWei(item.player1Deposit, 'ether')}</td>
                <td>{item.player1PricePrediction}</td>
                <td>{(this.props.CurrentAccount != item.player1 &&
                      item.player2 == 0x0) ? <button type="submit"
                                                className="btn btn-primary btn-block btn-lg"
                                                onClick={(event) => {
                                                  event.preventDefault();
                                                  let pricePrediction = this.pricePredictionForJoinBet.value;
                                                  let amount = this.bettingAmount2.value.toString();
                                                  amount = window.web3.utils.toWei(amount, 'Ether');

                                                  console.log('Making counter bet for betID' + item.bettingPairId+' pricePrediction =' + pricePrediction);
                                                  this.props.JoinBet(item.bettingPairId,
                                                    pricePrediction, amount);
                                                }}>
                                                {"Join This Bet"}
                                             </button>
                                             : ( (this.props.CurrentAccount == item.player2) ?
                                                 "Current Player Account"
                                                 : (item.player2 == 0x0) ?
                                                    "Waiting for a player...." : 
                                                    item.player2.substring(1,4) +'.....')}</td>
                <td>{(this.props.CurrentAccount != item.player1 && item.player2 == 0x0) ? <input
                                                type = "text"
                                                ref = {(bettingAmount2) => { this.bettingAmount2 = bettingAmount2 }}
                                                className = "form-control form-control-lg"
                                                placeholder="0"
                                                required / >
                                             : window.web3.utils.fromWei(item.player2Deposit, 'ether')}</td>
                <td>{(this.props.CurrentAccount != item.player1 && item.player2 == 0x0) ? <input
                                                type="text"
                                                ref={(pricePredictionForJoinBet) => {
                                                   this.pricePredictionForJoinBet = pricePredictionForJoinBet
                                                }}
                                                className="form-control form-control-lg"
                                                placeholder="0"
                                                required />
                                             : item.player2PricePrediction}</td>
                <td>{item.gameFinished == 1 ? "Completed Bet" : "Active Bet "}</td>
                <td>{item.gameFinished == 1 ?
                      item.theWinner == this.props.CurrentAccount ?
                        item.withdrawCompleted == 0 ?
                          <button type="submit"
                            className="btn btn-primary btn-block btn-lg"
                            onClick={(event) => {
                                      event.preventDefault()
                                      this.props.Withdraw(parseInt(item.bettingPairId))
                          }}>
                            You won!<br/>WITHDRAW winnings...

                          </button>
                          : "You Won! Withdrawal Completed."  
                        : "You Lost" 
                       : "Active Bet"
                 }</td>
                </tr>)
            ).reverse();
            let tableMain = <Table striped bordered hover>
            <thead>
                <tr>
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
                    <th>Result</th>
                </tr>
            </thead>
            <tbody>
            {tableItems}
            </tbody>
            </Table>
            return tableMain
        } else {
            return <p></p>
        }
    }
    
    const renderGetAllBetUI = () => {
      this.props.GetAllBets();
      let content = GetAllBetsParsedInTableFormat();
      
      return <div className="card-body">
            <div className="float-left">
                {content}
            </div>
        </div>
    }
    
    return (
      <div id="content" className="mt-3"> 
        <div id="content" className="mt-3">
            <div className="card mb-4" >
                {renderGetAllBetUI()}
            </div>
        </div>
      </div>
    );
  }
}

export default AllBet;
