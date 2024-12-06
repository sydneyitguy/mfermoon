import { useState, useEffect } from "react";
import moonferImage from "/moonfer.png";
import { publicClient } from "./utils/rpc";
import { MOON_ABI, MOON_ADDRESS } from "./abis/Moon";
import { formatWei, getBurnHistoryLength } from "./utils/common";
import { type Address } from "viem";
import "./App.css";

const commonParams = {
  address: MOON_ADDRESS as Address,
  abi: MOON_ABI,
} as const;

type BurnStats = {
  pendingMferRoyalties: bigint;
  totalMoonferBurned: bigint;
  totalMferCollected: bigint;
};

type BurnHistory = {
  timestamp: number;
  mferCollected: bigint;
  moonferBurned: bigint;
  caller: Address;
};

function App() {
  const [stats, setBurnStats] = useState<BurnStats>({
    pendingMferRoyalties: 0n,
    totalMoonferBurned: 0n,
    totalMferCollected: 0n,
  });

  const [history, setHistory] = useState<BurnHistory[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const totalMoonferBurned = (await publicClient.readContract({
        ...commonParams,
        functionName: "totalMoonferBurned",
      })) as bigint;

      const stats = (await publicClient.readContract({
        ...commonParams,
        functionName: "getStats",
      })) as [bigint, bigint];

      setBurnStats({
        totalMoonferBurned,
        pendingMferRoyalties: stats[0],
        totalMferCollected: stats[1],
      });
    };

    const fetchHistory = async () => {
      setHistory([]);
      const burnHistoryLength = await getBurnHistoryLength();
      console.log("Burn History Length:", burnHistoryLength);

      // for (let i = 0; i < 20; i++) {
      //   try {
      //     const history = (await publicClient.readContract({
      //       ...commonParams,
      //       functionName: "burnHistory",
      //       args: [i],
      //     })) as [number, bigint, bigint, Address];

      //     setHistory((prev) => {
      //       const historyObj = {
      //         timestamp: Number(history[0]),
      //         mferCollected: history[1],
      //         moonferBurned: history[2],
      //         caller: history[3],
      //       };
      //       if (prev.some((h) => h.timestamp === historyObj.timestamp)) {
      //         return prev;
      //       }
      //       return [...prev, historyObj];
      //     });
      //   } catch (e) {
      //     console.log(`Error fetching history ${i}: ${e}`);
      //     break;
      //   }
      //}
    };

    fetchStats();
    fetchHistory();
  }, []);

  return (
    <>
      <div>
        <img src={moonferImage} className="logo" alt="moonfer logo" />
      </div>
      <h1>
        One small <span className="highlight">burn</span> for moonfer, one giant
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
            {formatWei(stats.totalMoonferBurned)} MOONFER burned (
            {formatWei(stats.totalMoonferBurned / 100_000_000n, 8)}%) @~
          </span>{" "}
        </h2>

        <ul className="history">
          {history.map((h) => (
            <li key={h.timestamp}>
              {formatWei(h.mferCollected)} $mfer -&gt;{" "}
              {formatWei(h.moonferBurned)} MOONFER - by {h.caller} @{" "}
              {new Date(h.timestamp * 1000).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default App;
