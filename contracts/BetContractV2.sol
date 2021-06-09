pragma solidity ^0.6.6;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

contract BetContractV2 {

    
    AggregatorV3Interface internal priceFeed;
    address public priceFeedAddress;
    string public priceFeedName;

    /**
    * Our Bettors
    */
	address public player1;
	address public player2;

	bool public player1Played;
	bool public player2Played;

	uint public player1Deposit;
	uint public player2Deposit;

    int public player1PricePrediction;
    int public player2PricePrediction;

	bool public gameFinished;
    bool public withdrawCompleted;
    address public theWinner;
    uint public gains;

    int public currentPriceFromChainLink;
    
    /**
    * The logs that will be emitted in every step of the contract's life cycle
    */
	event BetStartsEvent(address player1, address player2);
	event EndOfRoundEvent(uint player1Deposit, uint player2Deposit);
	event EndOfBetEvent(address winner, uint gains);

    /**
     * Network: Kovan
     * Aggregator: LINK/USD
     * Address: 0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0
     https://docs.chain.link/docs/ethereum-addresses/
     */
    constructor() public {
        player1 = msg.sender;
    }

    /**
     * Returns the latest price
     */
    function getLatestPrice() public view returns (int) {
        (
            /* uint80 roundID */,
            int price,
            /* uint startedAt */,
            /* uint timeStamp */,
            /* uint80 answeredInRound */
        ) = priceFeed.latestRoundData();
        return price;
    }

    function createBet(string memory _priceFeedName, address _priceFeed, int pricePrediction) public payable {
       require(msg.sender == player1);

       player1Played = true;
       player1Deposit = msg.value;
       player1PricePrediction = pricePrediction; 

       // Bet creator will decide which price the bet will be on
       priceFeedAddress = _priceFeed;
       priceFeedName = _priceFeedName;
       priceFeed = AggregatorV3Interface(_priceFeed);
    }

    /**
    * Every round a player can put a sum of ether, if one of the player put in twice or
    * more the money (in total) than the other did, the first wins
    */
    function joinBet(int pricePrediction) public payable {
    	require(!gameFinished && player2 == address(0) && msg.sender != player1);
        
        player2 = msg.sender;        
        player2Played = true;
    	player2Deposit = msg.value;
        player2PricePrediction = pricePrediction; 

    	if(player1Played && player2Played) {
            currentPriceFromChainLink = getLatestPrice();

            //Check who is closest to the price and declare them the winner.            
    		if(abs(currentPriceFromChainLink - player1PricePrediction) <=
             abs(currentPriceFromChainLink - player2PricePrediction)) {
    			endOfGame(player1);
    		} else {
    			endOfGame(player2);
    		}
    	}
    }

    function abs(int x) private pure returns (int) {
        return x >= 0 ? x : -x;
    }

    function endOfRound() internal {
    	player1Played = false;
    	player2Played = false;

    	emit EndOfRoundEvent(player1Deposit, player2Deposit);
    }

    function endOfGame(address winner) internal {
        gameFinished = true;
        theWinner = winner;
        gains = player1Deposit + player2Deposit;
        emit EndOfBetEvent(winner, gains);
    }

    /**
    * The withdraw function, following the withdraw pattern shown and explained here:
    * http://solidity.readthedocs.io/en/develop/common-patterns.html#withdrawal-from-contracts
    */
    function withdraw() public {
        require(gameFinished && !withdrawCompleted && theWinner == msg.sender);

        uint amount = gains;

        // Clean out the current state
        gains = 0;
        player1Deposit = 0;
        player2Deposit = 0;
        withdrawCompleted = true;
         
        msg.sender.transfer(amount);
    }
}