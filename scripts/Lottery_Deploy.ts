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
// const TOKEN_RATIO_FIXED = 0.001;
// // const TOKEN_RATIO_FIXED_2 = "1000000";

async function main() {
    console.log(`START\n`);
    // console.log(`TOKEN_RATIO: ${TOKEN_RATIO}\n`);
    // console.log(`TOKEN_RATIO_FIXED: ${ethers.parseUnits(TOKEN_RATIO_FIXED.toFixed(18))}`); // 0.001 eth
    // // console.log(`TOKEN_RATIO_FIXED_2: ${ethers.parseUnits(TOKEN_RATIO_FIXED_2,'gwei')}`); // 0.001 eth

    //receiving parameters
    const parameters = process.argv.slice(2);
    if (!parameters || parameters.length < 0)
      throw new Error("Proposals not provided");
    // const myTokenContractAddress = parameters[0];

    // const proposals = process.argv.slice(3);
    // console.log("Deploying Ballot contract");
    // console.log(`MyToken contract address: ${myTokenContractAddress}`);
    // console.log("Proposals: ");
    // proposals.forEach((element, index) => {
    //   console.log(`Proposal N. ${index + 1}: ${element}`);
    // });

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
    contract = await contractFactory.deploy(
      "LotteryToken",
      "LT0",
      TOKEN_RATIO,
      ethers.parseUnits(BET_PRICE.toFixed(18)),
      ethers.parseUnits(BET_FEE.toFixed(18))
    );
    await contract.waitForDeployment();
    const tokenAddress = await contract.paymentToken();
    const tokenFactory = new LotteryToken__factory(wallet);
    token = tokenFactory.attach(tokenAddress) as LotteryToken;

    console.log(`Lottery deployed to ${contract.target}`);
    console.log(`Token deployed to ${token.target}\n`);
    console.log('END');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});