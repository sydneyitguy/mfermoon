import { createPublicClient, http, fallback } from "viem";
import { base } from "viem/chains";

const rpcs = [
  "https://base-rpc.publicnode.com",
  "https://developer-access-mainnet.base.org",
  "https://mainnet.base.org",
  "https://base.gateway.tenderly.co",
  "https://base.drpc.org",
  "https://base-pokt.nodies.app",
  "https://base.rpc.subquery.network/public",
  "https://endpoints.omniatech.io/v1/base/mainnet/public",
  "https://gateway.tenderly.co/public/base",
  "https://base.blockpi.network/v1/rpc/public",
  "https://1rpc.io/base",
  "https://base-mainnet.public.blastapi.io",
  "https://base.meowrpc.com",
  "https://base.llamarpc.com",
  "https://public.stackup.sh/api/v1/node/base-mainnet",
];

export const publicClient = createPublicClient({
  chain: base,
  transport: fallback(
    rpcs.map((rpc) =>
      http(rpc, {
        key: rpc,
        name: rpc,
        retryCount: 3,
        timeout: 3_000,
      })
    ),
    { rank: false }
  ),
});
