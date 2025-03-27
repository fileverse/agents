import 'dotenv/config';
import { describe, it } from 'mocha';
import { expect } from "chai";
import { CodexStorageProvider } from "../storage/codex.js";

describe("Test Codex", () => {
  it("should be able to create a Codex instance", async () => {
    const codex = new CodexStorageProvider({ codexURI: process.env.CODEX_URI});
    const connected = await codex.isConnected();
    expect(connected).to.be.true;
  });
  
  it("should be able to upload and download a file", async () => {
    const codex = new CodexStorageProvider({ codexURI: process.env.CODEX_URI});
    const connected = await codex.isConnected();
    expect(connected).to.be.true;
  
    const content = "Hello World!"
    const cid = await codex.upload("output.md", content)
    const downloadedContent = await codex.download(cid)

    expect(downloadedContent).to.eq(content)
 
  });
});
