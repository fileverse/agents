# Fileverse Agents 

Access the Fileverse middleware, programmatically. Fileverse's middleware is expanding from powering self-sovereign human collaboration to also enabling multi-agent coordination with crypto primitives guaranteed :yellow_heart:

## Documentation

* [Take a look at our documentation](https://docs.fileverse.io/0x81fb962e2088De6925AffA4E068dd3FAF3EFE163/57#key=VWweDIp0IV7cWWPpYflsPkgEcekIkYXkdPkxfO02R2JbjXq-u1tf6Axsp7824S_7) to learn more about the Fileverse Agents SDK.

* Monitor, search and retrieve all your agents' onchain activity and outputs: https://agents.fileverse.io/

## Overview

With the Fileverse Agents SDK, your agents will have the ability to read, write, and organize data onchain and on IPFS. 

Out of the box and by default, your agent will get its own:
* Safe Smart Account / Multisig: gasless transactions, make your Agent customisable
* Smart Contract on Gnosis: public and permissionless registry of all the agent's outputs
* Storage space on IPFS: decentralised and content addressing focused for your agent's outputs
* Human-readable .md output: markdown is a format accessible by anyone, humans and other agents

## Installation

```bash
npm install @fileverse/agents
```

## Usage

```javascript
import { Agent } from '@fileverse/agents';
import { privateKeyToAccount } from 'viem/accounts';
import { PinataStorageProvider } from '@fileverse/agents/storage';

// Create storage provider
const storageProvider = new PinataStorageProvider({
  jwt: process.env.PINATA_JWT,
  gateway: process.env.PINATA_GATEWAY
});

// Initialize agent
const agent = new Agent({
  chain: process.env.CHAIN, // required - options: gnosis, sepolia
  viemAccount: privateKeyToAccount(process.env.PRIVATE_KEY), // required - viem account instance
  pimlicoAPIKey: process.env.PIMLICO_API_KEY, // required - see how to get API keys below
  storageProvider // required - storage provider instance
});

// setup storage with namespace
// This will generate the required keys and deploy a portal or pull the existing 
await agent.setupStorage('my-namespace'); // file is generated as the creds/${namespace}.json in the main directory

const latestBlockNumber = await agent.getBlockNumber();
console.log(`Latest block number: ${latestBlockNumber}`);

// create a new file 
const file = await agent.create('Hello World');
console.log(`File created: ${file}`);

// get the file
const fileData = await agent.getFile(file.fileId);
console.log(`File: ${fileData}`);

// update the file
const updatedFile = await agent.update(file.fileId, 'Hello World 2');
console.log(`File updated: ${updatedFile}`);

// delete the file
const deletedFile = await agent.delete(file.fileId);
console.log(`File deleted: ${deletedFile}`);
```

## How to get API Keys
* Pimlico API Key: https://www.pimlico.io/
    * https://docs.pimlico.io/permissionless/tutorial/tutorial-1#get-a-pimlico-api-key
* Pinata JWT and Gateway: https://pinata.cloud/
    * https://docs.pinata.cloud/account-management/api-keys

## Chains Supported

```
gnosis
sepolia
```


PS: Remember to put creds directory in your .gitignore file as you don't want to commit your private keys related to your portal to the repo.

PS: We don't support encryption of files yet. Please implement it on the application level if needed. We plan to add support for it in the future with other storage networks as well.
