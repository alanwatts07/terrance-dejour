const { Wallet } = require('ethers');

const privateKey = process.env.EVM_PRIVATE_KEY;
if (!privateKey) {
  console.error('EVM_PRIVATE_KEY not found in environment');
  process.exit(1);
}
const wallet = new Wallet(privateKey);

const typedData = JSON.parse(process.argv[2]);
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
