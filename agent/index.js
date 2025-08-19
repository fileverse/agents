import {
  createPublicClient,
  createWalletClient,
  http,
  parseEventLogs,
} from "viem";
import { gnosis, sepolia } from "viem/chains";
import { PortalRegistryABI, PortalABI } from "../abi/index.js";
import { generatePortalKeys, getPortalKeyVerifiers } from "./keys.js";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { toSafeSmartAccount } from "permissionless/accounts";
import { entryPoint07Address } from "viem/account-abstraction"
import { createSmartAccountClient } from "permissionless";
import fs from "fs";

class Agent {
  DELETED_HASH = "deleted";
  constructor({ chain, viemAccount, pimlicoAPIKey, storageProvider }) {
    if (!chain) {
      throw new Error("Chain is required - options: gnosis, sepolia");
    }
    if (!pimlicoAPIKey) {
      throw new Error("Pimlico API key is required");
    }
    if (!storageProvider) {
      throw new Error("Storage provider is required");
    }
    this.chain =
      chain === "gnosis" || chain?.name?.toLowerCase() === "gnosis"
        ? gnosis
        : sepolia;
    this.pimlicoAPIKey = pimlicoAPIKey;
    this.storageProvider = storageProvider;
    this.viemAccount = viemAccount;
    const clients = this.genrateClients();
    this.publicClient = clients.publicClient;
    this.walletClient = clients.walletClient;
    this.portalRegistry = this.setPortalRegistry();
    this.owner = this.viemAccount.address;
  }

  async setupSafe() {
    const pimlicoRpcUrl = `https://api.pimlico.io/v2/${this.chain.name.toLowerCase()}/rpc?apikey=${this.pimlicoAPIKey}`;
    const paymasterClient = createPimlicoClient({
      transport: http(pimlicoRpcUrl),
      entryPoint: {
        address: entryPoint07Address,
        version: "0.7",
      },
    });
    this.safeAccount = await toSafeSmartAccount({
      client: this.publicClient,
      entryPoint: {
        address: entryPoint07Address,
        version: "0.7",
      },
      owners: [this.viemAccount],
      version: "1.4.1",
    });
    const smartAccountClient = createSmartAccountClient({
      account: this.safeAccount,
      chain: this.chain,
      paymaster: paymasterClient,
      bundlerTransport: http(pimlicoRpcUrl),
      userOperation: {
        estimateFeesPerGas: async () => (await paymasterClient.getUserOperationGasPrice()).fast,
      },
    });
    this.smartAccountClient = smartAccountClient;
  }

  genrateClients() {
    return {
      publicClient: createPublicClient({
        chain: this.chain,
        transport: http(),
      }),
      walletClient: createWalletClient({
        chain: this.chain,
        transport: http(),
        account: this.viemAccount,
      }),
    };
  }

  setPortalRegistry() {
    if (this.chain.name.toLowerCase() === "gnosis") {
      return "0x945690a516519daEE95834C05218839c8deEC88D";
    } else {
      return "0x8D9E28AC21D823ddE63fbf20FAD8EdD4F4a0cCfD";
    }
  }

  async getBlockNumber() {
    return this.publicClient.getBlockNumber();
  }

  async loadStorage(namespace) {
    if (!fs.existsSync("creds")) {
      fs.mkdirSync("creds");
    }
    if (!fs.existsSync(`creds/${namespace}.json`)) {
      return null;
    }
    const storage = fs.readFileSync(`creds/${namespace}.json`, "utf8");
    return JSON.parse(storage);
  }

  async setupStorage(namespace) {
    if (!namespace) {
      throw new Error("Namespace is required");
    }
    this.namespace = `${namespace}-${this.chain.name.toLowerCase()}`;
    await this.setupSafe();
    try {
      const storage = await this.loadStorage(this.namespace);
      if (storage && storage.namespace === this.namespace) {
        console.log("Storage already exists");
        this.portal = storage;
        return storage.portalAddress;
      }
      const metadataIPFSHash = await this.uploadToStorage(
        "metadata.json",
        JSON.stringify({
          namespace: this.namespace,
          source: "FileverseAgent",
          gateway: this.pinataGateway,
        })
      );
      const portalKeys = await generatePortalKeys();
      const verifiers = await getPortalKeyVerifiers(portalKeys);
      const hash = await this.smartAccountClient.sendUserOperation({
        calls: [{
          to: this.portalRegistry,
          abi: PortalRegistryABI,
          functionName: "mint",
          args: [
            metadataIPFSHash,
            portalKeys.viewDID,
            portalKeys.editDID,
            verifiers.portalEncryptionKeyVerifier,
            verifiers.portalDecryptionKeyVerifier,
            verifiers.memberEncryptionKeyVerifer,
            verifiers.memberDecryptionKeyVerifer,
          ],  
        }]
      });
      const receipt = await this.smartAccountClient.waitForUserOperationReceipt({
        hash,
      });

      const logs = parseEventLogs({
        abi: PortalRegistryABI,
        logs: receipt.logs,
        eventName: "Mint",
      });

      const portalAddress = logs[0].args.portal;

      if (!portalAddress) throw new Error("Portal not found");

      const portalData = {
        portalAddress,
        owner: this.owner,
        namespace: this.namespace,
        metadataIPFSHash,
        portalKeys,
        verifiers,
      };
      
      // Set portal data
      this.portal = portalData;
      
      fs.writeFileSync(
        `creds/${this.namespace}.json`,
        JSON.stringify(portalData, null, 2)
      );
      return portalAddress;
    } catch (error) {
      console.error("Error deploying portal:", error);
      throw error;
    }
  }

  async getPortal() {
    return this.portal;
  }

  async prechecks() {
    if (!this.safeAccount) {
      throw new Error("Storage not setup yet!");
    }
    if (!this.portal || !this.portal.portalAddress) {
      throw new Error("Portal not found!");
    }
  }

  async uploadToStorage(fileName, content) {
    return this.storageProvider.upload(fileName, content);
  }

  async create(output) {
    await this.prechecks();
    const contentIpfsHash = await this.uploadToStorage('output.md', output);

    const metadata = {
      name: `${this.portal.portalAddress}/${this.namespace}/output.md`,
      description: "Markdown file created by FileverseAgent",
    };
    const metadataIpfsHash = await this.uploadToStorage(
      'metadata.json',
      JSON.stringify(metadata)
    );

    const hash = await this.smartAccountClient.sendUserOperation({
      calls: [{
        to: this.portal.portalAddress,
        abi: PortalABI,
        functionName: "addFile",
        args: [
          metadataIpfsHash,
          contentIpfsHash,
          "", // _gateIPFSHash (empty for public files)
          0, // filetype (0 = PUBLIC from enum)
          0, // version
        ],
      }]
    });

    const receipt = await this.smartAccountClient.waitForUserOperationReceipt({ hash });
    const logs = parseEventLogs({
      abi: PortalABI,
      logs: receipt.logs,
      eventName: "AddedFile",
    });

    const addedFileLog = logs[0];

    if (!addedFileLog) {
      throw new Error("AddedFile event not found");
    }

    const fileId = addedFileLog.args?.fileId;
    const transaction = {
      hash: hash,
      fileId,
      portalAddress: this.portal.portalAddress,
    };
    return transaction;
  }

  async getFile(fileId) {
    await this.prechecks();
    const file = await this.publicClient.readContract({
      address: this.portal.portalAddress,
      abi: PortalABI,
      functionName: "files",
      args: [fileId],
    });
    const [metadataIpfsHash, contentIpfsHash] = file;
    return {
      portal: this.portal,
      namespace: this.namespace,
      metadataIpfsHash,
      contentIpfsHash,
    };
  }

  async update(fileId, output) {
    await this.prechecks();
    const contentIpfsHash = await this.uploadToStorage("output.md", output);

    const metadata = {
      name: "output.md",
      description: "Updated Markdown file by FileverseAgent",
      contentIpfsHash,
    };
    const metadataIpfsHash = await this.uploadToStorage("metadata.json", metadata);

    const hash = await this.smartAccountClient.sendUserOperation({
      calls: [{
        to: this.portal.portalAddress,
        abi: PortalABI,
        functionName: "editFile",
        args: [
          fileId,
          metadataIpfsHash,
          contentIpfsHash,
          "", // _gateIPFSHash (empty for public files)
          0, // filetype (0 = PUBLIC from enum)
          0, // version
        ],
      }]
    });

    const transaction = {
      hash: hash,
      fileId,
      portalAddress: this.portal.portalAddress,
    };
    return transaction;
  }

  async delete(fileId) {
    await this.prechecks();
    try {
      const protocol = await this.storageProvider.protocol();
      const hash = await this.smartAccountClient.sendUserOperation({
        calls: [{
          to: this.portal.portalAddress,
          abi: PortalABI,
          functionName: "editFile",
          args: [
          fileId,
          `${protocol}${this.DELETED_HASH}`,
          `${protocol}${this.DELETED_HASH}`,
          "", // _gateIPFSHash (empty for deleted files)
          0, // filetype (0 = PUBLIC from enum)
          0, // version
        ],
      }]
    });

    const transaction = {
      hash: hash,
      fileId,
      portalAddress: this.portal.portalAddress,
    };
      return transaction;
    } catch (error) {
      console.error("Error deleting file:", error);
      throw new Error("File deletion failed.");
    }
  }
}

export { Agent };
