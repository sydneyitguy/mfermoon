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
      <a
        className="gh-button"
        href="https://github.com/sydneyitguy/mfermoon"
        target="_blank"
      >
        <span className="gh-button__title">
          <svg className="icon" viewBox="0 0 1024 1024">
            <path d="M512 0C229.252 0 0 229.25199999999995 0 512c0 226.251 146.688 418.126 350.155 485.813 25.593 4.686 34.937-11.125 34.937-24.626 0-12.188-0.469-52.562-0.718-95.314-128.708 23.46-161.707-31.541-172.469-60.373-5.525-14.809-30.407-60.249-52.398-72.263-17.988-9.828-43.26-33.237-0.917-33.735 40.434-0.476 69.348 37.308 78.471 52.75 45.938 77.749 119.876 55.627 148.999 42.5 4.654-32.999 17.902-55.627 32.501-68.373-113.657-12.939-233.22-56.875-233.22-253.063 0-55.94 19.968-101.561 52.658-137.404-5.22-12.999-22.844-65.095 5.063-135.563 0 0 42.937-13.749 140.811 52.501 40.811-11.406 84.594-17.031 128.124-17.22 43.499 0.188 87.314 5.874 128.188 17.28 97.689-66.311 140.686-52.501 140.686-52.501 28 70.532 10.375 122.564 5.124 135.499 32.811 35.844 52.626 81.468 52.626 137.404 0 196.686-119.751 240-233.813 252.686 18.439 15.876 34.748 47.001 34.748 94.748 0 68.437-0.686 123.627-0.686 140.501 0 13.625 9.312 29.561 35.25 24.562C877.436 929.998 1024 738.126 1024 512 1024 229.25199999999995 794.748 0 512 0z" />
          </svg>
          Github
        </span>
      </a>

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
