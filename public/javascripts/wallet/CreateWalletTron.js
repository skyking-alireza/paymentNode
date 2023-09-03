const TronWeb = require('tronweb');
const {Mongodb} = require("../connections/mongodb");
const CreateWalletTron = async ({username}) => {
    const clinet = Mongodb();
    const db = clinet.db('rosebet');
    const collection = db.collection('tronwallet');
    var query = {username: username};
    const countbyemail = await collection.countDocuments(query);
    if (!countbyemail) {
        const HttpProvider = TronWeb.providers.HttpProvider;
        const FullNode = new HttpProvider('https://api.trongrid.io');
        const SolidityNode = new HttpProvider('https://api.trongrid.io');
        const EventSever = new HttpProvider('https://api.trongrid.io');
        const tronWeb = new TronWeb(FullNode, SolidityNode, EventSever);
        const newWallet = tronWeb.createAccount();
        var baseaddress = await newWallet.then((e) => {
            return e
        })
        baseaddress.username = username;
        const wallet = await collection.insertOne(baseaddress);
        return baseaddress
    }else {
        const wallet = await collection.findOne(query);
        return wallet
    }
}
module.exports = {CreateWalletTron}
