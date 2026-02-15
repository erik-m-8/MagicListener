import ShopRepository  from "./Repositories/ShopRepository.js";
import WeatherRepository from "./Repositories/WeatherRepository.js";
import { EventSource } from "eventsource";
import MessageService from "./Services/MessageService.js";
/**
 * Background task that listens to an API stream via SSE
 */
class StreamListener {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.shopRepository = ShopRepository;
    this.weatherRepository = WeatherRepository;
    this.messageService = new MessageService({
      apiKey: process.env.ABLY_API_KEY,
      clientId: "MagicListener",
    });
    this.isRunning = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.timeData = {};
    this.weather = "";
    this.source = null;
  }

  async start() {
    if (this.isRunning) {
      console.warn("⚠ Stream listener already running");
      return;
    }
    await this.messageService.connect();
    this.isRunning = true;
    console.log(`🔄 Starting SSE stream listener: ${this.apiUrl}`);
    this.connect();
  }

  connect() {
    this.source = new EventSource(this.apiUrl);
    // Generic messages (no event name)
    this.source.onmessage = (event) => {
      this.handleData(event.data);
    };

    // Named SSE event: event: shops
    this.source.addEventListener("shops", (event) => {
      this.handleData(event.data);
    });

    this.source.addEventListener("weather", (event) => {
      console.log("🌤 Weather event received");
      this.handleWeatherData(event.data);
    });

    this.source.onerror = (err) => {
      console.error("❌ SSE error", err);
      this.retry();
    };
  }

  async handleData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      let messageData = [];
      const now = new Date();
      Object.keys(data).forEach((key) => {
        if (!this.timeData[key]) {
          this.timeData[key] = {
            lastrun: null,
            itemLength: 0,
            items: [],
          };
        }

        const incomingTime = Number(data[key]?.secondsUntilRestock);
        const incomingItems = data[key].items ?? [];

        const prevItems = this.timeData[key].items ?? [];
        const prevNames = new Set(prevItems.map((i) => i.name));
        const newItems = incomingItems.filter(
          (item) => !prevNames.has(item.name),
        );

        const currentTime = this.timeData[key].lastrun;

        // Restock timer reset (counting DOWN)
        if (currentTime === null || incomingTime > currentTime) {
          this.timeData[key].lastrun = incomingTime;
          this.timeData[key].items = incomingItems;
          console.log(`🔄 Restock detected for ${key}, resetting state`);
          let dbData = data[key].items.map((item) => ({
            type: key,
            name: item.name,
            stock: item.stock,
            spawn_time: now,
          }));
          messageData = [...messageData, ...dbData];
        } else if (newItems.length > 0) {
          // update stored state
          this.timeData[key].items = incomingItems;
          let dbData = newItems.map((item) => ({
            type: key,
            name: item.name,
            stock: item.stock,
            spawn_time: now,
          }));
          messageData = [...messageData, ...dbData];
        } else {
          this.timeData[key].lastrun = incomingTime;
        }
      });
      if (messageData.length === 0) {
        return;
      }
      await this.messageService.publish("persisted:shops", "event", messageData);
      //update shop data in DB
      await this.shopRepository.upsertMany(messageData);
      this.retryCount = 0;
    } catch (err) {
      console.warn("⚠ Failed to parse SSE JSON:", err);
    }
  }

  async handleWeatherData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      const incomingWeather = data.weather ?? "";
      const now = new Date();
      const prevWeather = this.weather;
      if (prevWeather !== incomingWeather) {
        this.weather = incomingWeather;
        let messageData = [{
            type: 'weather',
            name: incomingWeather,
            stock: '',
            spawn_time: now,
          }];
        await this.messageService.publish("persisted:weather", "event", messageData);
        // DB update or notify about weather change can be handled here
        await this.weatherRepository.upsertMany([
          {
            weather: incomingWeather,
            spawn_time: now,
          },
        ]);
      }
      this.retryCount = 0;
    } catch (err) {
      console.warn("⚠ Failed to parse SSE JSON:", err);
    }
  }

  retry() {
    if (!this.isRunning) return;

    this.retryCount++;
    this.source.close();

    if (this.retryCount > this.maxRetries) {
      console.error("❌ Max retries reached");
      this.stop();
      return;
    }

    console.log(`🔄 Reconnecting SSE (${this.retryCount}/${this.maxRetries})`);
    setTimeout(() => this.connect(), 5000);
  }

  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.source?.close();
    this.source = null;

    console.log("🛑 SSE stream listener stopped");
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      retryCount: this.retryCount,
      apiUrl: this.apiUrl,
    };
  }
}

export default StreamListener;