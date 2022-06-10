import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { MultiSigWalletFactory } from '../typechain-types';
import { MultiSigWallet } from '../typechain-types';

describe('MultiSigWalletFactory', () => {
  let contract: MultiSigWalletFactory;
  let owners: SignerWithAddress[];
  const numberOfOwners: number = 4;
  const required: number = 1;

  beforeEach(async () => {
    owners = (await ethers.getSigners()).slice(0, numberOfOwners);

    const MultiSigWalletFactory = await ethers.getContractFactory('MultiSigWalletFactory');
    contract = await MultiSigWalletFactory.deploy();
    await contract.deployed();
  })

  it('Should deploy correctly', async () => {
    //TODO
  });

  it('When creating MultiSigWallet should deploy new MultiSigWallet contract and emit NewWallet event', async () => {
    await expect(contract.create(owners.map(owner => owner.address), required))
      .to.emit(contract, 'NewWallet');
  });

  it('When creating MultiSigWallet should deploy new MultiSigWallet contract correctly', async () => {
    const crateTx = await contract.create(owners.map(owner => owner.address), required);
    const txResult: any = await crateTx.wait();
    const newMultiSigWalletAddress = txResult.events[0].args[0];

    const MultiSigWallet = await ethers.getContractFactory('MultiSigWallet');
    const newMultiSigWalletContract = await MultiSigWallet.attach(newMultiSigWalletAddress);

    owners.forEach(async (owner, i) => {
      expect(await newMultiSigWalletContract.owners(i)).to.equal(owner.address);
    });
    expect(await newMultiSigWalletContract.required()).to.equal(required);
  });
})