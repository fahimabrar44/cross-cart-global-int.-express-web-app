// Seed shipping zones into MongoDB.
//
// Usage: npm run seed:zones
//
// The zone names follow the world-zone pricing list:
//   EUROPE (D), EUROPE (E), EUROPE (J), MIDDLE EAST (B),
//   ASIA (B), ASIA (F), AFRICA (J)
//
// Country assignment: fill the ZONE_COUNTRIES maps below with the ISO
// 2-letter codes that belong to each zone, or assign countries through
// the admin panel (Dashboard > Rate Charts > Zones).
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local manually (no dotenv dependency)
const envPath = path.resolve(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)?\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2] ?? "";
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is required (define it in .env.local)");
  process.exit(1);
}

// Zone name -> ISO 2-letter country codes
const ZONE_COUNTRIES = {
  "EUROPE (D)": [],
  "EUROPE (E)": [],
  "EUROPE (J)": [],
  "MIDDLE EAST (B)": [],
  "ASIA (B)": [],
  "ASIA (F)": [],
  "AFRICA (J)": [],
};

function zoneCode(name) {
  const match = name.match(/\(([^)]+)\)/);
  return match ? match[1] : null;
}

async function main() {
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  const db = mongoose.connection.db;
  const zones = db.collection("zones");
  const countries = db.collection("countrys");

  for (const [name, codes] of Object.entries(ZONE_COUNTRIES)) {
    let countryIds = [];
    if (codes && codes.length) {
      const docs = await countries.find({ code: { $in: codes } }).toArray();
      countryIds = docs.map((d) => d._id);
      console.log(
        `  Found ${countryIds.length}/${codes.length} countries for ${name}`
      );
    }

    const existing = await zones.findOne({ name });
    if (existing) {
      await zones.updateOne(
        { name },
        {
          $set: {
            code: zoneCode(name),
            countryIds,
            isActive: true,
            updatedAt: new Date(),
          },
        }
      );
      console.log(`Updated zone: ${name} (${countryIds.length} countries)`);
    } else {
      await zones.insertOne({
        name,
        code: zoneCode(name),
        countryIds,
        description: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`Created zone: ${name} (${countryIds.length} countries)`);
    }
  }

  await mongoose.disconnect();
  console.log("Zone seeding complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
