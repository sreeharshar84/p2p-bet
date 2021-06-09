const PriceConsumerV3 = artifacts.require('BetContractV2')

module.exports = async (deployer, network, [defaultAccount]) => {
    // currently hardcoded for Kovan
    try {
        await deployer.deploy(PriceConsumerV3, { from: defaultAccount })
    } catch (err) {
        console.error(err)
    }
}
