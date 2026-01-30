import Ably from "ably";

class MessageService {
  constructor({ apiKey, clientId }) {
    this.apiKey = apiKey;
    this.clientId = clientId;
    this.realtimeClient = null;
  }

  async connect() {
    if (this.realtimeClient) return this.realtimeClient;

    this.realtimeClient = new Ably.Realtime({
      key: this.apiKey,
      clientId: this.clientId
    });

    await this.realtimeClient.connection.once("connected");
    console.log("Made my first connection!");

    return this.realtimeClient;
  }

  getChannel(name) {
    if (!this.realtimeClient) {
      throw new Error("Ably not connected. Call connect() first.");
    }

    return this.realtimeClient.channels.get(name);
  }

  async publish(channelName, eventName, data) {
    const channel = this.getChannel(channelName);
    console.log(`📨 Publishing event "${eventName}" to channel "${channelName}"`);
    await channel.publish(eventName, {
      data,
      timestamp: Date.now()
    });
  }
}

export default MessageService;