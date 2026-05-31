import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

let seeded = false;

export async function ensureSeed() {
  if (seeded) return;
  const count = await prisma.person.count();
  if (count > 0) {
    seeded = true;
    return;
  }

  const peoplePath = path.join(process.cwd(), "data", "people-hay-di.json");
  const tiersPath = path.join(process.cwd(), "data", "price-tiers.json");

  if (!fs.existsSync(peoplePath)) return;

  const peopleData = JSON.parse(fs.readFileSync(peoplePath, "utf-8"));
  const tiersData = JSON.parse(fs.readFileSync(tiersPath, "utf-8"));

  const idMap = new Map<string, string>();
  for (const p of peopleData.people) {
    const created = await prisma.person.create({ data: { name: p.name } });
    idMap.set(p.id, created.id);
  }

  for (const g of peopleData.frequentGroups) {
    const group = await prisma.frequentGroup.create({ data: { label: g.label } });
    for (const pid of g.personIds) {
      const dbId = idMap.get(pid);
      if (dbId) {
        await prisma.frequentGroupMember.create({
          data: { frequentGroupId: group.id, personId: dbId },
        });
      }
    }
  }

  let order = 0;
  for (const t of tiersData.tiers) {
    await prisma.priceTier.create({
      data: {
        amount: t.amount,
        label: t.label,
        sortOrder: order++,
        isDefault: t.isDefault ?? false,
      },
    });
  }

  seeded = true;
}
