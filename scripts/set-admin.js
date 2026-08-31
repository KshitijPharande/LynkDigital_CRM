const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "romadevadhar@lynkdigital.co.in".toLowerCase().trim();
  const rawPassword = "Lynkdigital@2026";
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  console.log(`Setting up Admin account for ${email}...`);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN",
      name: "Roma Devadhar",
      designation: "Managing Director",
      department: "Executive Management",
      status: "ACTIVE",
    },
    create: {
      email,
      passwordHash,
      name: "Roma Devadhar",
      role: "ADMIN",
      designation: "Managing Director",
      department: "Executive Management",
      status: "ACTIVE",
    },
  });

  console.log("✅ Admin account created/updated successfully!");
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);
  console.log(`Name: ${user.name}`);
}

main()
  .catch((e) => {
    console.error("❌ Error setting admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
