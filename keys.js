import * as ucans from "@ucans/ucans";
import { Base64 } from "js-base64";
import { fromUint8Array } from "js-base64";
import { generateKeyPairSync } from "crypto";
import { sha256 } from "viem";

const generateRandomRSAKeyPair = async () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "spki",
      format: "der",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "der",
    },
  });
  return { publicKey, privateKey };
};

const jsonToBase64 = (data) => Base64.encode(JSON.stringify(data));

const generateRandomISEAKey = async () => {
  const pair = await generateRandomRSAKeyPair();
  return jsonToBase64(pair);
};

const generateRandomUcanEdKeyPair = async (exportable = true) =>
  await ucans.EdKeypair.create({ exportable });

const exportKeyPair = async () => {
  return await generateRandomRSAKeyPair();
};

const getPortalKeyVerifiers = (secretFileContent) => {
  const encoder = new TextEncoder();

  return {
    portalEncryptionKeyVerifier: sha256(
      encoder.encode(secretFileContent.portalEncryptionKey)
    ),
    portalDecryptionKeyVerifier: sha256(
      encoder.encode(secretFileContent.portalDecryptionKey)
    ),
    memberEncryptionKeyVerifer: sha256(
      encoder.encode(secretFileContent.memberEncryptionKey)
    ),
    memberDecryptionKeyVerifer: sha256(
      encoder.encode(secretFileContent.memberDecryptionKey)
    ),
  };
};

const generatePortalKeys = async () => {
  const editKeyPair = await generateRandomUcanEdKeyPair();
  const viewKeyPair = await generateRandomUcanEdKeyPair();
  const editSecret = await editKeyPair.export();
  const viewSecret = await viewKeyPair.export();
  const editDid = editKeyPair.did();
  const viewDid = viewKeyPair.did();
  // serverKeys
  const {
    publicKey: collaboratorPublicKey,
    privateKey: collaboratorPrivateKey,
  } = await exportKeyPair();
  // memberKeys
  const { publicKey: memberPublicKey, privateKey: memberPrivateKey } =
    await exportKeyPair();
  // ownerKeys
  const { publicKey: ownerPublicKey, privateKey: ownerPrivateKey } =
    await exportKeyPair();

  return {
    viewSecret,
    editSecret,
    editDID: editDid,
    viewDID: viewDid,
    ownerEncryptionKey: fromUint8Array(new Uint8Array(ownerPublicKey)),
    ownerDecryptionKey: fromUint8Array(new Uint8Array(ownerPrivateKey)),
    memberEncryptionKey: fromUint8Array(new Uint8Array(memberPublicKey)),
    memberDecryptionKey: fromUint8Array(new Uint8Array(memberPrivateKey)),
    portalEncryptionKey: fromUint8Array(new Uint8Array(collaboratorPublicKey)),
    portalDecryptionKey: fromUint8Array(new Uint8Array(collaboratorPrivateKey)),
  };
};

async function getAuthToken(contractAddress, editSecret, recipientDID) {
  console.log("editSecret: ", editSecret);
  const editKeypair = ucans.EdKeypair.fromSecretKey(editSecret);
  const ucan = await ucans.build({
    audience: recipientDID, // recipient DID
    issuer: editKeypair, // signing key
    capabilities: [ // permissions for ucan
      {
        with: { scheme: "storage", hierPart: `${contractAddress}` },
        can: { namespace: "file", segments: [ "CREATE" ] }
      },
    ]
  })
  const token = ucans.encode(ucan) // base64 jwt-formatted auth token
  return token;
}

export {
  generateRandomRSAKeyPair,
  jsonToBase64,
  generateRandomUcanEdKeyPair,
  exportKeyPair,
  getPortalKeyVerifiers,
  generatePortalKeys,
  getAuthToken
};