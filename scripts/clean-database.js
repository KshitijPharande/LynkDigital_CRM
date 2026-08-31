const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log("🧹 Cleaning all dummy data from Supabase database...");

  // 1. Delete all child records
  await prisma.activityLog.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.clientApproval.deleteMany({});
  await prisma.contentCalendar.deleteMany({});
  await prisma.clientAssignment.deleteMany({});
  await prisma.client.deleteMany({});

  // 2. Delete all demo users EXCEPT Roma Devadhar
  const adminEmail = "romadevadhar@lynkdigital.co.in";
  await prisma.user.deleteMany({
    where: {
      email: {
        not: adminEmail,
      },
    },
  });

  // 3. Post a clean initial welcome announcement
  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (admin) {
    await prisma.announcement.create({
      data: {
        title: "Welcome to LynkDigital Operations Hub",
        content: "Welcome team! Use this platform to access client content calendars, review deliverables for approval, submit leave requests, and manage agency operations.",
        priority: "NORMAL",
        authorId: admin.id,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "SYSTEM_INITIALIZED",
        entityType: "USER",
        entityId: admin.id,
        details: `LynkDigital CRM initialized with clean production database by ${admin.name}`,
        userId: admin.id,
      },
    });
  }

  console.log("✨ All dummy data cleaned successfully!");
  console.log(`✅ Preserved Admin: ${adminEmail}`);
}

cleanDatabase()
  .catch((e) => {
    console.error("❌ Error cleaning database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
