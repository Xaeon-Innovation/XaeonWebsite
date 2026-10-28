/**
 * Seeds the galaxy of stars from existing CMS content: one star per published case study, plus one per
 * testimonial company that isn't already a star. Stars are created HIDDEN (published: false) so the team
 * can check permission, logo and constellation in the admin (Site — Galaxy of stars) before publishing.
 * Idempotent: skips names that already exist.
 *
 *   npx ts-node scripts/migrate-stars.ts            # dry run
 *   npx ts-node scripts/migrate-stars.ts --apply    # inserts
 */
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import CaseStudy from "../src/models/caseStudy.model";
import Star from "../src/models/star.model";
import Testimonial from "../src/models/testimonial.model";

dotenv.config({ path: path.resolve(__dirname, "..", ".env"), quiet: true });

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  if (!process.env.DB_URI) throw new Error("DB_URI is not set");
  await mongoose.connect(process.env.DB_URI);

  const existing = new Set((await Star.find().select("name").lean()).map((s) => s.name.trim().toLowerCase()));
  const toCreate: Record<string, unknown>[] = [];
  const add = (doc: Record<string, unknown>) => {
    const key = String(doc.name).trim().toLowerCase();
    if (!key || existing.has(key)) return;
    existing.add(key);
    toCreate.push(doc);
  };

  for (const cs of await CaseStudy.find({ published: true }).sort({ sortOrder: 1 }).lean()) {
    add({ name: cs.title, logoUrl: cs.logoUrl, industry: cs.subtitle?.split("·")[0]?.trim(), product: "custom", magnitude: 3, caseStudy: cs._id, highlight: cs.stats?.[0] ? `${cs.stats[0].value} ${cs.stats[0].label}` : undefined, published: false, sortOrder: toCreate.length });
  }
  for (const t of await Testimonial.find({ published: true }).sort({ sortOrder: 1 }).lean()) {
    if (t.company) add({ name: t.company, logoUrl: t.logoUrl, product: "website", magnitude: 2, highlight: t.quote.slice(0, 200), published: false, sortOrder: toCreate.length });
  }

  console.log(`${toCreate.length} new star(s): ${toCreate.map((d) => d.name).join(", ") || "none"}`);
  if (apply && toCreate.length) await Star.insertMany(toCreate);
  console.log(apply ? "Done. Review and publish them in the admin." : "Dry run. Re-run with --apply to insert.");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
