import * as dotenv from 'dotenv';

dotenv.config();

module.exports = [
    [
        process.env.ACCOUNT_ONE_ADDRESS,
        process.env.ACCOUNT_TWO_ADDRESS,
        process.env.ACCOUNT_THREE_ADDRESS
    ],
    1
];