const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

const VENUE_ID = "cmpd040u40000p551911e81o3"; // מרפסת מלה — רמת ישי

async function main() {
  const venueId = VENUE_ID;

  // ---- suppliers ----
  const drinksSup = await db.supplier.create({
    data: { venueId, name: "סטוק משקאות בע\"מ", phone: "03-9000000", email: "orders@stock.co.il" },
  });
  const produceSup = await db.supplier.create({
    data: { venueId, name: "ירקן השוק - רמת ישי", phone: "04-9500000" },
  });

  // ---- employees ----
  const employees = [
    { name: "דנה לוי", role: "MANAGER", phone: "0501111111", hourlyWageAgorot: 7500, color: "#D4AF37" },
    { name: "יוסי כהן", role: "BARTENDER", phone: "0502222222", hourlyWageAgorot: 5500, color: "#60A5FA" },
    { name: "מאיה רז", role: "BARTENDER", phone: "0503333333", hourlyWageAgorot: 5500, color: "#34D399" },
    { name: "עומר בר", role: "WAITER", phone: "0504444444", hourlyWageAgorot: 4500, color: "#F472B6" },
    { name: "נועה שדה", role: "WAITER", phone: "0505555555", hourlyWageAgorot: 4500, color: "#A78BFA" },
    { name: "איתי מור", role: "KITCHEN", phone: "0506666666", hourlyWageAgorot: 5000, color: "#FB923C" },
    { name: "רון אבן", role: "SECURITY", phone: "0507777777", hourlyWageAgorot: 6000, color: "#22D3EE" },
  ];
  const created = [];
  for (const e of employees) created.push(await db.employee.create({ data: { venueId, ...e } }));

  // ---- inventory items (some below par to trigger alerts) ----
  const items = [
    { name: "וודקה גריי גוס", category: "ALCOHOL", unit: "BOTTLE", stockQty: 6, parLevel: 4, reorderQty: 12, unitCostAgorot: 12000, supplierId: drinksSup.id },
    { name: "ערק אלית", category: "ALCOHOL", unit: "BOTTLE", stockQty: 2, parLevel: 5, reorderQty: 12, unitCostAgorot: 4500, supplierId: drinksSup.id },
    { name: "בירה גולדסטאר חבית", category: "BEER", unit: "LITER", stockQty: 30, parLevel: 20, reorderQty: 50, unitCostAgorot: 2200, supplierId: drinksSup.id },
    { name: "יין אדום קברנה", category: "WINE", unit: "BOTTLE", stockQty: 3, parLevel: 6, reorderQty: 12, unitCostAgorot: 5500, supplierId: drinksSup.id },
    { name: "קוקה קולה פחית", category: "SOFT_DRINK", unit: "CAN", stockQty: 120, parLevel: 48, reorderQty: 96, unitCostAgorot: 250, supplierId: drinksSup.id },
    { name: "סודה / מים", category: "SOFT_DRINK", unit: "BOTTLE", stockQty: 40, parLevel: 24, reorderQty: 48, unitCostAgorot: 180, supplierId: drinksSup.id },
    { name: "לימונים", category: "PRODUCE", unit: "KG", stockQty: 4, parLevel: 5, reorderQty: 10, unitCostAgorot: 800, supplierId: produceSup.id },
    { name: "קרח", category: "SUPPLIES", unit: "KG", stockQty: 25, parLevel: 15, reorderQty: 40, unitCostAgorot: 300, supplierId: drinksSup.id },
    { name: "המבורגר 220 גרם", category: "MEAT", unit: "UNIT", stockQty: 18, parLevel: 20, reorderQty: 60, unitCostAgorot: 1400, supplierId: produceSup.id },
    { name: "צ'יפס קפוא", category: "FOOD", unit: "KG", stockQty: 12, parLevel: 10, reorderQty: 25, unitCostAgorot: 1200, supplierId: produceSup.id },
    { name: "פיתות", category: "FOOD", unit: "PACK", stockQty: 8, parLevel: 12, reorderQty: 30, unitCostAgorot: 900, supplierId: produceSup.id },
    { name: "כוסות חד-פעמי", category: "SUPPLIES", unit: "PACK", stockQty: 30, parLevel: 10, reorderQty: 40, unitCostAgorot: 1500 },
  ];
  const invMap = {};
  for (const it of items) {
    const row = await db.inventoryItem.create({ data: { venueId, ...it } });
    invMap[it.name] = row;
    if (it.stockQty) await db.stockMovement.create({ data: { venueId, itemId: row.id, type: "IN", qty: it.stockQty, reason: "מלאי פתיחה" } });
  }

  // ---- recipe links (auto-deduction) ----
  const menu = await db.foodMenuItem.findMany({ where: { venueId }, select: { id: true, name: true } });
  function findMenu(re) { return menu.find((m) => re.test(m.name)); }
  const links = [];
  const burgerMenu = findMenu(/המבורגר|בורגר/);
  if (burgerMenu) {
    if (invMap["המבורגר 220 גרם"]) links.push({ menuItemId: burgerMenu.id, inventoryItemId: invMap["המבורגר 220 גרם"].id, qtyPerUnit: 1 });
    if (invMap["צ'יפס קפוא"]) links.push({ menuItemId: burgerMenu.id, inventoryItemId: invMap["צ'יפס קפוא"].id, qtyPerUnit: 0.2 });
    if (invMap["פיתות"]) links.push({ menuItemId: burgerMenu.id, inventoryItemId: invMap["פיתות"].id, qtyPerUnit: 0 });
  }
  const friesMenu = findMenu(/צ'?יפס|chips|fries/i);
  if (friesMenu && invMap["צ'יפס קפוא"]) links.push({ menuItemId: friesMenu.id, inventoryItemId: invMap["צ'יפס קפוא"].id, qtyPerUnit: 0.3 });

  for (const l of links) {
    if (l.qtyPerUnit <= 0) continue;
    await db.menuItemIngredient.upsert({
      where: { menuItemId_inventoryItemId: { menuItemId: l.menuItemId, inventoryItemId: l.inventoryItemId } },
      create: l,
      update: { qtyPerUnit: l.qtyPerUnit },
    });
  }

  // ---- shifts this week (Thu/Fri evenings) ----
  const now = new Date();
  const weekStart = new Date(now); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(now.getDate() - now.getDay());
  function shiftAt(dayOffset, startH, endH, emp, role) {
    const s = new Date(weekStart); s.setDate(weekStart.getDate() + dayOffset); s.setHours(startH, 0, 0, 0);
    const e = new Date(s); e.setHours(endH, 0, 0, 0); if (endH <= startH) e.setDate(e.getDate() + 1);
    return db.shift.create({ data: { venueId, employeeId: emp.id, role: role || emp.role, startsAt: s, endsAt: e, status: "SCHEDULED", hourlyWageAgorot: emp.hourlyWageAgorot } });
  }
  const byRole = (r) => created.find((c) => c.role === r);
  // Thursday (4) and Friday (5) evening crews
  for (const day of [4, 5]) {
    await shiftAt(day, 20, 3, byRole("MANAGER"));
    await shiftAt(day, 20, 3, created.filter((c) => c.role === "BARTENDER")[0]);
    await shiftAt(day, 21, 3, created.filter((c) => c.role === "BARTENDER")[1]);
    await shiftAt(day, 20, 3, created.filter((c) => c.role === "WAITER")[0]);
    await shiftAt(day, 21, 3, created.filter((c) => c.role === "WAITER")[1]);
    await shiftAt(day, 19, 1, byRole("KITCHEN"));
    await shiftAt(day, 21, 4, byRole("SECURITY"));
  }

  const counts = {
    employees: await db.employee.count({ where: { venueId } }),
    inventory: await db.inventoryItem.count({ where: { venueId } }),
    suppliers: await db.supplier.count({ where: { venueId } }),
    shifts: await db.shift.count({ where: { venueId } }),
    recipes: await db.menuItemIngredient.count({ where: { menuItem: { venueId } } }),
  };
  console.log("SEED DONE", JSON.stringify(counts));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
