import 'dotenv/config';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import FileverseAgent from '../FileverseAgent/FileverseAgent.js';

describe('FileverseAgent', () => {
  let agent;
  let fileId;
  
  beforeEach(() => {
    const account = privateKeyToAccount(process.env.PRIVATE_KEY);
    const SEPOLIA_RPC = "https://rpc.ankr.com/eth_sepolia";
    // Initialize FileverseAgent with test values
    agent = new FileverseAgent(
        SEPOLIA_RPC,
        process.env.PINATA_JWT,
        process.env.PINATA_GATEWAY,
        account,
        sepolia
    );
  });

  it('should initialize with correct properties', () => {
    expect(agent.portalRegistry).to.equal('0x92e0bb8CFD97da712F366A350ff2B7A7873A62A2');
    expect(agent.identity).to.have.property('agent');
    expect(agent.portal).to.be.an('object');
  });

  it('should create an identity', async () => {
    const identity = await agent.createIdentity();
    expect(identity).to.have.property('owner');
    expect(identity).to.have.property('signingDid');
    expect(identity).to.have.property('agent');
  });

  it('should fail to create identity without agent', async () => {
    agent.identity.agent = undefined;
    try {
      await agent.createIdentity();
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.equal('No account provided');
    }
  });

  it('should perform full file lifecycle (create, update, delete)', async function() {
    this.timeout(300000); 
    
    // First deploy a portal
    const portalAddress = await agent.deployPortal();
    console.log('Portal deployed at:', portalAddress);
    expect(portalAddress).to.be.a('string');

    // Create file
    console.log('Creating file...');
    const createResult = await agent.create('Test content @001');
    console.log('Create File Transaction:', createResult);
    let receipt = await agent.publicClient.waitForTransactionReceipt({
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
    receipt = await agent.publicClient.waitForTransactionReceipt({
      hash: updateResult.hash,
    });
    console.log('Update receipt:', receipt);
    expect(updateResult.fileId).to.equal(fileId);

    // Delete the file
    console.log('Deleting file...', fileId);
    const deleteResult = await agent.delete(fileId);
    console.log('Delete File Transaction:', deleteResult);
    receipt = await agent.publicClient.waitForTransactionReceipt({
      hash: deleteResult.hash,
    });
    console.log('Delete receipt:', receipt);
    expect(deleteResult.fileId).to.equal(fileId);
  });
});

