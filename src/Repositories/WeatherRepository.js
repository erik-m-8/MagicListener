import { db } from "../db/index.js";

class WeatherRepository {
  /**
   * Bulk upsert (VERY useful for streams)
   */
  async upsertMany(weather) {
    if (!weather.length) return;
    try {
      await db.insertInto("weather").values(weather).execute();
    } catch (err) {
      console.error("❌ Weather insert failed:", err.message);
    }
  }
}

export default new WeatherRepository();
