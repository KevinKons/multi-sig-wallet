import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { MultiSigWalletFactory } from '../typechain-types';

describe('MultiSigWalletFactory', () => {
  let contract: MultiSigWalletFactory;
  let factoryOwner: SignerWithAddress;
  let owners: SignerWithAddress[];
  const numberOfOwners: number = 4;
  const required: number = 1;

  beforeEach(async () => {
    factoryOwner = (await ethers.getSigners())[0];
    owners = (await ethers.getSigners()).slice(1, numberOfOwners + 1);

    const MultiSigWalletFactory = await ethers.getContractFactory('MultiSigWalletFactory');
    contract = await MultiSigWalletFactory.deploy();
    await contract.deployed();
  })

  it('Should deploy correctly', async () => {
    expect(await contract.owner()).to.equal(factoryOwner.address); 

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

  it('When sending transaction with no data should hit receive() and emit event with no data', async () => {
    const from: SignerWithAddress = owners[1]; 
    const value = ethers.utils.parseEther('3');
    const tx = {
      to: contract.address,
      value: value
    }

    await expect(from.sendTransaction(tx))
      .to.emit(contract, 'Donation')
      .withArgs(from.address, value, '0x');
    expect(await contract.getBalance()).to.equal(value);
  });

  it('When sending transaction with no data should hit fallback() and emit event data', async () => {
    const from: SignerWithAddress = owners[1]; 
    const value = ethers.utils.parseEther('3');
    const data = '0x1234'
    const tx = {
      to: contract.address,
      value: value,
      data: data
    }

    await expect(from.sendTransaction(tx))
      .to.emit(contract, 'Donation')
      .withArgs(from.address, value, data);
    expect(await contract.getBalance()).to.equal(value);
  });

  it('When sending transaction with no data should hit fallback() and emit event data', async () => {
    const from: SignerWithAddress = owners[1]; 
    const value = ethers.utils.parseEther('3');
    const data = '0x1234'
    const tx = {
      to: contract.address,
      value: value,
      data: data
    }

    await expect(from.sendTransaction(tx))
      .to.emit(contract, 'Donation')
      .withArgs(from.address, value, data);
    expect(await contract.getBalance()).to.equal(value);
  });

  it('When withdrawing should emit event and transfer all funds from the factory contract', async () => {
    const from: SignerWithAddress = owners[1]; 
    const value = ethers.utils.parseEther('3');
    const tx = {
      to: contract.address,
      value: value,
    };
    
    await from.sendTransaction(tx);
    const contractPreviousBalance = await contract.getBalance();

    await expect(await contract.withdraw())
      .to.emit(contract, 'Withdraw')
      .withArgs(factoryOwner.address, contractPreviousBalance);
    expect(await contract.getBalance()).to.equal(0);
  });

  it('When withdrawing not being the owner should revert', async () => {
    await expect(contract.connect(owners[0]).withdraw())
      .to.be.revertedWith('Ownable: caller is not the owner');
  });
})