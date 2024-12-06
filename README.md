# Mfermoon Mooning Contract 🌕

MFERMOON is a $mfer-backed child token created on Mint Club that has 10% sell royalties.
This contract, as the roylaty owner, claims the royalties and burns the MFERMOON tokens.
Anyone can call the `moon()` function to claim the royalties and burn the tokens.
The caller will receive 1% of the amount burned as gas fee compensation.

## Deployed Contract

Base:

- Moon: [0xCb7729dDd135758362747C4936356768541BCbc9](https://basescan.org/address/0xCb7729dDd135758362747C4936356768541BCbc9#code)

## Deploy

```shell
npx hardhat ignition deploy --network base ./ignition/modules/Moon.ts
npx hardhat verify --network base ${DEPLOYED_CONTRACT_ADDRESS}
```
