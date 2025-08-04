class BaseStorageProvider {
  async upload(fileName, content) {
    throw new Error('Method not implemented');
  }

  async download(reference) {
    throw new Error('Method not implemented');
  }

  async unpin(reference) {
    throw new Error('Method not implemented');
  }

  async protocol() {
    throw new Error('Method not implemented');
  }

  async isConnected() {
    throw new Error('Method not implemented');
  }
}

export { BaseStorageProvider };
