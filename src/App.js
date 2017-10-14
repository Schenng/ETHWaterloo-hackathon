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
      makerInputAddress: "",
      takerInputAddress: "",

    }
    this.handleMakerInputChange = this.handleMakerInputChange.bind(this);
    this.handleTakerInputChange = this.handleTakerInputChange.bind(this);
    this.offer = this.offer.bind(this);
   this.buy = this.buy.bind(this);

  }

 
    offer(makerInputAddress) {
      (async () => {
      console.log("OFFER")

      const DECIMALS = 18; 

        // Addresses
      const NULL_ADDRESS = ZeroEx.NULL_ADDRESS;                                    // Ethereum Null address
      const WETH_ADDRESS = await zeroEx.etherToken.getContractAddressAsync();      // The wrapped ETH token contract
      const ZRX_ADDRESS  = await zeroEx.exchange.getZRXTokenAddressAsync();        // The ZRX token contract
      const EXCHANGE_ADDRESS   = await zeroEx.exchange.getContractAddressAsync();  // The Exchange.sol address (0x exchange smart contract)
      const accounts =  await zeroEx.getAvailableAddressesAsync();

      console.log(accounts);


        // Unlimited allowances to 0x contract for maker
        const txHashAllowMaker = await zeroEx.token.setUnlimitedProxyAllowanceAsync(ZRX_ADDRESS,  makerInputAddress); 
        await zeroEx.awaitTransactionMinedAsync(txHashAllowMaker);


        // Generate order
        const order = { 
          maker: makerInputAddress, 
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
        const ecSignature = await zeroEx.signOrderHashAsync(orderHash, makerInputAddress);

        // Appending signature to order
        const signedOrder = { 
                   ...order, 
                   ecSignature, 
                            };

        this.setState({signedOrders: signedOrder})

        })().catch(console.log);
  
  }

  buy(signedOrder, takerInputAddress) {
    (async () => {
      console.log("BUY")
      const DECIMALS = 18; 
      console.log('takerInputAddress')
      console.log(takerInputAddress)
       const WETH_ADDRESS = await zeroEx.etherToken.getContractAddressAsync();  
              // Unlimited allowances to 0x contract for taker
        const txHashAllowTaker = await zeroEx.token.setUnlimitedProxyAllowanceAsync(WETH_ADDRESS, takerInputAddress);
        await zeroEx.awaitTransactionMinedAsync(txHashAllowTaker);

        // Convert 1 to base unit 16
        const ethToConvert = ZeroEx.toBaseUnitAmount(new BigNumber(1), DECIMALS); 

        // Change ETH to WETH
        const txHashWETH = await zeroEx.etherToken.depositAsync(ethToConvert, takerInputAddress);

        //Mine the transaction that converts ETH to WETH
        await zeroEx.awaitTransactionMinedAsync(txHashWETH);

        // Verify if order is fillable
        await zeroEx.exchange.validateOrderFillableOrThrowAsync(signedOrder);

        //Try to fill order
        const shouldThrowOnInsufficientBalanceOrAllowance = true;
        const fillTakerTokenAmount = ZeroEx.toBaseUnitAmount(new BigNumber(0.1), DECIMALS);

        // Try filling order
        const txHash = await zeroEx.exchange.fillOrderAsync(signedOrder, fillTakerTokenAmount, 
                                                                  shouldThrowOnInsufficientBalanceOrAllowance, takerInputAddress,);
                                                            
        // Transaction Receipt
        const txReceipt = await zeroEx.awaitTransactionMinedAsync(txHash);
        console.log(txReceipt.logs);

        })().catch(console.log);
  }


  handleMakerInputChange(event) {
    this.setState({makerInputAddress: event});
  }

  handleTakerInputChange(event) {
    this.setState({takerInputAddress: event});
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
              label="Taker address"
              helpText="Input address you want your tokens to be deposited."
              value={this.state.takerInputAddress}
              onChange={(event)=> this.handleTakerInputChange(event)}
              type="text"
            />
          </Card.Section>
          <Card.Section>
            <TextField
              label="Maker address"
              helpText="Input address you want any leftover tokens to be sent to."
              value={this.state.makerInputAddress}
              onChange={(event)=> this.handleMakerInputChange(event)}
              type="text"
            />
          </Card.Section>
          <Card.Section>
          <Button primary onClick={()=> this.offer(this.state.makerInputAddress)}>Offer</Button>
          <Button destructive onClick={()=>this.buy(this.state.signedOrders,this.state.takerInputAddress)}>Buy</Button>
          </Card.Section>
        </Card>
      </Page>
    );
  }
}

export default App;
