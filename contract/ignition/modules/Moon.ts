// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MoonModule = buildModule("MoonModule", (m) => {
  const moon = m.contract("Moon");

  return { moon };
});

export default MoonModule;
