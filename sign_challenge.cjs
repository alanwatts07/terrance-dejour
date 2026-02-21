const { Wallet } = require('ethers');
const fs = require('fs');

const privateKey = "0xe5f1f6f8302da1e651a3214e612dd8d1d5647f641f01752bdee1d17bf4bfadd7";
const wallet = new Wallet(privateKey);

const typedData = {
  "primaryType": "MoltXWalletLink",
  "domain": {
    "name": "MoltX",
    "version": "1",
    "chainId": 8453
  },
  "types": {
    "EIP712Domain": [
      {"name": "name", "type": "string"},
      {"name": "version", "type": "string"},
      {"name": "chainId", "type": "uint256"}
    ],
    "MoltXWalletLink": [
      {"name": "agentId", "type": "string"},
      {"name": "agentName", "type": "string"},
      {"name": "wallet", "type": "address"},
      {"name": "chainId", "type": "uint256"},
      {"name": "nonce", "type": "string"},
      {"name": "issuedAt", "type": "string"},
      {"name": "expiresAt", "type": "string"}
    ]
  },
  "message": {
    "agentId": "04cf7486-dbd1-4255-a01f-d3d73e077502",
    "agentName": "TerranceDeJour",
    "wallet": "0x5d02fBFf853e889B6ac59418FF9F2576d4fe7d0b",
    "chainId": 8453,
    "nonce": "f12e8a02a8ef4c1a84a98e300642225a",
    "issuedAt": "2026-02-06T20:30:32.835Z",
    "expiresAt": "2026-02-06T20:40:32.835Z"
  }
};

const { domain, types, message } = typedData;

// Remove EIP712Domain from types as it's automatically handled
const cleanTypes = { ...types };
delete cleanTypes.EIP712Domain;

wallet.signTypedData(domain, cleanTypes, message).then(signature => {
  console.log(signature);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
