import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          // NOTE: PUSH0 opcode is not supported on some L2s
          // - Reference: https://hardhat.org/hardhat-runner/docs/config#default-evm-version
          evmVersion: "paris",
          optimizer: {
            enabled: true,
            runs: 50000,
          },
        },
      },
    ],
  },
  networks: {
    base: {
      url: "https://base-rpc.publicnode.com",
      chainId: 8453,
      accounts: [process.env.TEST_PRIVATE_KEY as string],
    },
  },
  sourcify: {
    enabled: false,
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY as string,
    },
  },
};

export default config;
