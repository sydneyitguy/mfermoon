import { useState, useEffect } from "react";
import mferMoonImage from "/mfermoon.png";
import { publicClient } from "./utils/rpc";
import { MOON_ABI, MOON_ADDRESS } from "./abis/Moon";
import { formatWei } from "./utils/common";
import { type Address } from "viem";
import "./App.css";

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

  useEffect(() => {
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
      const histories = (await publicClient.readContract({
        ...commonParams,
        functionName: "getHistories",
        args: [0, 20],
      })) as {
        timestamp: number;
        mferCollected: bigint;
        mferMoonBurned: bigint;
        caller: Address;
      }[];

      setHistory(histories);
    };

    fetchStats();
    fetchHistory();
  }, []);

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
          pending for the moon (caller compensation:{" "}
          <span className="mfercolor">
            {formatWei(stats.pendingMferRoyalties / 100n)} $mfer
          </span>
          )
        </h2>
        <button className="moon-button" onClick={() => undefined}>
          MOON @~
        </button>
      </div>
      <div className="stats">
        <h1>Mooned Stats</h1>
        <h2>
          <span className="mfercolor">
            {formatWei(stats.totalMferCollected)} $mfer claimed
          </span>{" "}
          -&gt;{" "}
          <span className="highlight">
            {formatWei(stats.totalMfermoonBurned)} MFERMOON burned (
            {formatWei(stats.totalMfermoonBurned / 100_000_000n, 8)}%) @~
          </span>{" "}
        </h2>

        <ul className="history">
          {history.map((h) => (
            <li key={h.timestamp}>
              {formatWei(h.mferCollected)} $mfer -&gt;{" "}
              {formatWei(h.mferMoonBurned)} MFERMOON - by {h.caller} @{" "}
              {new Date(h.timestamp * 1000).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default App;
