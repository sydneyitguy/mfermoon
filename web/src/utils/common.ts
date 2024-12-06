import { formatEther } from "viem";
import { MOON_ADDRESS } from "../abis/Moon";
import { publicClient } from "./rpc";

export const formatWei = (value: bigint, decimals = 2) => {
  const etherValue = formatEther(value);
  return Number(etherValue).toLocaleString(undefined, {
    // undefined is the default system locale
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const getBurnHistoryLength = async () => {
  try {
    // Query the storage slot for the array's length
    const lengthHex = await publicClient.getStorageAt({
      address: MOON_ADDRESS,
      slot: "0x0", // BurnHistory array starts at slot 0
    });

    if (!lengthHex) return "0";
    const burnHistoryLength = BigInt(lengthHex as `0x${string}`).toString();
    console.log("Burn History Length:", burnHistoryLength);

    return burnHistoryLength;
  } catch (error) {
    console.error("Error fetching burn history length:", error);
  }
};

getBurnHistoryLength();
