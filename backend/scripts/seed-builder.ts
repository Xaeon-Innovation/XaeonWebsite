/**
 * Seeds the Website Builder catalog (plans, add-ons, templates). Idempotent: only inserts items whose
 * tier/key/slug doesn't exist yet, so edits made in the admin panel are never overwritten.
 *
 *   npx ts-node scripts/seed-builder.ts            # dry run: lists what would be inserted
 *   npx ts-node scripts/seed-builder.ts --apply    # inserts
 */
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import BuilderAddon from "../src/models/builderAddon.model";
import BuilderPlan from "../src/models/builderPlan.model";
import BuilderTemplate from "../src/models/builderTemplate.model";
import { addonDocs, planDocs, templateDocs } from "./builderCatalogData";

dotenv.config({ path: path.resolve(__dirname, "..", ".env"), quiet: true });

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  if (!process.env.DB_URI) throw new Error("DB_URI is not set");
  await mongoose.connect(process.env.DB_URI);

  const sets = [
    { label: "plans", model: BuilderPlan as mongoose.Model<unknown>, key: "tier", docs: planDocs() as Record<string, unknown>[] },
    { label: "add-ons", model: BuilderAddon as mongoose.Model<unknown>, key: "key", docs: addonDocs() as Record<string, unknown>[] },
    { label: "templates", model: BuilderTemplate as mongoose.Model<unknown>, key: "slug", docs: templateDocs() as Record<string, unknown>[] },
  ];

  for (const { label, model, key, docs } of sets) {
    const existing = new Set((await model.find().select(key).lean<Record<string, unknown>[]>()).map((d) => String(d[key])));
    const missing = docs.filter((d) => !existing.has(String(d[key])));
    console.log(`${label}: ${docs.length} in seed, ${missing.length} missing${missing.length ? ` (${missing.map((d) => d[key]).join(", ")})` : ""}`);
    if (apply && missing.length) await model.insertMany(missing);
  }
  console.log(apply ? "Done." : "Dry run. Re-run with --apply to insert.");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
