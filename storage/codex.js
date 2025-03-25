import { BaseStorageProvider } from "./base.js";
import { Codex } from "@codex-storage/sdk-js";

class CodexStorageProvider extends BaseStorageProvider {
    constructor({ codexURI }) {
        super();
        if (!codexURI) {
            throw new Error("Codex URI is required");
        }
        this.codexURI = codexURI;
        const client = new Codex(codexURI);
        this.client = client;
    }

    async upload(fileName, content) {
        const file = new File([content], fileName, { type: "text/plain" });
 
        const resultPromise = this.client.data.upload(file, undefined, {filename: fileName, contentType: file.type});
        const result = await resultPromise.result
        if (result.error) {
            throw new Error(`Failed to upload file: ${result.data.message}`);
        }
        return result.data;
    }
    async download(reference) {
        const result = await this.client.data.networkDownloadStream(reference);
        if (result.error) {
            throw new Error(`Failed to download file: ${result.data.message}`);
        }
 
        let data = await result.data.text()
       
        return data;
    }

    async isConnected() {
        const result = await this.client.debug.info()
        if (result.error) {
            throw new Error(`Failed to get Codex info: ${result.data.message}`);
        }
        return result.data.table.nodes.length > 0;
    }

    async protocol() {
        return "codex://";
    }
}

export { CodexStorageProvider };