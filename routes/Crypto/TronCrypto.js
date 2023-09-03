var express = require('express');
const cors = require('cors');
require('dotenv').config();
const TronWeb = require("tronweb");
const { TronWalles, TronDeposits, TronWithdrawals } = require('../../public/javascripts/CryptoManager/TronSchema');
const { parseJwt } = require('../../public/javascripts/pareseJWT');
const { default: axios } = require('axios');
var router = express.Router();
router.use(cors())
router.get('/CreateWallet/', async (req, res) => {
    if(req.headers.authorization !== undefined){
        const UserWallet = await TronWalles.findOne({username: parseJwt(req.headers.authorization).email})
        if (!UserWallet) {
            const HttpProvider = TronWeb.providers.HttpProvider;
            const FullNode = new HttpProvider('https://api.trongrid.io');
            const SolidityNode = new HttpProvider('https://api.trongrid.io');
            const EventSever = new HttpProvider('https://api.trongrid.io');
            const tronWeb = new TronWeb(FullNode, SolidityNode, EventSever);
            const NewWallet = await tronWeb.createAccount();
            NewWallet.username = 'www.salirezasaberi.com@gmail.com'
            const CreateWallet = await TronWalles.create(NewWallet)
            CreateWallet.save()
            res.send({address: CreateWallet.address.base58})
            return ()=>{}
        }else {
            return res.send({address: UserWallet.address.base58})
        }
    }else{
        console.log(req.headers);
        res.send({text: 'Please first login and try again'})
    }
    
})
router.post('/TronGetBalance/', async (req, res) => {
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
    const wallet = await TronWalles.findOne(query)
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
                    const NewTronDeposits = await new TronDeposits.create({AddressSender:wallet.address.base58,AddressReceiver:process.env.TronPublickey,Amount:amount ,txID:Transaction.transaction.txID,User:parseJwt(req.headers.authorization).user_id})
                    NewTronDeposits.save()
                    TronWalles.deleteOne(query)
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
router.get('/Tronwithdrawal/', async (req, res) => {
    const HttpProvider = TronWeb.providers.HttpProvider;
    const FullNode = new HttpProvider('https://api.trongrid.io');
    const SolidityNode = new HttpProvider('https://api.trongrid.io');
    const EventSever = new HttpProvider('https://api.trongrid.io');
    const tronWeb = new TronWeb(FullNode, SolidityNode, EventSever);
    const Withdrawals = await TronWithdrawals.create({AddressSender:process.env.TronPublickey,AddressReceiver:process.env.TronPublickey,User:'www.salirezasaberi.com@gmail.com',txID:process.env.TronPublickey,Time:Number(new Date()),Amount:120000})
    Withdrawals.save()
    res.send({data: 'User or wallet not found '})
})
module.exports = router