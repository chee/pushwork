import {
  NetworkAdapter,
  Repo,
  RepoConfig,
  StorageId,
} from "@automerge/automerge-repo";
import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs";
import { WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import * as path from "path";
import chalk from "chalk";
import { ConfigManager } from "../config/index.js";

import { setupKeyhive } from "./keyhive.js";

export interface RepoFactoryOptions {
  enableNetwork?: boolean;
  syncServer?: string;
  syncServerStorageId?: string;
}

/**
 * Create an Automerge repository with configuration-based setup
 */
export async function createRepo(
  workingDir: string,
  options: RepoFactoryOptions = {}
): Promise<Repo> {
  const configManager = new ConfigManager(workingDir);
  const config = await configManager.getMerged();

  const syncToolDir = path.join(workingDir, ".pushwork");
  const storage = new NodeFSStorageAdapter(path.join(syncToolDir, "automerge"));

  const repoConfig: RepoConfig = { storage };

  // Determine network settings - options override config
  const enableNetwork = options.enableNetwork ?? true;
  const syncServer = options.syncServer ?? config.sync_server;
  const syncServerStorageId =
    options.syncServerStorageId ?? config.sync_server_storage_id;

  // Add network adapter only if explicitly enabled and sync server is configured
  if (enableNetwork && syncServer) {
    let networkAdapter: NetworkAdapter = new WebSocketClientAdapter(syncServer);

    if (config.keyhive_enabled) {
      const { keyhive, signer, adapter, peerId } = await setupKeyhive(
        storage,
        networkAdapter
      );
      repoConfig.peerId = peerId;
      networkAdapter = adapter;
    }
    repoConfig.network = [networkAdapter];
    repoConfig.enableRemoteHeadsGossiping = true;
    console.log(chalk.gray(`  ✓ Network sync enabled: ${syncServer}`));
  } else {
    console.log(chalk.gray("  ✓ Local-only mode (network sync disabled)"));
  }

  const repo = new Repo(repoConfig);

  // Wait for network adapter to be ready before subscribing (keyhive needs this)
  if (enableNetwork && syncServer && config.keyhive_enabled) {
    const adapter = repoConfig.network?.[0];
    if (adapter && 'whenReady' in adapter) {
      await adapter.whenReady();
    }
  }

  // Subscribe to the sync server storage for network sync
  if (enableNetwork && syncServer && syncServerStorageId) {
    repo.subscribeToRemotes([syncServerStorageId as StorageId]);
    console.log(
      chalk.gray(
        `  ✓ Subscribed to sync server storage: ${syncServerStorageId}`
      )
    );
  }

  return repo;
}
