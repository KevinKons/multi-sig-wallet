import * as dotenv from 'dotenv';

import { HardhatUserConfig } from 'hardhat/config';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import 'solidity-coverage';
import 'hardhat-gas-reporter';

dotenv.config();

const ROPSTEN_URL: any = process.env.ROPSTEN_URL;
const ACCOUNT_ONE: any = process.env.ACCOUNT_ONE;
const ROPSTEN_ETHERSCAN_API_KEY: any = process.env.ROPSTEN_ETHERSCAN_API_KEY;
const GAS_REPORTER_ENABLED: any = process.env.GAS_REPORTER_ENABLED;

const config: HardhatUserConfig = {
  solidity: "0.8.10",
  networks: {
    ropsten: {
      url: ROPSTEN_URL,
      accounts: [ACCOUNT_ONE]
    }
  },
  etherscan: {
    apiKey: {
      ropsten: ROPSTEN_ETHERSCAN_API_KEY
    }
  },
  gasReporter: {
    currency: 'ETH',
    gasPrice: 21,
    enabled: GAS_REPORTER_ENABLED === '1'
  }
};

export default config;
