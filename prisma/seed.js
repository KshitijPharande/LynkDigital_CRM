const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Initializing LynkDigital CRM Production Database...");

  const adminEmail = "romadevadhar@lynkdigital.co.in";
  const passwordHash = await bcrypt.hash("Lynkdigital@2026", 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      name: "Roma Devadhar",
      role: "ADMIN",
      designation: "Managing Director",
      department: "Executive Management",
      status: "ACTIVE",
    },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Roma Devadhar",
      role: "ADMIN",
      designation: "Managing Director",
      department: "Executive Management",
      status: "ACTIVE",
    },
  });

  console.log(`✅ Production Admin verified: ${admin.email}`);
  console.log("✨ Ready for production use!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
