import { formatEther } from "viem";

export const formatWei = (value: bigint, decimals = 2) => {
  const etherValue = formatEther(value);
  return Number(etherValue).toLocaleString(undefined, {
    // undefined is the default system locale
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};
