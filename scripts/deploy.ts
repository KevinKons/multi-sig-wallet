import * as dotenv from 'dotenv';

import { ethers } from 'hardhat';
import { MultiSigWallet } from '../typechain-types'

dotenv.config();

async function main() {
  const requiredVotes = 1;
  const ACCOUNT_ONE_ADDRESS: any = process.env.ACCOUNT_ONE_ADDRESS;
  const ACCOUNT_TWO_ADDRESS: any = process.env.ACCOUNT_TWO_ADDRESS;
  const ACCOUNT_THREE_ADDRESS: any = process.env.ACCOUNT_THREE_ADDRESS;
  const owners = [ACCOUNT_ONE_ADDRESS, ACCOUNT_TWO_ADDRESS, ACCOUNT_THREE_ADDRESS];
  console.log('owners', owners)

  const MultiSigWallet = await ethers.getContractFactory('MultiSigWallet');
  console.log('creating factory');
  const multiSigWallet: MultiSigWallet = await MultiSigWallet.deploy(owners, requiredVotes);
  console.log('deploying');
  await multiSigWallet.deployed();

  console.log('MultiSigWallet deployed to: ', multiSigWallet.address);
}

main().catch((error) => {
  console.log(error);
  process.exitCode = 1;
})