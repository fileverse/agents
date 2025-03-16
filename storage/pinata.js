import { PinataSDK } from "pinata-web3";
import { BaseStorageProvider } from "./base.js";

class PinataStorageProvider extends BaseStorageProvider {
  constructor({ pinataJWT, pinataGateway }) {
    super();
    if (!pinataJWT || !pinataGateway) {
      throw new Error("Pinata JWT and gateway are required");
    }
    this.pinata = new PinataSDK({
      pinataJwt: pinataJWT,
      pinataGateway: pinataGateway,
    });
  }

  async protocol() {
    return "ipfs://";
  }

  async upload(fileName, content) {
    try {
      const protocol = await this.protocol();
      const file = new File([content], fileName, { type: "text/plain" });
      const result = await this.pinata.upload.file(file);
      return `${protocol}${result.IpfsHash}`;
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      throw error;
    }
  }

  async download(reference) {
    const protocol = await this.protocol();
    const strippedReference = reference.replace(protocol, '');
    const result = await this.pinata.download.file(strippedReference);
    return result;
  }

  async isConnected() {
    try {
      const result = await this.pinata.testAuthentication();
      return result;
    } catch (error) {
      console.error("Error testing Pinata auth:", error);
      return false;
    }
  }
}

export { PinataStorageProvider }; 