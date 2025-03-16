import { Bee } from "@ethersphere/bee-js";
import { BaseStorageProvider } from "./base.js";

class SwarmStorageProvider extends BaseStorageProvider {
  constructor({ beeUrl, postageBatchId }) {
    super();
    if (!beeUrl) {
      throw new Error("Bee node URL is required");
    }
    if (!postageBatchId) {
      throw new Error(
        "Postage batch ID is required for uploading data to Swarm"
      );
    }
    this.bee = new Bee(beeUrl);
    this.postageBatchId = postageBatchId;
  }

  async protocol() {
    return "bzz://";
  }

  async upload(fileName, content) {
    try {
      const protocol = await this.protocol();
      // Create a File object from the content
      const file = new File([content], fileName, { type: "text/plain" });

      // Upload the file to Swarm
      const result = await this.bee.uploadFile(
        this.postageBatchId,
        file,
        fileName,
        {
          pin: true, // Pin the content to make it persistent
        }
      );

      // Return the Swarm reference as a URI
      return `${protocol}${result.reference}`;
    } catch (error) {
      console.error("Error uploading to Swarm:", error);
      throw error;
    }
  }

  async download(reference) {
    try {
      const protocol = await this.protocol();
      const strippedReference = reference.replace(protocol, "");
      const result = await this.bee.downloadFile(strippedReference);
      return result;
    } catch (error) {
      console.error("Error downloading from Swarm:", error);
      throw error;
    }
  }

  async isConnected() {
    try {
      await this.bee.checkConnection();
      return true;
    } catch {
      return false;
    }
  }
}

export { SwarmStorageProvider };
