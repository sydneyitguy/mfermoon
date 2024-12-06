# Moonfer Mooning Contract 🌕

MOONFER is a $mfer-backed child token created on Mint Club that has 10% sell royalties.
This contract, as the roylaty owner, claims the royalties and burns the MOONFER tokens.
Anyone can call the `moon()` function to claim the royalties and burn the tokens.
The caller will receive 1% of the amount burned as gas fee compensation.

## Deployed Contract

Base:

- Moon: [0xe3Ab60CA499408BAafc236ae6aEF2ED7074A9A96](https://basescan.org/address/0xe3Ab60CA499408BAafc236ae6aEF2ED7074A9A96#code)

## Deploy

```shell
npx hardhat ignition deploy --network base ./ignition/modules/Moon.ts
npx hardhat verify --network base ${DEPLOYED_CONTRACT_ADDRESS}
```
