import {
  CiphertextStore,
  Keyhive,
  Signer,
  initFromBase64Wasm,
} from "@keyhive/keyhive/slim";
// @ts-expect-error
import { wasmBase64 } from "@keyhive/keyhive/keyhive_wasm.base64.js";
initFromBase64Wasm(wasmBase64);

import { initializeKeyhive } from "@automerge/automerge-repo-keyhive";
import type {
  NetworkAdapter,
  PeerId,
  StorageAdapterInterface,
} from "@automerge/automerge-repo/slim";
import * as os from "node:os";

export async function setupKeyhive(
  storageAdapter: StorageAdapterInterface,
  networkAdapter: NetworkAdapter
): Promise<{
  adapter: NetworkAdapter;
  signer: Signer;
  keyhive: Keyhive;
  peerId: PeerId;
}> {
  const signer = Signer.generateMemory();
  const store = CiphertextStore.newInMemory();
  const hive = await Keyhive.init(signer, store, console.info);
  const hivekit = await initializeKeyhive({
    storage: storageAdapter,
    peerIdSuffix: `pushwork-${os.hostname}-${os.platform}-${Math.random()
      .toString(32)
      .slice(2)}`,
    automaticArchiveIngestion: false,
    networkAdapter: networkAdapter,
  });

  return {
    adapter: hivekit.networkAdapter,
    signer,
    keyhive: hive,
    peerId: hivekit.peerId,
  };
}
