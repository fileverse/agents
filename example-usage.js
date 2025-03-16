import { Agent, PinataStorageProvider } from "./index.js";

const pinataStorage = new PinataStorageProvider({
  pinataJWT: "your-jwt",
  pinataGateway: "your-gateway",
});

const agent = new Agent({
  chain: "gnosis",
  pimlicoAPIKey: "your-api-key",
  storageProvider: pinataStorage,
});

const output = await agent.create("Hello, world!");
console.log(output);
