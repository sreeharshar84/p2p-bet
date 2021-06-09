pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

contract MultiBetContract {
    
    address private _owner;
    uint256 public betCount;
    
    struct BettingEvent{
        
        uint256 bettingPairId; /*Monotonically increasing Id within the smart contract.*/
        
        AggregatorV3Interface priceFeed;
        address priceFeedAddress;
        string priceFeedName;
        int currentPriceFromChainLink;

        /**
        * Our Bettors
        */
        address player1;
        address player2;

        uint player1Deposit;
        uint player2Deposit;

        int player1PricePrediction;
        int player2PricePrediction;

        /*
          Bet Status         
        */
        bool gameFinished;
        bool withdrawCompleted;
        address  theWinner;
        uint gains;
    }
    
    mapping(uint256 => BettingEvent) bettingEventMap; 
    
    //BettingEvent[] bettingEventMap;
    
    /**
    * The logs that will be emitted in every step of the contract's life cycle
    */
    event BetCreated(address player1, uint256 betId);
	event BetStartsEvent(address player1, address player2);
	event EndOfRoundEvent(uint player1Deposit, uint player2Deposit);
	event EndOfBetEvent(address winner, uint gains);

    constructor() public {
        _owner = msg.sender;
        betCount = 0;
    }

    /**
     * Returns the latest price
     */
    function getLatestPrice(uint256 interestedBet) public view returns (int) {
        (
            /* uint80 roundID */,
            int price,
            /* uint startedAt */,
            /* uint timeStamp */,
            /* uint80 answeredInRound */
        ) = bettingEventMap[interestedBet].priceFeed.latestRoundData();
        return price;
    }

    function createBet(string memory _priceFeedName, address _priceFeed, int pricePrediction) public payable{
        
        betCount++;
        
        bettingEventMap[betCount].bettingPairId = betCount;
        
        bettingEventMap[betCount].player1 = msg.sender;
        bettingEventMap[betCount].player1Deposit = msg.value;
        bettingEventMap[betCount].player1PricePrediction = pricePrediction; 

        // Bet creator will decide which price the bet will be on
        bettingEventMap[betCount].priceFeedAddress = _priceFeed;
        bettingEventMap[betCount].priceFeedName = _priceFeedName;
        bettingEventMap[betCount].priceFeed = AggregatorV3Interface(_priceFeed);
        
        emit BetCreated(msg.sender, betCount);
    }

    /**
    * Every round a player can put a sum of ether, if one of the player put in twice or
    * more the money (in total) than the other did, the first wins
    */
    function joinBet(uint256 interestedBet, int pricePrediction) public payable {
    	require(!bettingEventMap[interestedBet].gameFinished &&
    	        bettingEventMap[interestedBet].player2 == address(0) && 
    	        msg.sender != bettingEventMap[interestedBet].player1);
        
        bettingEventMap[interestedBet].player2 = msg.sender;        
        bettingEventMap[interestedBet].player2Deposit = msg.value;
        bettingEventMap[interestedBet].player2PricePrediction = pricePrediction; 

    	bettingEventMap[interestedBet].currentPriceFromChainLink = getLatestPrice(interestedBet);

        //Check who is closest to the price and declare them the winner.            
    	if(abs(bettingEventMap[interestedBet].currentPriceFromChainLink - bettingEventMap[interestedBet].player1PricePrediction) <=
           abs(bettingEventMap[interestedBet].currentPriceFromChainLink - bettingEventMap[interestedBet].player2PricePrediction)) {
    		endOfGame(interestedBet, bettingEventMap[interestedBet].player1);
    	} else {
    		endOfGame(interestedBet, bettingEventMap[interestedBet].player2);
    	}
    }

    function abs(int x) private pure returns (int) {
        return x >= 0 ? x : -x;
    }

    function endOfGame(uint256 interestedBet, address winner) internal {
        bettingEventMap[interestedBet].gameFinished = true;
        bettingEventMap[interestedBet].theWinner = winner;
        bettingEventMap[interestedBet].gains = bettingEventMap[interestedBet].player1Deposit + bettingEventMap[interestedBet].player2Deposit;
        emit EndOfBetEvent(bettingEventMap[interestedBet].theWinner, bettingEventMap[interestedBet].gains);
    }
    
    
    /**
    * The withdraw function, following the withdraw pattern shown and explained here:
    * http://solidity.readthedocs.io/en/develop/common-patterns.html#withdrawal-from-contracts
    */
    function withdraw(uint256 interestedBet) public {
        require(bettingEventMap[interestedBet].gameFinished && 
                !bettingEventMap[interestedBet].withdrawCompleted && 
                bettingEventMap[interestedBet].theWinner == msg.sender);

        uint amount = bettingEventMap[interestedBet].gains;

        // Clean out the current state
        bettingEventMap[interestedBet].gains = 0;
        bettingEventMap[interestedBet].withdrawCompleted = true;
         
        msg.sender.transfer(amount);
    }
    
    function getPlayer1Details(uint256 interestedBet) public view returns (address p1, uint player1Deposit, int player1PricePrediction) {
        p1 = bettingEventMap[interestedBet].player1;
        player1Deposit = bettingEventMap[interestedBet].player1Deposit;
        player1PricePrediction = bettingEventMap[interestedBet].player1PricePrediction;
    }
    
    function getPlayer2Details(uint256 interestedBet) public view returns (address p2, uint player2Deposit, int player2PricePrediction) {
        p2 = bettingEventMap[interestedBet].player2;
        player2Deposit = bettingEventMap[interestedBet].player2Deposit;
        player2PricePrediction = bettingEventMap[interestedBet].player2PricePrediction;
    }
    
    function getBetDetails(uint256 interestedBet) public view returns (bool gameFinished, 
                                                                   bool withdrawCompleted, 
                                                                   address  theWinner, 
                                                                   uint gains,
                                                                   address priceFeedAddress,
                                                                   string memory priceFeedName,
                                                                   int currentPriceFromChainLink) {
        gameFinished = bettingEventMap[interestedBet].gameFinished;
        withdrawCompleted = bettingEventMap[interestedBet].withdrawCompleted;
        theWinner = bettingEventMap[interestedBet].theWinner;
        gains = bettingEventMap[interestedBet].gains;
        
        priceFeedAddress = bettingEventMap[interestedBet].priceFeedAddress;
        priceFeedName = bettingEventMap[interestedBet].priceFeedName;
        currentPriceFromChainLink = bettingEventMap[interestedBet].currentPriceFromChainLink;
    }
    
    function getActiveBets() public view returns (BettingEvent[] memory) {
        BettingEvent[] memory activeBets = new BettingEvent[](betCount);
        uint256 i = 0;
        for (i = 0 ; i < betCount ; i++) {
            activeBets[i] = bettingEventMap[i + 1];
        }
        return activeBets;
    }
}