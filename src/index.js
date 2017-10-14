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

// Instantiate 0x.js instance
const zeroEx = new ZeroEx(provider);

(async () => {

	// Number of decimals to use (for ETH and ZRX)
	const DECIMALS = 18; 

	// Addresses
	const NULL_ADDRESS = ZeroEx.NULL_ADDRESS;                                    // Ethereum Null address
	const WETH_ADDRESS = await zeroEx.etherToken.getContractAddressAsync();      // The wrapped ETH token contract
	const ZRX_ADDRESS  = await zeroEx.exchange.getZRXTokenAddressAsync();        // The ZRX token contract
	const EXCHANGE_ADDRESS   = await zeroEx.exchange.getContractAddressAsync();  // The Exchange.sol address (0x exchange smart contract)

	// Getting list of accounts of the provider RPC
	const accounts =  await zeroEx.getAvailableAddressesAsync();
	console.log(accounts);

	// Set maker address
	const makerAddress = accounts[0];
	console.log("Maker Address" + makerAddress);

	//Set Taker 
	const takerAddress = accounts[1];
	console.log("Taker Address" + takerAddress);

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
	console.log("Signed Order:");
	console.log(order);
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


ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
