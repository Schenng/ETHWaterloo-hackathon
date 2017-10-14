import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import Web3 from 'web3';
import {ZeroEx} from '0x.js';
import BigNumber from 'bignumber.js';

// Default provider for TestRPC
const provider = new Web3.providers.HttpProvider('http://localhost:8545')
console.log(provider)

// Calling constructor
const zeroEx = new ZeroEx(provider);
console.log(zeroEx);	

//Number of decimals to use (for ETH and ZRX)
const DECIMALS = 18;

// Addresses
const NULL_ADDRESS = ZeroEx.NULL_ADDRESS;                              
const WETH_ADDRESS = zeroEx.etherToken.getContractAddressAsync();  	 
const ZRX_ADDRESS  = zeroEx.exchange.getZRXTokenAddressAsync();    	 
const EXCHANGE_ADDRESS = zeroEx.exchange.getContractAddressAsync(); 

const accounts =  zeroEx.getAvailableAddressesAsync().then(function() {
	

})


ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
