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
import trade from './trade.js';

const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const zeroEx = new ZeroEx(provider);
let WETH_ADDRESS;
let ZRX_ADDRESS


class App extends Component {

   constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);

  }

    handleClick(e) {
      (async () => {
           WETH_ADDRESS = await zeroEx.etherToken.getContractAddressAsync();      // The wrapped ETH token contract
           ZRX_ADDRESS  = await zeroEx.exchange.getZRXTokenAddressAsync();
            zeroEx.getAvailableAddressesAsync()
        .then(function(availableAddresses) {

         const makerAddress = availableAddresses[0];
         const takerAddress = availableAddresses[1]

        trade(zeroEx, WETH_ADDRESS, ZRX_ADDRESS, makerAddress, takerAddress);
      })
      .catch(function(error) {
        console.log('Caught error: ', error);
       });

      })().catch(console.log);



  }
  render() {
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
          <Button primary>Buy</Button>
          <Button destructive>Sell</Button>
          </Card.Section>
        </Card>
      </Page>
    );
  }
}

export default App;
