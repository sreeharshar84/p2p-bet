const BetContractV3 = artifacts.require('BetContractV3')

module.exports = async (deployer, network, [defaultAccount]) => {
    // currently hardcoded for Kovan
    try {
        await deployer.deploy(BetContractV3, "chain_gang", { from: defaultAccount })
    } catch (err) {
        console.error(err)
    }
}
