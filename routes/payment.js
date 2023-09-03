var express = require('express');
require('dotenv').config();
const {CreateWalletTron} = require("../public/javascripts/wallet/CreateWalletTron");
const {Mongodb} = require("../public/javascripts/connections/mongodb");
const cors = require('cors');
const {parseJwt} = require("../public/javascripts/pareseJWT");
const TronWeb = require("tronweb");
const axios = require("axios");
const { TronDeposits, TronWalles } = require('../public/javascripts/CryptoManager/TronSchema');
var router = express.Router();
router.use(cors())
router.get('/Tron/', async (req, res) => {
    const wallet = await CreateWalletTron({username: parseJwt(req.headers.authorization).email});
    res.send({address: wallet.address.base58})
})
router.get('/test/', async (req, res) => {
    const clinet = Mongodb();
    const db = clinet.db('rosebet');
    const collection = db.collection('tronwallet');
    var query = {username: "www.salirezasaberi.com@gmail.com"};
    await collection.deleteMany(query, (err, collection) => {
        if (err) throw err;
        console.log(collection.result.n + " Record(s) deleted successfully");
        console.log(collection);
        db.close();
    });
    res.send({data: 'sakam'})
})
router.post('/TronCheck/', async (req, res) => {
    const HttpProvider = TronWeb.providers.HttpProvider;
    const FullNode = new HttpProvider('https://api.trongrid.io');
    const SolidityNode = new HttpProvider('https://api.trongrid.io');
    const EventSever = new HttpProvider('https://api.trongrid.io');
    const tronWeb = new TronWeb(FullNode, SolidityNode, EventSever);
    var query = {username: parseJwt(req.headers.authorization).email, "address.base58": req.body.wallet};
    if (await TronWalles.countDocuments(query)) {
        const wallet = await tronWeb.trx.getBalance(req.body.wallet)
        res.send({data: wallet})
    } else {
        res.send({data: 'User or wallet not found '})
    }
})
router.post('/SubmitTron/', async (req, res) => {
    const HttpProvider = TronWeb.providers.HttpProvider;
    const FullNode = new HttpProvider('https://api.trongrid.io');
    const SolidityNode = new HttpProvider('https://api.trongrid.io');
    const EventSever = new HttpProvider('https://api.trongrid.io');
    const tronWeb = new TronWeb(FullNode, SolidityNode, EventSever);
    var query = {username: parseJwt(req.headers.authorization).email, "address.base58": req.body.wallet};
    const wallet = await TronDeposits.findOne(query)
    if (wallet) {
        const amount = await tronWeb.trx.getBalance(req.body.wallet)
        const Transaction = await tronWeb.trx.sendTransaction(process.env.TronPublickey, amount, wallet.privateKey);
        if (Transaction.result) {
            axios(`${process.env.Django}/main/amount/`, {
                method: 'POST',
                data: {
                    value: amount,
                    customer: parseJwt(req.headers.authorization).user_id,
                    crypto: 2
                }
            })
                .then(async ({data}) => {
                    const NewTronDeposits = await TronDeposits.create({
                        AddressSender: wallet.address.base58,
                        AddressReceiver: process.env.TronPublickey,
                        txID: Transaction.transaction.txID,   
                        Time: String(Number(new Date())),
                        Amount: amount,
                        User: parseJwt(req.headers.authorization).user_id,
                    })
                    NewTronDeposits.save()
                    collection.deleteOne(query)
                    res.send(data)
                })
                .catch(({response}) => {
                    res.send(response)
                })
        } else {
            res.send(Transaction)
        }
    } else {
        res.send({data: 'User or wallet not found '})
    }
})
module.exports = router