import { useState, useEffect } from "react";
import mferMoonImage from "/mfermoon.png";
import { publicClient } from "./utils/rpc";
import { MOON_ABI, MOON_ADDRESS } from "./abis/Moon";
import { formatWei } from "./utils/common";
import { type Address } from "viem";
import "./App.css";
import { createWalletClient, custom, type WalletClient } from "viem";
import { base, mainnet } from "viem/chains";
// import "@fortawesome/fontawesome-free/css/all.min.css";

const commonParams = {
  address: MOON_ADDRESS as Address,
  abi: MOON_ABI,
} as const;

type BurnStats = {
  pendingMferRoyalties: bigint;
  totalMfermoonBurned: bigint;
  totalMferCollected: bigint;
};

type BurnHistory = {
  timestamp: number;
  mferCollected: bigint;
  mferMoonBurned: bigint;
  caller: Address;
};

function App() {
  const [stats, setBurnStats] = useState<BurnStats>({
    pendingMferRoyalties: 0n,
    totalMfermoonBurned: 0n,
    totalMferCollected: 0n,
  });

  const [history, setHistory] = useState<BurnHistory[]>([]);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    const totalMfermoonBurned = (await publicClient.readContract({
      ...commonParams,
      functionName: "totalMfermoonBurned",
    })) as bigint;

    const stats = (await publicClient.readContract({
      ...commonParams,
      functionName: "getStats",
    })) as [bigint, bigint];

    setBurnStats({
      totalMfermoonBurned,
      pendingMferRoyalties: stats[0],
      totalMferCollected: stats[1],
    });
  };

  const fetchHistory = async () => {
    let histories = (await publicClient.readContract({
      ...commonParams,
      functionName: "getHistories",
      args: [0, 20],
    })) as {
      timestamp: number;
      mferCollected: bigint;
      mferMoonBurned: bigint;
      caller: Address;
    }[];
    histories = histories.filter((h) => h.timestamp > 0n).reverse();

    setHistory(histories);
  };

  useEffect(() => {
    fetchStats();
    fetchHistory();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    const client = createWalletClient({
      chain: mainnet,
      transport: custom(window.ethereum),
    });

    const [address] = await client.requestAddresses();

    setWalletClient(client);
    setAddress(address);

    await handleMoonWithClient(client, address);
  };

  const handleMoonWithClient = async (
    client: WalletClient,
    userAddress: Address
  ) => {
    try {
      setIsLoading(true);

      const hash = await client.writeContract({
        ...commonParams,
        functionName: "moon",
        account: userAddress,
        chain: base,
      });
      console.log("Transaction hash:", hash);

      setTimeout(async () => {
        await fetchStats();
        await fetchHistory();
      }, 5000); // make sure the tx is populated
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("User rejected the request")
      ) {
        console.log("User rejected the request");
      } else {
        console.error("Error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoon = async () => {
    if (!walletClient || !address) {
      alert("Please connect wallet first");
      return;
    }
    await handleMoonWithClient(walletClient, address);
  };

  return (
    <>
      <div>
        <img src={mferMoonImage} className="logo" alt="mferMoon logo" />
      </div>
      <h1>
        One small <span className="highlight">burn</span> for mferMoon, one
        giant
        <span className="mfercolor"> leap</span> for mfer-kind
      </h1>
      <div className="actions">
        <h2>
          <span className="mfercolor">
            {formatWei(stats.pendingMferRoyalties)} $mfer
          </span>{" "}
          ready to moon 🌕
        </h2>
        <div>
          (caller compensation:{" "}
          <span className="mfercolor">
            {formatWei(stats.pendingMferRoyalties / 100n)} $mfer
          </span>
          )
        </div>

        <button
          className={`button ${isLoading ? "loading" : ""} ${
            stats.pendingMferRoyalties > 0n ? "" : "disabled"
          }`}
          onClick={async () => {
            if (stats.pendingMferRoyalties === 0n) {
              return;
            }

            if (address) {
              await handleMoon();
            } else {
              await connectWallet();
            }
          }}
        >
          MOON @~
        </button>
        {address && <div className="address">Connected as {address}</div>}
      </div>
      <div className="stats">
        <h1>Mooned Stats</h1>
        <h2>
          Total{" "}
          <span className="mfercolor">
            {formatWei(stats.totalMferCollected)} $mfer
          </span>{" "}
          claimed -&gt;{" "}
          <span className="highlight">
            {formatWei(stats.totalMfermoonBurned)} MFERMOON
          </span>{" "}
          burned ({formatWei(stats.totalMfermoonBurned / 100_000_000n, 3)}%) @~
        </h2>

        <ul className="history">
          {history.map((h) => (
            <li key={h.timestamp}>
              <span className="mfercolor">
                {formatWei(h.mferCollected)} $mfer
              </span>{" "}
              -&gt;{" "}
              <span className="highlight">
                {formatWei(h.mferMoonBurned)} MFERMOON
              </span>{" "}
              - by{" "}
              <a
                href={`https://basescan.org/address/${h.caller}`}
                target="_blank"
              >
                {h.caller.slice(0, 6)}...{h.caller.slice(-4)}
              </a>{" "}
              @ {new Date(h.timestamp * 1000).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default App;
