import React, { Component } from 'react';

import '@shopify/polaris/styles.css';
import {
  Layout,
  Page,
  Card,
  Button,
  TextField,
} from '@shopify/polaris';

import Web3 from 'web3';
import {ZeroEx} from '0x.js';
import BigNumber from 'bignumber.js';
import trade from './trade.js';

const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const zeroEx = new ZeroEx(provider);
let WETH_ADDRESS;
let ZRX_ADDRESS


class App extends Component {

   constructor(props) {
    super(props);
      this.state = {
      signedOrders: null,
      takerAddress: null
    }
    this.buy = this.buy.bind(this);
   this.sell = this.sell.bind(this);

  }

 
    buy(e) {
      (async () => {
      console.log("BUY")

      const DECIMALS = 18; 

        // Addresses
      const NULL_ADDRESS = ZeroEx.NULL_ADDRESS;                                    // Ethereum Null address
      const WETH_ADDRESS = await zeroEx.etherToken.getContractAddressAsync();      // The wrapped ETH token contract
      const ZRX_ADDRESS  = await zeroEx.exchange.getZRXTokenAddressAsync();        // The ZRX token contract
      const EXCHANGE_ADDRESS   = await zeroEx.exchange.getContractAddressAsync();  // The Exchange.sol address (0x exchange smart contract)
      const accounts =  await zeroEx.getAvailableAddressesAsync();
      const makerAddress = accounts[0];
      const takerAddress = accounts[1];

      console.log(makerAddress);
      console.log(takerAddress);


        // Unlimited allowances to 0x contract for maker
        const txHashAllowMaker = await zeroEx.token.setUnlimitedProxyAllowanceAsync(ZRX_ADDRESS,  makerAddress); 
        await zeroEx.awaitTransactionMinedAsync(txHashAllowMaker);

        // Unlimited allowances to 0x contract for taker
        const txHashAllowTaker = await zeroEx.token.setUnlimitedProxyAllowanceAsync(WETH_ADDRESS, takerAddress);
        await zeroEx.awaitTransactionMinedAsync(txHashAllowTaker);

        // Convert 1 to base unit 16
        const ethToConvert = ZeroEx.toBaseUnitAmount(new BigNumber(1), DECIMALS); 

        // Change ETH to WETH
        const txHashWETH = await zeroEx.etherToken.depositAsync(ethToConvert, takerAddress);

        //Mine the transaction that converts ETH to WETH
        await zeroEx.awaitTransactionMinedAsync(txHashWETH);

        // Generate order
        const order = { 
          maker: makerAddress, 
          taker: NULL_ADDRESS,
          feeRecipient: NULL_ADDRESS,
          makerTokenAddress: ZRX_ADDRESS,
          takerTokenAddress: WETH_ADDRESS,
          exchangeContractAddress: EXCHANGE_ADDRESS,
          salt: ZeroEx.generatePseudoRandomSalt(),
          makerFee: new BigNumber(0),
          takerFee: new BigNumber(0),
          makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(0.2), DECIMALS),  // Base 18 decimals
          takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(0.3), DECIMALS),  // Base 18 decimals
          expirationUnixTimestampSec: new BigNumber(Date.now() + 3600000),          // Valid up to an hour
        };

        // Create orderHash
        const orderHash = ZeroEx.getOrderHashHex(order);

        // Signing orderHash -> ecSignature
        const ecSignature = await zeroEx.signOrderHashAsync(orderHash, makerAddress);

        // Appending signature to order
        const signedOrder = { 
                   ...order, 
                   ecSignature, 
                            };

        this.setState({signedOrders: signedOrder})
        this.setState({takerAddress: takerAddress})

        })().catch(console.log);
  
  }

  sell(signedOrder, takerAddress) {
    (async () => {
      console.log("SELL")
      const DECIMALS = 18; 

        // Verify if order is fillable
        await zeroEx.exchange.validateOrderFillableOrThrowAsync(signedOrder);

        //Try to fill order
        const shouldThrowOnInsufficientBalanceOrAllowance = true;
        const fillTakerTokenAmount = ZeroEx.toBaseUnitAmount(new BigNumber(0.1), DECIMALS);

        // Try filling order
        const txHash = await zeroEx.exchange.fillOrderAsync(signedOrder, fillTakerTokenAmount, 
                                                                  shouldThrowOnInsufficientBalanceOrAllowance, takerAddress,);
                                                            
        // Transaction Receipt
        const txReceipt = await zeroEx.awaitTransactionMinedAsync(txHash);
        console.log(txReceipt.logs);

        })().catch(console.log);
  }


  render() {
    console.log(this.state)
    return (
      <Page
        title="0x shapeshift"
    >
        <Card title="ERC20 Swap">
          <Card.Section>
            <TextField
              label="Sell amount"
              type="number"
              helpText="Input the amount of tokens you want to sell."
            />
          </Card.Section>
          <Card.Section>
            <TextField
              label="Destination address"
              helpText="Input address you want your tokens to be deposited."
            />
          </Card.Section>
          <Card.Section>
            <TextField
              label="Refund address"
              helpText="Input address you want any leftover tokens to be sent to."
            />
          </Card.Section>
          <Card.Section>
          <Button primary onClick={()=> this.buy()}>Buy</Button>
          <Button destructive onClick={()=>this.sell(this.state.signedOrders,this.state.takerAddress)}>Sell</Button>
          </Card.Section>
        </Card>
      </Page>
    );
  }
}

export default App;
