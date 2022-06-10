// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import './MultiSigWallet.sol';

contract MultiSigWalletFactory {

    event NewWallet(address);

    uint public whatever;

    function create(address[] calldata owners, uint required) external returns (address deployedAt) {
        MultiSigWallet multiSigWallet = new MultiSigWallet(owners, required);
        deployedAt = address(multiSigWallet);
        emit NewWallet(deployedAt);
        whatever = required;
    }
}