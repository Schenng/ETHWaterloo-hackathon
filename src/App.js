import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

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
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
     <button href="#" onClick={this.handleClick}>
      Click me
    </button>
      </div>
    );
  }
}

export default App;
