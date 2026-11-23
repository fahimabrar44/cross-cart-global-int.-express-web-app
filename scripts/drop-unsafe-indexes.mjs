/**
 * Removes the dangerous TTL indexes that used to be defined on the User model.
 *
 * MongoDB TTL indexes delete the WHOLE document when the indexed date passes,
 * so `emailVerification.expires` / `passwordReset.expires` TTL indexes deleted
 * entire user accounts 15/30 minutes after signup or a password-reset request.
 *
 * Run once against every existing database:
 *   npm run db:drop-unsafe-indexes
 */
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI is required. Set it in .env.local or the shell.");
  process.exit(1);
}

const UNSAFE_KEYS = ["emailVerification.expires", "passwordReset.expires"];

try {
  await mongoose.connect(uri, { bufferCommands: false });
  const users = mongoose.connection.db.collection("users");
  const indexes = await users.indexes();

  const unsafe = indexes.filter(
    (index) =>
      index.expireAfterSeconds !== undefined &&
      UNSAFE_KEYS.some((key) => Object.prototype.hasOwnProperty.call(index.key, key))
  );

  if (unsafe.length === 0) {
    console.log("No unsafe TTL indexes found on the users collection. Nothing to do.");
  }

  for (const index of unsafe) {
    await users.dropIndex(index.name);
    console.log(`Dropped unsafe TTL index: ${index.name}`);
  }
} catch (error) {
  console.error("Failed to drop unsafe indexes:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => undefined);
}
