# Fileverse Agents 

Access fileverse infra programmatically. 

[Safe Agentathon](https://safe.global/ai)

## Developer Docs

[Agent Explorer for on-chain activity](https://agents.fileverse.io)

[DDocs for Safe Agentathon](https://docs.fileverse.io/0x81fb962e2088De6925AffA4E068dd3FAF3EFE163/57#key=VWweDIp0IV7cWWPpYflsPkgEcekIkYXkdPkxfO02R2JbjXq-u1tf6Axsp7824S_7)

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
const { Agent } = require('@fileverse/agents');

const agent = new Agent({
    chain: process.env.CHAIN, // required - options: gnosis, sepolia
    privateKey: process.env.PRIVATE_KEY, // optional if not provided, the agent will generate a random private key
    pinataJWT: process.env.PINATA_JWT, // required - see how to get API keys below
    pinataGateway: process.env.PINATA_GATEWAY, // required - see how to get API keys below
    pimlicoAPIKey: process.env.PIMLICO_API_KEY, // required - see how to get API keys below
});

// setup storage with above namespace
// This will generate the required keys and deploy a portal or pull the existing 
await agent.setupStorage('my-namespace'); // file is generated as the creds/${namespace}.json in the main directory

const latestBlockNumber = await agent.getBlockNumber();
console.log(`Latest block number: ${latestBlockNumber}`);

// create a new file 
const file = await agent.create('Hello World');
console.log(`File created: ${file}`);

// get the file
const file = await agent.getFile(file.fileId);
console.log(`File: ${file}`);

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
