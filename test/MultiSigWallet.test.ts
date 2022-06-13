import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';
import { MultiSigWallet } from '../typechain-types';

describe('MultiSigWallet', () => {
  let contract : MultiSigWallet;
  const numberOfOwners: number = 3;
  let owners: SignerWithAddress[]; 

  beforeEach(async () => {
    owners = (await ethers.getSigners()).slice(0, numberOfOwners);
    const MultiSigWalletFactory = await ethers.getContractFactory('MultiSigWallet');
    contract = await MultiSigWalletFactory.deploy(owners.map(owner => owner.address), 2);
    await contract.deployed();
  });

  it('Should deploy correctly', async () => {
    await expect(contract.owners(numberOfOwners)).to.be.reverted;
    owners.forEach(async (owner, i) => {
      expect(await contract.owners(i)).to.equal(owner.address);
      expect(await contract.isOwner(owner.address));
    });
    expect(await contract.required()).to.equal(2);
  });

  it('When receiving money should emit event and update balance', async () => {
    const value = ethers.utils.parseEther('3');
    const tx = {
      to: contract.address,
      value: value
    }
    await expect(owners[1].sendTransaction(tx))
      .to.emit(contract, 'Deposit')
      .withArgs(owners[1].address, value);
      
    const balanceResult = await waffle.provider.getBalance(contract.address);
    expect(balanceResult).to.equal(value);
  });

  it('When submiting should add to transactions list and emit event', async () => {
    const abi = [
      "function transfer(string x)"
    ]
    const abiInterface = new ethers.utils.Interface(abi);

    const to = (await ethers.getSigners())[numberOfOwners].address;
    const value = ethers.utils.parseEther('3');
    const data = abiInterface.encodeFunctionData("transfer", ["call foo"]);

    await expect(contract.submit(to, value, data))
      .to.emit(contract, 'Submit')
      .withArgs(0);

    const transaction = await contract.transactions(0);
    expect(transaction.at(0)).to.equal(to);
    expect(transaction.at(1)).to.equal(value);
    expect(transaction.at(2)).to.equal(data);
    expect(transaction.at(3)).to.equal(false);
  });

  it('When approve should emit event and add to update approved mapping to true', async () => {
    const abi = [
      "function transfer(string x)"
    ]
    const abiInterface = new ethers.utils.Interface(abi);

    const to = (await ethers.getSigners())[numberOfOwners].address;
    const value = ethers.utils.parseEther('3');
    const data = abiInterface.encodeFunctionData("transfer", ["call foo"]);
    await contract.submit(to, value, data);

    const txId = 0;
    await expect(contract.approve(txId))
      .to.emit(contract, 'Approve')
      .withArgs(owners[0].address, txId);
    expect(await contract.approved(txId, owners[0].address));
  });

  it('When revoking should emit event and add to update approved mapping to false', async () => {
    const abi = [
      "function transfer(string x)"
    ]
    const abiInterface = new ethers.utils.Interface(abi);

    const to = (await ethers.getSigners())[numberOfOwners].address;
    const value = ethers.utils.parseEther('3');
    const data = abiInterface.encodeFunctionData("transfer", ["call foo"]);
    await contract.submit(to, value, data);
    const txId = 0;
    await contract.approve(txId);

    await expect(contract.revoke(txId))
      .to.emit(contract, 'Revoke')
      .withArgs(owners[0].address, txId);
    expect(await contract.approved(txId, owners[0].address)).to.be.false;
  });

  it('When execute should emit event and update balances', async () => {
    const value = ethers.utils.parseEther('3');
    const tx = {
      to: contract.address,
      value: value
    }
    await owners[1].sendTransaction(tx);

    const abi = [
      "function anyFunc()"
    ]
    const abiInterface = new ethers.utils.Interface(abi);

    const to = (await ethers.getSigners())[numberOfOwners];
    const toPreviousBalance = await to.getBalance();
    const contractPreviousBalance = await waffle.provider.getBalance(contract.address);
    const data = abiInterface.encodeFunctionData("anyFunc");
    await contract.submit(to.address, value, data);
    const txId = 0;
    await contract.approve(txId);
    await contract.connect(owners[1]).approve(txId);

    await expect(contract.execute(txId))
      .to.emit(contract, 'Execute')
      .withArgs(txId);
    expect((await contract.transactions(txId))[3]);
    expect(await waffle.provider.getBalance(contract.address)).to.equal(contractPreviousBalance.sub(value));
    expect(await to.getBalance()).to.equal(toPreviousBalance.add(value));
  });


  describe('Failure Tests', () => {
    it('When deploying with empty owners array should revert with "Owners required"', async () => {
      const MultiSigWalletFactory = await ethers.getContractFactory('MultiSigWallet');
      await expect(MultiSigWalletFactory.deploy([], 2))
        .to.be.revertedWith('Owners required')
    });

    it('When deploying if required is 0 should revert with "Invalid required numbers of owners"', async () => {
      const MultiSigWalletFactory = await ethers.getContractFactory('MultiSigWallet');
      await expect(MultiSigWalletFactory.deploy(owners.map(owner => owner.address), 0))
        .to.be.revertedWith('Invalid required numbers of owners')
    });

    it('When deploying if required is bigger than owners.length should revert with "Invalid required numbers of owners"', async () => {
      const MultiSigWalletFactory = await ethers.getContractFactory('MultiSigWallet');
      await expect(MultiSigWalletFactory.deploy(owners.map(owner => owner.address), 4))
        .to.be.revertedWith('Invalid required numbers of owners')
    });

    it('When deploying if owner is zero address should revert with "Invalid owner"', async () => {
      const MultiSigWalletFactory = await ethers.getContractFactory('MultiSigWallet');
      await expect(MultiSigWalletFactory.deploy(owners.map(owner => owner.address).concat(ethers.constants.AddressZero), 4))
        .to.be.revertedWith('Invalid owner')
    });

    it('When deploying if owner is duplicated at owners array should revert with "Owner is already added"', async () => {
      const MultiSigWalletFactory = await ethers.getContractFactory('MultiSigWallet');
      await expect(MultiSigWalletFactory.deploy(owners.map(owner => owner.address).concat(owners[0].address), 4))
        .to.be.revertedWith('Owner is already added')
    });

    it('When submiting if caller is not owner should revert with "Not owner"', async () => {  
      const notOwner = (await ethers.getSigners())[numberOfOwners + 1];
      const to = (await ethers.getSigners())[numberOfOwners].address;

      await expect(contract.connect(notOwner).submit(to, 1, '0x'))
        .to.be.revertedWith('Not owner');
    });

    it('When executing if approvals is not bigger than required should revert with "approvals < required"', async () => {  
      const to = (await ethers.getSigners())[numberOfOwners];
      await contract.submit(to.address, 1, '0x');

      await expect(contract.execute(0))
        .to.be.revertedWith('approvals < required');
    });

    it('When proposed transaction is not viable should revert with "Tx failed"', async () => {
      const value = ethers.utils.parseEther('3');
      const tx = {
        to: contract.address,
        value: value.sub(1)
      }
      await owners[1].sendTransaction(tx);
  
      const abi = [
        "function anyFunc()"
      ]
      const abiInterface = new ethers.utils.Interface(abi);
  
      const to = (await ethers.getSigners())[numberOfOwners];
      const data = abiInterface.encodeFunctionData("anyFunc");
      await contract.submit(to.address, value, data);
      const txId = 0;
      await contract.approve(txId);
      await contract.connect(owners[1]).approve(txId);
      await contract.connect(owners[2]).approve(txId);
  
      await expect(contract.execute(txId))
        .to.be.revertedWith('Tx failed');
    });

    it('When voting if proposal doesn\'t existed should revert with "Tx does not exists"', async () => {
      await expect(contract.revoke(0))
        .to.be.revertedWith('Tx does not exists')
    });

    it('When voting if proposal was already executed should revert with "Transaction already executed"', async () => {
      const value = ethers.utils.parseEther('3');
      const tx = {
        to: contract.address,
        value: value
      }
      await owners[1].sendTransaction(tx);

      const abi = [
        "function anyFunc()"
      ]
      const abiInterface = new ethers.utils.Interface(abi);

      const to = (await ethers.getSigners())[numberOfOwners];
      const data = abiInterface.encodeFunctionData("anyFunc");
      const txId = 0;

      await contract.submit(to.address, value, data);
      await contract.approve(txId);
      await contract.connect(owners[1]).approve(txId);
      await contract.connect(owners[2]).approve(txId);
      await contract.execute(txId);

      await expect(contract.execute(txId))
        .to.be.revertedWith('Transaction already executed');
    });

    it('When voting if proposal was already approved by owner should revert with "Tx already approved"', async () => {
      const to = (await ethers.getSigners())[numberOfOwners];

      await contract.submit(to.address, 1, '0x');
      await contract.approve(0);

      await expect(contract.approve(0))
        .to.be.revertedWith('Tx already approved');
    });

    it('When revoking if proposal wasn\'t already approved by owner should revert with "Tx not approved"', async () => {
      const to = (await ethers.getSigners())[numberOfOwners].address;
      await contract.submit(to, 1, '0x');
  
      await expect(contract.revoke(0))
        .to.be.revertedWith('Tx not approved')
    });
  });
});