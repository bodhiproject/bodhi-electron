class DBHelper {
  static async insertTopic(db, topic) {
    try {
      await db.insert(topic);
    } catch (err) {
      logger.error(`Error inserting Topic ${topic.txid}: ${err.message}`);
      throw err;
    }
  }

  static async insertOracle(db, oracle) {
    try {
      await db.insert(oracle);
    } catch (err) {
      logger.error(`Error inserting Oracle ${oracle.txid}: ${err.message}`);
      throw err;
    }
  }

  static async insertTransaction(db, tx) {
    try {
      await db.insert(tx);
    } catch (err) {
      logger.error(`Error inserting Transaction ${tx.type} ${tx.txid}: ${err.message}`);
      throw err;
    }
  }
}

module.exports = DBHelper;