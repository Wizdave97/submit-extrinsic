// Import the API
const { ApiPromise, WsProvider } = require("@polkadot/api");
const { Keyring } = require("@polkadot/keyring");
const { cryptoWaitReady } = require("@polkadot/util-crypto");
const { chunk } = require("lodash");

function hexToBytes(hex) {
  const chunks = chunk(hex.split(""), 2);

  const bytes = [];

  for (const chunk of chunks) {
    bytes.push(parseInt(chunk.join(""), 16));
  }
  return bytes;
}

async function main() {
  // Create a new instance of the api
  const provider = new WsProvider()
  const api = await ApiPromise.create({ provider });

  // Wait for wasm to be initialized for sr25519 keys
  await cryptoWaitReady();

  const keyring = new Keyring({ type: "sr25519", ss58Format: 2 });

  // Create root key
  const root = keyring.addFromUri("");

  const unsub = await api.tx.system.remark({bytes: []}).signAndSend(root, ({ events = [], status }) => {
    console.log(`Current status is: ${status.type}`);

    if (status.isFinalized) {
      console.log(`Transaction included at blockHash ${status.asFinalized}`);

      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
      });

      unsub();
    }
  });

}

main().catch(console.error);
