// Direct access to the e2e test database for assertions and setup the UI can't do (e.g. expiring a batch).
const path = require("path");
// The backend repo is expected next to this one (…/koc-inventory-backend); override with BACKEND_DIR
const BACKEND = process.env.BACKEND_DIR || path.resolve(__dirname, "../../../koc-inventory-backend");
const knex = require(path.join(BACKEND, "node_modules/knex"));
require(path.join(BACKEND, "node_modules/dotenv")).config({ path: path.join(BACKEND, ".env") });

const conn = knex({
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 3306,
    database: "pos_inventory_e2e", // never the dev database
  },
  pool: { min: 0, max: 2 },
});

const variantOf = (itemName) =>
  conn("inventory_variants as v").join("inventories as i", "i.id", "v.inventory_id").where("i.name", itemName).whereNull("v.deleted_at").select("v.*", "i.id as item_id").first();

const db = {
  conn,
  async variantQty(itemName) {
    return Number((await variantOf(itemName)).current_qty);
  },
  async expireFirstBatch(itemName) {
    const v = await variantOf(itemName);
    await conn("inventories").where("id", v.item_id).update({ has_expiry: true });
    const batch = await conn("inventory_stocks").where("variant_id", v.id).whereNull("archived_at").orderBy("id").first();
    await conn("inventory_stocks").where("id", batch.id).update({ expires_at: new Date(Date.now() - 86400000) });
  },
  async restoreTshirt() {
    const v = await variantOf("T-Shirt");
    await conn("inventories").where("id", v.item_id).update({ has_expiry: false });
    const [id] = await conn("inventory_stocks").insert({
      inventory_id: v.item_id, variant_id: v.id, reference_no: "RESTOCK-E2E", batch_quantity: 100, current_quantity: 100, received_at: new Date(),
    });
    await conn("inventory_variants").where("id", v.id).increment("current_qty", 100).update({ status: "active" });
    await conn("inventories").where("id", v.item_id).increment("current_qty", 100).update({ status: "active" });
    return id;
  },
};

module.exports = { db };
