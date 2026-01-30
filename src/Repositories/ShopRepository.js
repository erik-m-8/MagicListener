import { db } from "../db/index.js";

class ShopRepository {
  /**
   * Bulk upsert (VERY useful for streams)
   */
  async upsertMany(stock) {
    if (!stock.length) return;
    try {
      await db.insertInto("stock").values(stock).execute();
    } catch (err) {
      console.error("❌ Stock insert failed:", err.message);
    }
  }
}

export default new ShopRepository();
