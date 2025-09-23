import { Archive, CiphertextStore, Keyhive, Signer } from "@keyhive/keyhive";
import {
  KeyhiveNetworkAdapter,
  peerIdFromSigner,
} from "@automerge/automerge-keyhive-network-adapter";
import type { NetworkAdapter, PeerId } from "@automerge/automerge-repo/slim";

export async function setupKeyhive(adapter: NetworkAdapter): Promise<{
  adapter: NetworkAdapter;
  signer: Signer;
  keyhive: Keyhive;
  peerId: PeerId;
}> {
  const signer = Signer.generateMemory();
  const store = CiphertextStore.newInMemory();
  const hive = await Keyhive.init(signer, store, console.info);
  const wrapped = new KeyhiveNetworkAdapter(adapter, signer);
  const peerId = peerIdFromSigner(signer);
  return { adapter: wrapped, signer, keyhive: hive, peerId };
}
