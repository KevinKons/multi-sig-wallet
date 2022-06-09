<br />
<p align="center">
  <img src="https://duckduckgo.com/i/ddebb07e.png" alt="Corda" width="90">
</p>

## About The Project

This project contains a multi signature wallet smart contract, it allows multiple signers to review and agree on an action on the blockchain before the action is executed. The project was inspired by a [video](https://www.youtube.com/watch?v=8ja72g_Dac4) of the Smart Contract Programmer youtube channel.

## Running the project

### Pre-Requisites
This project require `Node.js`. 

### Building the project

```
yarn
yarn hardhat clean
yarn hardhat compile
```

### Running tests
```
yarn hardhat test
```

### Running deploy scripts
```
yarn hardhat run scripts/deploy.js
```

### Running contracts verifications
```
yarn hardhat verify 
--network ropsten 
--constructor-args ./arguments.js 
--show-stack-traces 
<contract_address>
```

### Running test coverage
```
yarn hardhat coverage --testfiles "test/*.js" 
```