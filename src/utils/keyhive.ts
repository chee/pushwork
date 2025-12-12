import {
  AutomergeRepoKeyhive,
  initializeAutomergeRepoKeyhive,
  initKeyhiveWasm,
  Keyhive,
  Signer,
} from "@automerge/automerge-repo-keyhive";
import type {
  NetworkAdapter,
  PeerId,
  StorageAdapterInterface,
} from "@automerge/automerge-repo/slim";
import * as os from "node:os";

let wasmInitialized = false;

function ensureWasmInitialized(): void {
  if (!wasmInitialized) {
    initKeyhiveWasm();
    wasmInitialized = true;
  }
}

export async function setupKeyhive(
  storageAdapter: StorageAdapterInterface,
  networkAdapter: NetworkAdapter
): Promise<AutomergeRepoKeyhive> {
  ensureWasmInitialized();
  return await initializeAutomergeRepoKeyhive({
    storage: storageAdapter,
    peerIdSuffix: `pushwork-${os.hostname}-${os.platform}-${Math.random()
      .toString(32)
      .slice(2)}`,
    automaticArchiveIngestion: false,
    onlyShareWithHardcodedServerPeerId: false,
    networkAdapter: networkAdapter,
  });
}
