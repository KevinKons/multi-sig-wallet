// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import './MultiSigWallet.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

contract MultiSigWalletFactory is Ownable {

    event NewWallet(address);
    event WithDraw(address destiny, uint value);
    event Donation(address donor, uint value, bytes msg);

    receive() external payable {
        emit Donation(_msgSender(), msg.value, "");
    }

    fallback() external payable {
        emit Donation(_msgSender(), msg.value, _msgData());
    }

    function create(address[] calldata owners, uint required) external payable returns (address deployedAt) {
        MultiSigWallet multiSigWallet = new MultiSigWallet(owners, required);
        deployedAt = address(multiSigWallet);
        emit NewWallet(deployedAt);
    }

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }

    function withDraw() external onlyOwner {
        emit WithDraw(_msgSender(), address(this).balance);
        payable(_msgSender()).transfer(address(this).balance);
    }
    
}