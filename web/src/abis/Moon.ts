export const MOON_ADDRESS = "0xCb7729dDd135758362747C4936356768541BCbc9";

export const MOON_ABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "mferCollected",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "mferMoonBurned",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint40",
        name: "timestamp",
        type: "uint40",
      },
    ],
    name: "Mooned",
    type: "event",
  },
  {
    inputs: [],
    name: "BURN_ADDRESS",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "bond",
    outputs: [
      { internalType: "contract IMCV2_Bond", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "burnHistory",
    outputs: [
      { internalType: "uint40", name: "timestamp", type: "uint40" },
      { internalType: "uint96", name: "mferCollected", type: "uint96" },
      { internalType: "uint96", name: "mferMoonBurned", type: "uint96" },
      { internalType: "address", name: "caller", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "disableRestorable",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "from", type: "uint256" },
      { internalType: "uint256", name: "to", type: "uint256" },
    ],
    name: "getHistories",
    outputs: [
      {
        components: [
          { internalType: "uint40", name: "timestamp", type: "uint40" },
          { internalType: "uint96", name: "mferCollected", type: "uint96" },
          { internalType: "uint96", name: "mferMoonBurned", type: "uint96" },
          { internalType: "address", name: "caller", type: "address" },
        ],
        internalType: "struct Moon.History[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getHistoryCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getStats",
    outputs: [
      { internalType: "uint256", name: "pending", type: "uint256" },
      { internalType: "uint256", name: "claimed", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "mferAmount", type: "uint256" }],
    name: "getTokensForReserve",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isRestorable",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "mfer",
    outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "mferMoon",
    outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "moon",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "restoreOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "totalMfermoonBurned",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];
