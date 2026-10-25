/**
 * One-off, idempotent migration for the CRM (Phase 3).
 *
 *   npx ts-node scripts/migrate-leads.ts            # dry run: prints what would change
 *   npx ts-node scripts/migrate-leads.ts --apply    # writes the changes
 *
 * For every request without a pipeline stage: stage from the old status
 * (Pending Review → new, Accepted → qualified, Rejected → lost), contactKey from the email,
 * and a "created" history entry dated at the lead's creation.
 */
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: path.resolve(__dirname, "..", ".env"), quiet: true });

const STATUS_TO_STAGE: Record<string, string> = {
  "Pending Review": "new",
  Accepted: "qualified",
  Rejected: "lost",
};

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  if (!process.env.DB_URI) throw new Error("DB_URI is not set");
  await mongoose.connect(process.env.DB_URI);
  const col = mongoose.connection.collection("servicerequests");

  const docs = await col
    .find({ stage: { $exists: false } }, { projection: { status: 1, source: 1, contactEmail: 1, createdAt: 1 } })
    .toArray();
  const counts: Record<string, number> = {};
  const ops = docs.map((d) => {
    const stage = STATUS_TO_STAGE[String(d.status)] ?? "new";
    counts[stage] = (counts[stage] ?? 0) + 1;
    return {
      updateOne: {
        filter: { _id: d._id, stage: { $exists: false } },
        update: {
          $set: {
            stage,
            currency: "EGP",
            followUpAt: null,
            value: null,
            ...(d.contactEmail ? { contactKey: String(d.contactEmail).trim().toLowerCase() } : {}),
          },
          $push: {
            activity: {
              _id: new mongoose.Types.ObjectId(),
              type: "created",
              message: `Lead created from ${d.source ?? "website"} (imported; status was ${d.status ?? "unknown"})`,
              at: d.createdAt ?? new Date(),
            },
          },
        },
      },
    };
  });

  console.log(`${docs.length} requests need a stage:`, counts);
  if (!apply) {
    console.log("Dry run. Re-run with --apply to write.");
  } else if (ops.length) {
    const res = await col.bulkWrite(ops as Parameters<typeof col.bulkWrite>[0]);
    console.log(`Updated ${res.modifiedCount} documents.`);
  }
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
