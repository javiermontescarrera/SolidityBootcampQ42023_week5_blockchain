import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { 
          Lottery__factory, 
          LotteryToken__factory, 
          Lottery, 
          LotteryToken 
        } from "../typechain-types";
import { getProvider, getWallet } from "./Helpers";
dotenv.config();

let contract: Lottery;
let token: LotteryToken;

const BET_PRICE = 1;
const BET_FEE = 0.2;
const TOKEN_RATIO = 1n;

async function main() {
    console.log(`START\n`);

    //receiving parameters
    const parameters = process.argv.slice(2);
    if (!parameters || parameters.length < 1)
      throw new Error("Not enough parameters supplied");
    const lotteryContractAddress = parameters[0];

    //inspecting data from public blockchains using RPC connections (configuring the provider)
    const provider = getProvider();
    const lastBlock = await provider.getBlock("latest");
    const lastBlockNumber = lastBlock?.number;
    console.log(`Last block number: ${lastBlockNumber}`);
    const lastBlockTimestamp = lastBlock?.timestamp ?? 0;
    const lastBlockDate = new Date(lastBlockTimestamp * 1000);
    console.log(
      `Last block timestamp: ${lastBlockTimestamp} (${lastBlockDate.toLocaleDateString()} ${lastBlockDate.toLocaleTimeString()})`
    );

    //configuring the wallet 
    const wallet = getWallet(provider);
    const balanceBN = await provider.getBalance(wallet.address);
    const balance = Number(ethers.formatUnits(balanceBN));
    console.log(`Wallet balance ${balance} ETH`);
    if (balance < 0.01) {
      throw new Error("Not enough ether");
    }

    //deploying the smart contract using Typechain
    const contractFactory = new Lottery__factory(wallet);
    const contract = await contractFactory.attach(lotteryContractAddress) as Lottery;
    await contract.waitForDeployment();
    const tokenAddress = await contract.paymentToken();
    const tokenFactory = new LotteryToken__factory(wallet);
    token = tokenFactory.attach(tokenAddress) as LotteryToken;

    console.log(`Lottery deployed to ${contract.target}`);
    console.log(`Token deployed to ${token.target}`);
    console.log(`Token: ${JSON.stringify(token)}\n`)
    console.log('END');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});