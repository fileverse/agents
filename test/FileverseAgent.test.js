import 'dotenv/config';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { Agent as FileverseAgent, PinataStorageProvider } from '../index.js';

describe('FileverseAgent', () => {
  let agent; 
  let fileId;

  beforeEach(() => {
    const account = privateKeyToAccount(process.env.PRIVATE_KEY);
    // Initialize FileverseAgent with test values
    agent = new FileverseAgent({
      chain: sepolia,
      viemAccount: account,
      pimlicoAPIKey: process.env.PIMLICO_API_KEY,
      storageProvider: new PinataStorageProvider({
        pinataJWT: process.env.PINATA_JWT,
        pinataGateway: process.env.PINATA_GATEWAY,
      }),
    });
  });

  it('should initialize with correct properties', () => {
    // Test that the agent is properly initialized
    expect(agent.chain).to.exist;
    expect(agent.chain.name).to.equal('Sepolia');
    expect(agent.publicClient).to.exist;
    expect(agent.walletClient).to.exist;
    expect(agent.portalRegistry).to.equal('0x8D9E28AC21D823ddE63fbf20FAD8EdD4F4a0cCfD');
    expect(agent.viemAccount).to.exist;
    expect(agent.storageProvider).to.exist;
  });

  it('should have required methods', () => {
    expect(agent.setupStorage).to.be.a('function');
    expect(agent.create).to.be.a('function');
    expect(agent.update).to.be.a('function');
    expect(agent.delete).to.be.a('function');
    expect(agent.getFile).to.be.a('function');
  });
  it('should perform full file lifecycle (create, update, delete)', async function () {
    this.timeout(300000);

    // First deploy a portal
    const portalAddress = await agent.setupStorage('test');
    console.log('Portal deployed at:', portalAddress);
    expect(portalAddress).to.be.a('string');

    // Create file
    console.log('Creating file...');
    const createResult = await agent.create('Test content @001');
    console.log('Create File Transaction:', createResult);
    let receipt = await agent.smartAccountClient.waitForUserOperationReceipt({
      hash: createResult.hash,
    });
    console.log('Create receipt:', receipt);
    fileId = createResult.fileId;
    expect(createResult).to.have.property('hash');
    expect(createResult).to.have.property('fileId');

    // Update same file
    console.log('Updating file...', fileId);
    const updateResult = await agent.update(fileId, 'Updated content @002');
    console.log('Update File Transaction:', updateResult);
    receipt = await agent.smartAccountClient.waitForUserOperationReceipt({
      hash: updateResult.hash,
    });
    console.log('Update receipt:', receipt);
    expect(updateResult.fileId).to.equal(fileId);

    // Delete the file
    console.log('Deleting file...', fileId);
    const deleteResult = await agent.delete(fileId);
    console.log('Delete File Transaction:', deleteResult);
    receipt = await agent.smartAccountClient.waitForUserOperationReceipt({
      hash: deleteResult.hash,
    });
    console.log('Delete receipt:', receipt);
    expect(deleteResult.fileId).to.equal(fileId);
  });
});
