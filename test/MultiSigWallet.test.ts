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

  it('When execute should should emit event and update balances', async () => {
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
    await contract.connect(owners[2]).approve(txId);

    await expect(contract.execute(txId))
      .to.emit(contract, 'Execute')
      .withArgs(txId);
    expect((await contract.transactions(txId))[3]);
    expect(await waffle.provider.getBalance(contract.address)).to.equal(contractPreviousBalance.sub(value));
    expect(await to.getBalance()).to.equal(toPreviousBalance.add(value));
  });
});