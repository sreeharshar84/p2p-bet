// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.1 <0.9.0;
pragma experimental ABIEncoderV2;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

contract BetContractV3 {

    address private _owner;
    string private _ownerName;

    struct BettingEvent
    {
        bool isValid; /*To check if the struct was exlicitly created in the mapping.*/
        uint256 bettingEventId; /*Monotonically increasing Id within the smart contract.*/
        string bettingEventDescription;
        string[] bettingEventScenarios; /*All possbile scenarios on which a bet can be made. Array index used for referring.*/
        uint256 maxBettingValue; /*Ceiling on betting amount.*/
        uint256 bettingEventValidity; /*Time frame during which the bet is valid. Not used now.*/
    }
    uint256 private _bettingEventIdCounter;
    mapping(uint256 => BettingEvent) private _bettingEventMap; /*Contains all the betting events that users can try.*/
    
    mapping (address => bool) private _bettingPlayerInGame; /* Used to ensure a bet can be made only once from an address*/
    struct BettingPair
    {
        bool isInstantBet; /*To denote that this bet ends the moment a counter bet is made.*/
        uint256 bettingEventId;
        uint256 bettingPairId; /*Monotonically increasing Id within the smart contract.*/
        uint256 bettingAmount;
        address payable[2] bettingPlayers; /*Index 0 and 1 are players 1 and 2 repectively.*/
        int256[2] bettingPlayersChoices; /*The index value of scenario in BettingEvent.bettingEventScenarios for each player.*/
        address externalOracleAddress; /*Used for chainlink queries.*/
    }
    mapping (uint256 => BettingPair) private _bettingPairIdToPlayersPairMap; /*All bets across all betting events.*/
    uint256 private _bettingPairIdCounter;
    uint256 private _instantBettingPairs; /*Count of all instant bets.*/
    
    mapping(uint256 => uint256[]) private _bettingEventIdToPairIdMap; /*List of bets made for each betting event.*/
    
    constructor(string memory ownerName) public
    {
        require(bytes(ownerName).length != 0, "Provided owner name is empty");
        
        _owner = msg.sender;
        _ownerName = ownerName;
        
        _bettingEventIdCounter = 0;
        _bettingPairIdCounter = 0;
        _instantBettingPairs = 0;
    }
    
    function GetBettingOwner() public view returns(string memory)
    {
        return _ownerName;
    }
    
    /*
    * @Param: bettingEvents -> array of all betting events (struct BettingEvent).
    * eg:
    * [
    *  [true, 0, "Liverpool vs Manchester", ["Liverpool wins", "Manchester wins", "Draw match"], 1234, 5000], 
    *  [true, 0, "Chelsea vs Arsenal", ["Chelsea wins", "Arsenal wins", "Draw match"], 5678, 9000]
    * ]
    */
    function InitializeBettingEvents(BettingEvent[] memory bettingEvents) public
    {
        require(msg.sender == _owner, "Only owner can initialize betting events.");
        _bettingEventIdCounter = 0;
        _bettingPairIdCounter = 0;
        _instantBettingPairs = 0;
        
        /* Manually fill the data, ideally it should come from chainlink*/
        uint256 i = 0;
        for( i = 0; i < bettingEvents.length; i+=1)
        {
            _bettingEventIdCounter += 1;
            _bettingEventMap[_bettingEventIdCounter] = bettingEvents[i];
            _bettingEventMap[_bettingEventIdCounter].bettingEventId = _bettingEventIdCounter;
        }
    }
    
    function GetAllBettingEvents() public view returns (BettingEvent[] memory)
    {
        BettingEvent[] memory bettingEventsArray = new BettingEvent[](_bettingEventIdCounter);
        
        uint256 i = 0;
        for(i = 1; i <= _bettingEventIdCounter; i+=1)
        {
            bettingEventsArray[i - 1] = _bettingEventMap[i];
        }
        
        return bettingEventsArray;
    }
    
    /*
    * @Param: bettingEventId -> event Id as obtained from call to GetAllBettingEvents.
    * @Param: bettingEventScenario -> index of scenario in BettingEvent.bettingEventScenario, again obtained from GetAllBettingEvents.
    * @Param: bettingAmount -> to ensure ether transacted while invoking contract is as expected.
    */
    function MakeBet(uint256 bettingEventId, int256 bettingEventScenario, uint256 bettingAmount) public payable returns (uint256)
    {
        require(msg.value == bettingAmount, "Value is not equal to betting amount.");
        require(_bettingEventMap[bettingEventId].isValid == true, "Betting event Id is invalid.");
        require((int256(_bettingEventMap[bettingEventId].bettingEventScenarios.length) > bettingEventScenario) && (bettingEventScenario >= 0), "Event scenario invalid.");
        require(_bettingPlayerInGame[msg.sender] == false, "Player already registered.");
        
        uint256 bettingId = _MakeBet(msg.sender, false, bettingEventId, bettingAmount, bettingEventScenario);
        _bettingEventIdToPairIdMap[bettingEventId].push(bettingId);
        
        return bettingId;
    }
    
    /*
    * @Param: bettingEventScenario -> claim value for which the bet is made, eg: price of ETH is 120USD, bettingEventScenario = 120USD.
    * @Param: bettingAmount -> to ensure ether transacted while invoking contract is as expected.
    * @Param: instantBetResultAggrAddress -> chainlink oracle address from which the truth is retrieved.
    */
    function MakeInstantBet(int256 bettingEventScenario, uint256 bettingAmount, address instantBetResultAggrAddress) public payable returns (uint256)
    {
        require(msg.value == bettingAmount, "Value is not equal to betting amount.");
        require(_bettingPlayerInGame[msg.sender] == false, "Player already registered.");
        
        uint256 bettingId = _MakeBet(msg.sender, true, 0, bettingAmount, bettingEventScenario);
        _bettingPairIdToPlayersPairMap[bettingId].externalOracleAddress = instantBetResultAggrAddress;
        _instantBettingPairs += 1;
        
        return bettingId;
    }
    
    function _MakeBet(address msgSender, bool isInstantBet, uint256 bettingEventId, uint256 bettingAmount, int256 bettingEventScenario) internal returns (uint256)
    {
        _bettingPlayerInGame[msgSender] = true;
        _bettingPairIdCounter += 1;
        _bettingPairIdToPlayersPairMap[_bettingPairIdCounter].isInstantBet = isInstantBet;
        _bettingPairIdToPlayersPairMap[_bettingPairIdCounter].bettingPairId = _bettingPairIdCounter;
        _bettingPairIdToPlayersPairMap[_bettingPairIdCounter].bettingEventId = bettingEventId;
        _bettingPairIdToPlayersPairMap[_bettingPairIdCounter].bettingAmount = bettingAmount;
        _bettingPairIdToPlayersPairMap[_bettingPairIdCounter].bettingPlayers[0] = payable(msgSender);
        _bettingPairIdToPlayersPairMap[_bettingPairIdCounter].bettingPlayersChoices[0] = bettingEventScenario;
        
        return _bettingPairIdCounter;
    }
    
    /*
    * @Param: bettingPairId -> the pair id shared after a call to MakeBet by another pair or a free slot as seen from call to GetAllBets.
    * @Param: bettingEventId -> event Id as obtained from call to GetAllBettingEvents.
    * @Param: bettingEventScenario -> index of scenario in BettingEvent.bettingEventScenario, again obtained from GetAllBettingEvents.
    * @Param: bettingAmount -> to ensure ether transacted while invoking contract is as expected.
    */
    function MakeCounterBet(uint256 bettingPairId, uint256 bettingEventId, int256 bettingEventScenario, uint256 bettingAmount) public payable
    {
        require(msg.value == bettingAmount, "Value is not equal to betting amount.");
        require(_bettingPairIdToPlayersPairMap[bettingPairId].bettingAmount > 0, "Betting pair Id is invalid.");
        require(_bettingPairIdToPlayersPairMap[bettingPairId].bettingAmount == bettingAmount, "Betting amount paid is not equal to amount for which the bet was made.");
        require(_bettingPairIdToPlayersPairMap[bettingPairId].bettingEventId == bettingEventId, "Betting event Id is invalid.");
        require((int256(_bettingEventMap[bettingEventId].bettingEventScenarios.length) > bettingEventScenario) && (bettingEventScenario >= 0), "Event scenario invalid.");
        require(_bettingPlayerInGame[msg.sender] == false, "Player already registered.");
        require(_bettingPairIdToPlayersPairMap[bettingPairId].bettingPlayersChoices[0] != bettingEventScenario, "Bet already made for this scenario.");
        
        _bettingPlayerInGame[msg.sender] = true;
        _bettingPairIdToPlayersPairMap[_bettingPairIdCounter].bettingPlayers[1] = payable(msg.sender);
        _bettingPairIdToPlayersPairMap[_bettingPairIdCounter].bettingPlayersChoices[1] = bettingEventScenario;
    }
    
    /*
    * @Param: bettingPairId -> the pair id shared after a call to MakeBet by another pair or a free slot as seen from call to GetAllBets.
    * @Param: bettingEventScenario -> claim value for which the bet is made, eg: price of ETH is 120USD, bettingEventScenario = 120USD.
    * @Param: bettingAmount -> to ensure ether transacted while invoking contract is as expected.
    * @Param: instantBetResultAggrAddress -> chainlink oracle address from which the truth is retrieved.
    */
    function MakeInstantCounterBet(uint256 bettingPairId, int256 bettingEventScenario, uint256 bettingAmount, address instantBetResultAggrAddress) public payable
    {
        require(msg.value == bettingAmount, "Value is not equal to betting amount.");
        require(_bettingPairIdToPlayersPairMap[bettingPairId].bettingAmount > 0, "Betting pair Id is invalid.");
        require(_bettingPairIdToPlayersPairMap[bettingPairId].bettingAmount == bettingAmount, "Betting amount paid is not equal to amount for which the bet was made.");
        require(_bettingPairIdToPlayersPairMap[bettingPairId].externalOracleAddress == instantBetResultAggrAddress, "Bet not made against the same price feed.");
        require(_bettingPlayerInGame[msg.sender] == false, "Player already registered.");
        
        AggregatorV3Interface externalOracle = AggregatorV3Interface(instantBetResultAggrAddress);
        /*Get current value of entity. Hardcoding for ETH-USD price logic here.*/
        (/* uint80 roundID */, int256 curPrice, /* uint startedAt */, /* uint timeStamp */, /* uint80 answeredInRound */) 
            = externalOracle.latestRoundData();
        
        int256 better1PriceDelta = AbsDelta(_bettingPairIdToPlayersPairMap[bettingPairId].bettingPlayersChoices[0], curPrice);
        int256 better2PriceDelta = AbsDelta(bettingEventScenario, curPrice);
        
        if(better1PriceDelta < better2PriceDelta)
        {
            _bettingPairIdToPlayersPairMap[bettingPairId].bettingPlayers[0].transfer(2 * bettingAmount);
        }
        else if(better2PriceDelta < better1PriceDelta)
        {
            payable(msg.sender).transfer(2 * bettingAmount);
        }
        else if((better1PriceDelta == better2PriceDelta) && (better2PriceDelta == 0))
        {
            _bettingPairIdToPlayersPairMap[bettingPairId].bettingPlayers[0].transfer(bettingAmount);
            payable(msg.sender).transfer(bettingAmount);
        }
        else
        {
            /*You all lose money, ha ha ha.*/
        }
        
        /*Cleanup*/
        _instantBettingPairs -= 1;
        _bettingPlayerInGame[_bettingPairIdToPlayersPairMap[bettingPairId].bettingPlayers[0]] = false;
        delete _bettingPairIdToPlayersPairMap[bettingPairId];
    }
    
    function AbsDelta(int256 betterAmount, int256 truthAmount) internal pure returns (int256)
    {
        int256 betterPriceDelta = 0;
        if(betterAmount >= truthAmount)
        {
            betterPriceDelta = betterAmount - truthAmount;
        }
        else
        {
            betterPriceDelta = truthAmount - betterAmount;
        }
        return betterPriceDelta;
    }
    
    function GetAllBets() public view returns (BettingPair [] memory)
    {
        BettingPair[] memory bettingPairsArray = new BettingPair[](_bettingPairIdCounter);
        
        uint256 i = 0;
        for(i = 1; i <= _bettingPairIdCounter; i+=1)
        {
            bettingPairsArray[i - 1] = _bettingPairIdToPlayersPairMap[i];
        }
        return bettingPairsArray;
    }
    
    function GetAllInstantBets() public view returns (BettingPair [] memory)
    {
        BettingPair[] memory bettingPairsArray = new BettingPair[](_instantBettingPairs);
        
        uint256 i = 0;
        uint256 j = 0;
        for(i = 1; i <= _bettingPairIdCounter; i+=1)
        {
            if(_bettingPairIdToPlayersPairMap[i].isInstantBet == true)
            {
                bettingPairsArray[j] = _bettingPairIdToPlayersPairMap[i];
                j += 1;
            }
        }
        return bettingPairsArray;
    }
    
    /* Ideally the information passed as arguments should come from chainlink*/
    function EndBettingEvent(uint256 bettingEventId, int256 winBettingEventScenario) public
    {
        require(msg.sender == _owner, "Only owner can end betting events.");
        require(_bettingEventMap[bettingEventId].isValid == true, "Betting event Id is invalid.");
        require((int256(_bettingEventMap[bettingEventId].bettingEventScenarios.length) > winBettingEventScenario) && (winBettingEventScenario >= 0), "Event scenario invalid.");
        require(_bettingEventIdToPairIdMap[bettingEventId].length > 0, "No bets made for betting event id.");
        
        uint32 i = 0;
        for(i = 0; i < _bettingEventIdToPairIdMap[bettingEventId].length; i+=1)
        {
            BettingPair memory bPair = _bettingPairIdToPlayersPairMap[_bettingEventIdToPairIdMap[bettingEventId][i]];
            if (bPair.bettingPlayersChoices[0] == winBettingEventScenario)
            {
                if(_bettingPlayerInGame[bPair.bettingPlayers[1]] == true) /* Another player made a counter bet*/
                {
                    bPair.bettingPlayers[0].transfer(2 * bPair.bettingAmount);
                }
                else /* Give the amount back if there was only one player who made the bet.*/
                {
                    bPair.bettingPlayers[0].transfer(bPair.bettingAmount);
                }
            }
            else if(bPair.bettingPlayersChoices[1] == winBettingEventScenario)
            {
                if(_bettingPlayerInGame[bPair.bettingPlayers[1]] == true) /* Ensure that there is a second player.*/
                {
                    bPair.bettingPlayers[1].transfer(2 * bPair.bettingAmount);
                }
            }
            else
            {}
            /*Mark players as having finished the current bet.*/
            _bettingPlayerInGame[bPair.bettingPlayers[0]] = false;
            _bettingPlayerInGame[bPair.bettingPlayers[1]] = false;
            
            delete _bettingPairIdToPlayersPairMap[_bettingEventIdToPairIdMap[bettingEventId][i]];
        }
        delete _bettingEventIdToPairIdMap[bettingEventId];
        delete _bettingEventMap[bettingEventId];
    }
}