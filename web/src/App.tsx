import { useState, useEffect } from "react";
import mferMoonImage from "/mfermoon.png";
import matchaIcon from "/matcha.svg";
import uniswapIcon from "/uniswap.png";
import geckoIcon from "/gecko-terminal.svg";
import mintClubIcon from "/mintclub.svg";
import { publicClient } from "./utils/rpc";
import { MOON_ABI, MOON_ADDRESS } from "./abis/Moon";
import { formatWei } from "./utils/common";
import { type Address } from "viem";
import "./App.css";
import { sdk } from "@farcaster/frame-sdk";
import { farcasterFrame as miniAppConnector } from "@farcaster/frame-wagmi-connector";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import {
  useAccount,
  useConnect,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const commonParams = {
  address: MOON_ADDRESS as Address,
  abi: MOON_ABI,
} as const;

// Define a more specific type for the Farcaster user context
interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  custodyAddress?: Address; // Optional, as per Farcaster docs
  connectedAddress?: Address; // Optional, as per Farcaster docs
  // Add other properties you might need from the user context
}

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

// Wagmi Config
const wagmiConfig = createConfig({
  chains: [base],
  connectors: [miniAppConnector(), injected()],
  transports: {
    [base.id]: http(),
  },
  // Optional: Add a persistence layer if needed, e.g., localStorage
  // storage: createStorage({ storage: window.localStorage }),
});

function MoonAppContent() {
  const [stats, setBurnStats] = useState<BurnStats>({
    pendingMferRoyalties: 0n,
    totalMfermoonBurned: 0n,
    totalMferCollected: 0n,
  });

  const [history, setHistory] = useState<BurnHistory[]>([]);
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(
    null
  );

  // Wagmi hooks
  const { address, isConnected, connector: activeConnector } = useAccount();
  const {
    connect,
    connectors,
    error: connectError,
    status: connectStatus,
  } = useConnect();

  const {
    data: hash,
    error: writeError,
    isPending: isMoooning,
    writeContractAsync,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const fetchStats = async () => {
    const totalMfermoonBurned = (await publicClient.readContract({
      ...commonParams,
      functionName: "totalMfermoonBurned",
    })) as bigint;

    const statsResult = (await publicClient.readContract({
      ...commonParams,
      functionName: "getStats",
    })) as [bigint, bigint];

    setBurnStats({
      totalMfermoonBurned,
      pendingMferRoyalties: statsResult[0],
      totalMferCollected: statsResult[1],
    });
  };

  const fetchHistory = async () => {
    let historiesData = (await publicClient.readContract({
      ...commonParams,
      functionName: "getHistories",
      args: [0, 20],
    })) as {
      timestamp: number;
      mferCollected: bigint;
      mferMoonBurned: bigint;
      caller: Address;
    }[];
    historiesData = historiesData.filter((h) => h.timestamp > 0).reverse();
    setHistory(historiesData);
  };

  useEffect(() => {
    fetchStats();
    fetchHistory();
  }, []);

  useEffect(() => {
    const initFarcaster = async () => {
      try {
        await sdk.actions.ready();
        sdk.actions.addFrame().catch((err) => {
          console.warn(
            "Farcaster addFrame error (user might have rejected, this is often fine):",
            err
          );
        });

        const context = await sdk.context;
        if (context && context.user) {
          const fcUser = context.user as FarcasterUser;
          console.log("Farcaster user context found:", fcUser);
          setFarcasterUser(fcUser);
          // Wagmi's miniAppConnector should automatically try to connect using this context.
          // isConnected and address from useAccount() should update if the connector works.
          // No explicit setAddress or setWalletClient or connect() call here,
          // relying on the connector's auto-connect capability.
        }
      } catch (error) {
        console.error("Farcaster SDK initialization error:", error);
      }
    };
    initFarcaster(); // Restored call
    // Dependencies: Empty array for one-time Farcaster SDK init.
    // Wagmi hooks (isConnected, address) will update independently when connector state changes.
  }, []);

  // Refetch stats and history when a transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      console.log("Transaction confirmed, refetching data...");
      fetchStats();
      fetchHistory();
    }
  }, [isConfirmed]);

  const connectWallet = async () => {
    // Try to find an injected connector (e.g., MetaMask)
    const injectedConnector = connectors.find(
      (c) =>
        c.id === "injected" ||
        c.name === "MetaMask" ||
        c.name === "Browser Wallet" // Common identifiers
    );

    if (injectedConnector) {
      console.log(
        "Attempting to connect with injected connector:",
        injectedConnector.name
      );
      connect({ connector: injectedConnector });
    } else if (connectors.length > 0) {
      // Fallback: if no specific injected connector found, try the first one (might be Farcaster)
      console.log(
        "No injected connector found. Attempting to connect with first available connector:",
        connectors[0].name
      );
      connect({ connector: connectors[0] });
    } else {
      alert(
        "No wallet connectors configured. Please install a browser wallet like MetaMask or use a Farcaster compatible app."
      );
    }
  };

  const handleMoonWithSigner = async () => {
    if (!address) {
      alert("Address not available. Please ensure your wallet is connected.");
      return;
    }

    try {
      await writeContractAsync({
        address: MOON_ADDRESS as Address,
        abi: MOON_ABI,
        functionName: "moon",
        account: address,
        chain: base,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("User rejected the request")
      ) {
        console.log("User rejected the transaction request.");
      } else {
        console.error("Error sending moon transaction:", error);
      }
    }
  };

  return (
    <>
      <div>
        <img src={mferMoonImage} className="logo" alt="mferMoon logo" />
      </div>
      <h1>
        one small <span className="highlight">burn</span> for mfermoon, one
        giant
        <span className="mfercolor"> leap</span> for mfer-kind
      </h1>

      <a className="button" href="https://mint.club/token/base/MFERMOON">
        <img
          src={mintClubIcon}
          width={48}
          height={48}
          alt="Mint Club"
          className="round-image"
        />
        Buy $MFERMOON
      </a>
      <p>
        <a
          href="https://basescan.org/token/0xF6F035883ef2536f0E262e592cF3ACfE59F0832B"
          target="_blank"
          style={{ color: "#fff", textDecoration: "none" }}
        >
          CA: 0xF6F035883ef2536f0E262e592cF3ACfE59F0832B
        </a>
      </p>
      <p className="dex-links">
        <a
          href="https://www.geckoterminal.com/base/pools/0x1a5db9fe8670b3798c97f5190dd662a04e77203f62f38f3893ad09d5c601cd1c"
          target="_blank"
        >
          <img src={geckoIcon} alt="Coingecko Terminal" />
        </a>
        <a
          href="https://matcha.xyz/tokens/base/eth?buyChain=8453&buyAddress=0xf6f035883ef2536f0e262e592cf3acfe59f0832b&sellAmount=0.01"
          target="_blank"
        >
          <img src={matchaIcon} alt="Matcha DEX" />
        </a>
        <a
          href="https://app.uniswap.org/swap?chain=base&inputCurrency=NATIVE&outputCurrency=0xf6f035883ef2536f0e262e592cf3acfe59f0832b"
          target="_blank"
        >
          <img src={uniswapIcon} className="round-image" alt="Uniswap DEX" />
        </a>
      </p>

      <div className="actions">
        <h2>
          <span className="mfercolor">
            {formatWei(stats.pendingMferRoyalties)} $mfer
          </span>{" "}
          ready to moon 🌕
        </h2>
        <button
          className={`button ${isMoooning || isConfirming ? "loading" : ""} ${
            stats.pendingMferRoyalties > 0n ? "" : "disabled"
          }`}
          onClick={async () => {
            if (stats.pendingMferRoyalties === 0n) {
              return;
            }
            if (isConnected && address) {
              await handleMoonWithSigner();
            } else {
              await connectWallet();
            }
          }}
          disabled={
            stats.pendingMferRoyalties === 0n || isMoooning || isConfirming
          }
        >
          {isMoooning
            ? "Moooning..."
            : isConfirming
            ? "Confirming..."
            : "MOON @~"}
        </button>
        <div>
          caller reward:{" "}
          <span className="mfercolor">
            {formatWei(stats.pendingMferRoyalties / 100n)} $mfer
          </span>
        </div>
        {connectError && (
          <div className="error">Error connecting: {connectError.message}</div>
        )}
        {writeError && (
          <div className="error">Mooning Error: {writeError.message}</div>
        )}
        {hash && <div className="address">Transaction Hash: {hash}</div>}
        {isConfirming && (
          <div className="address">Waiting for confirmation...</div>
        )}
        {isConfirmed && <div className="address">Transaction Confirmed!</div>}
        {isConnected && address && (
          <div className="address">
            {farcasterUser && farcasterUser.pfpUrl && (
              <img
                src={farcasterUser.pfpUrl}
                alt={farcasterUser.displayName || farcasterUser.username}
                className="pfp-image"
              />
            )}
            Connected as {`${address.slice(0, 6)}...${address.slice(-4)}`}{" "}
            {activeConnector?.name ? `via ${activeConnector.name}` : ""}
          </div>
        )}
        {!isConnected && connectStatus === "pending" && (
          <div className="address">Connecting...</div>
        )}
      </div>

      <a
        className="gh-button"
        href="https://github.com/sydneyitguy/mfermoon"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg className="icon" viewBox="0 0 1024 1024">
          <path d="M512 0C229.252 0 0 229.25199999999995 0 512c0 226.251 146.688 418.126 350.155 485.813 25.593 4.686 34.937-11.125 34.937-24.626 0-12.188-0.469-52.562-0.718-95.314-128.708 23.46-161.707-31.541-172.469-60.373-5.525-14.809-30.407-60.249-52.398-72.263-17.988-9.828-43.26-33.237-0.917-33.735 40.434-0.476 69.348 37.308 78.471 52.75 45.938 77.749 119.876 55.627 148.999 42.5 4.654-32.999 17.902-55.627 32.501-68.373-113.657-12.939-233.22-56.875-233.22-253.063 0-55.94 19.968-101.561 52.658-137.404-5.22-12.999-22.844-65.095 5.063-135.563 0 0 42.937-13.749 140.811 52.501 40.811-11.406 84.594-17.031 128.124-17.22 43.499 0.188 87.314 5.874 128.188 17.28 97.689-66.311 140.686-52.501 140.686-52.501 28 70.532 10.375 122.564 5.124 135.499 32.811 35.844 52.626 81.468 52.626 137.404 0 196.686-119.751 240-233.813 252.686 18.439 15.876 34.748 47.001 34.748 94.748 0 68.437-0.686 123.627-0.686 140.501 0 13.625 9.312 29.561 35.25 24.562C877.436 929.998 1024 738.126 1024 512 1024 229.25199999999995 794.748 0 512 0z" />
        </svg>
        Github
      </a>

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
              @ {new Date(h.timestamp * 1000).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

// Create a new QueryClient instance
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <MoonAppContent />
      </WagmiProvider>
    </QueryClientProvider>
  );
}
