import * as dotenv from 'dotenv';

import { ethers } from 'hardhat';
import { MultiSigWalletFactory } from '../typechain-types';

dotenv.config();

const main = async () => {
  const MultiSigWalletFactory = await ethers.getContractFactory('MultiSigWalletFactory');
  const multiSigWalletFactory: MultiSigWalletFactory = await MultiSigWalletFactory.deploy();
  console.log('Deploying...');
  await multiSigWalletFactory.deployed();
  console.log('MultiSigWalletFactory deployed to:', multiSigWalletFactory.address);
}

main().catch((error) => {
  console.log(error);
  process.exitCode = 1;
});