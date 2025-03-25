import 'dotenv/config';
import { describe, it } from 'mocha';
import { expect } from "chai";
import { CodexStorageProvider } from "../storage/codex.js";

describe("Test Codex", () => {
  it("should be able to create a Codex instance", async () => {
    const codex = new CodexStorageProvider({ codexURI: process.env.CODEX_URI});
    const cid = await codex.upload("output.md", "Hello World")
    const content = await codex.download(cid)

    expect(content).to.eq("Hello World")
  });
});