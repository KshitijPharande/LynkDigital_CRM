const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding LynkDigital CRM database...");

  // Password hash for 'password123'
  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Clean existing records
  await prisma.activityLog.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.clientApproval.deleteMany({});
  await prisma.contentCalendar.deleteMany({});
  await prisma.clientAssignment.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create 3 Authorized Administrators (as specified in PRD)
  const admin1 = await prisma.user.create({
    data: {
      email: "alex@lynkdigital.com",
      passwordHash,
      name: "Alex Morgan",
      role: "ADMIN",
      designation: "Managing Director",
      department: "Executive Management",
      phone: "+1 (555) 019-2834",
      status: "ACTIVE",
      joiningDate: new Date("2024-01-15"),
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      email: "priya@lynkdigital.com",
      passwordHash,
      name: "Priya Sharma",
      role: "ADMIN",
      designation: "Operations Director",
      department: "Operations",
      phone: "+1 (555) 024-9182",
      status: "ACTIVE",
      joiningDate: new Date("2024-02-01"),
    },
  });

  const admin3 = await prisma.user.create({
    data: {
      email: "marcus@lynkdigital.com",
      passwordHash,
      name: "Marcus Vance",
      role: "ADMIN",
      designation: "Creative Director",
      department: "Creative Strategy",
      phone: "+1 (555) 039-7124",
      status: "ACTIVE",
      joiningDate: new Date("2024-02-15"),
    },
  });

  // 3. Create Team Members (Employees)
  const empSarah = await prisma.user.create({
    data: {
      email: "sarah.chen@lynkdigital.com",
      passwordHash,
      name: "Sarah Chen",
      role: "EMPLOYEE",
      designation: "Lead Social Media Strategist",
      department: "Social Media",
      phone: "+1 (555) 482-9912",
      status: "ACTIVE",
      joiningDate: new Date("2024-04-10"),
    },
  });

  const empDavid = await prisma.user.create({
    data: {
      email: "david.kim@lynkdigital.com",
      passwordHash,
      name: "David Kim",
      role: "EMPLOYEE",
      designation: "Senior Graphic Designer",
      department: "Design",
      phone: "+1 (555) 392-1084",
      status: "ACTIVE",
      joiningDate: new Date("2024-05-01"),
    },
  });

  const empLiam = await prisma.user.create({
    data: {
      email: "liam.rossi@lynkdigital.com",
      passwordHash,
      name: "Liam Rossi",
      role: "EMPLOYEE",
      designation: "Video Editor & Motion Designer",
      department: "Video Production",
      phone: "+1 (555) 837-2910",
      status: "ACTIVE",
      joiningDate: new Date("2024-06-15"),
    },
  });

  const empEmily = await prisma.user.create({
    data: {
      email: "emily.watson@lynkdigital.com",
      passwordHash,
      name: "Emily Watson",
      role: "EMPLOYEE",
      designation: "Senior Copywriter",
      department: "Content & Copy",
      phone: "+1 (555) 629-4419",
      status: "ACTIVE",
      joiningDate: new Date("2024-07-01"),
    },
  });

  const empJordan = await prisma.user.create({
    data: {
      email: "jordan.lee@lynkdigital.com",
      passwordHash,
      name: "Jordan Lee",
      role: "EMPLOYEE",
      designation: "Account Executive",
      department: "Client Services",
      phone: "+1 (555) 912-3048",
      status: "ACTIVE",
      joiningDate: new Date("2024-08-01"),
    },
  });

  console.log("✅ Seeded 3 Admins and 5 Employees");

  // 4. Create Agency Clients
  const clientApex = await prisma.client.create({
    data: {
      brandName: "Apex Athletics",
      industry: "Sportswear & Fitness",
      contactPerson: "Carlos Rivera",
      contactEmail: "carlos@apexathletics.com",
      contactPhone: "+1 (555) 778-9901",
      accountManagerId: admin1.id,
      status: "ACTIVE",
      priority: "HIGH",
      services: "Social Media Management, Short-form Video, Meta & TikTok Ads",
      startDate: new Date("2025-01-10"),
      internalNotes: "High-touch enterprise client. Bi-weekly review every alternate Tuesday.",
      googleDriveFolder: "https://drive.google.com/drive/folders/1ApexAthleticsAssets2026",
      brandGuidelinesUrl: "https://drive.google.com/file/d/1ApexBrandIdentityGuidelines/view",
      clientBriefUrl: "https://docs.google.com/document/d/1ApexQ3CampaignBrief/edit",
      campaignDocsUrl: "https://docs.google.com/spreadsheets/d/1ApexDeliverablesTracker/edit",
    },
  });

  const clientLumina = await prisma.client.create({
    data: {
      brandName: "Lumina Skincare",
      industry: "Clean Beauty & Cosmetics",
      contactPerson: "Elena Rostova",
      contactEmail: "elena@luminaskin.co",
      contactPhone: "+1 (555) 334-9021",
      accountManagerId: admin2.id,
      status: "ACTIVE",
      priority: "HIGH",
      services: "Brand Identity, Influencer Sourcing, Content Calendars, Paid Social",
      startDate: new Date("2025-03-01"),
      internalNotes: "Prefers pastel minimalist aesthetics. Content approval turnaround is 24-48h.",
      googleDriveFolder: "https://drive.google.com/drive/folders/1LuminaSkincareMediaKit",
      brandGuidelinesUrl: "https://drive.google.com/file/d/1LuminaStyleGuide2026/view",
      clientBriefUrl: "https://docs.google.com/document/d/1LuminaLaunchBrief/edit",
      campaignDocsUrl: "https://docs.google.com/spreadsheets/d/1LuminaAdPerformance/edit",
    },
  });

  const clientZenith = await prisma.client.create({
    data: {
      brandName: "Zenith Fintech",
      industry: "B2B SaaS & Financial Tech",
      contactPerson: "Arthur Pendelton",
      contactEmail: "arthur@zenithpay.io",
      contactPhone: "+1 (555) 441-2093",
      accountManagerId: empJordan.id,
      status: "ACTIVE",
      priority: "MEDIUM",
      services: "LinkedIn Thought Leadership, Infographics, Carousel Ads, Whitepapers",
      startDate: new Date("2025-04-15"),
      internalNotes: "Requires compliance signoff on all financial copy before posting.",
      googleDriveFolder: "https://drive.google.com/drive/folders/1ZenithFintechAssets",
      brandGuidelinesUrl: "https://drive.google.com/file/d/1ZenithVisualStandards/view",
      clientBriefUrl: "https://docs.google.com/document/d/1ZenithContentStrategy/edit",
    },
  });

  const clientKuro = await prisma.client.create({
    data: {
      brandName: "Kuro Coffee Roasters",
      industry: "Specialty Food & Beverage",
      contactPerson: "Kenji Takahashi",
      contactEmail: "kenji@kurocoffee.jp",
      contactPhone: "+1 (555) 829-1120",
      accountManagerId: admin3.id,
      status: "ACTIVE",
      priority: "MEDIUM",
      services: "TikTok Video Production, Instagram Aesthetic Grid, Packaging Photoshoots",
      startDate: new Date("2025-06-01"),
      internalNotes: "Focusing heavily on TikTok viral coffee recipes and barista reels.",
      googleDriveFolder: "https://drive.google.com/drive/folders/1KuroCoffeeAssets",
      brandGuidelinesUrl: "https://drive.google.com/file/d/1KuroBrandManual/view",
      clientBriefUrl: "https://docs.google.com/document/d/1KuroViralStrategy/edit",
    },
  });

  const clientVanguard = await prisma.client.create({
    data: {
      brandName: "Vanguard Luxury Realty",
      industry: "Real Estate & Architecture",
      contactPerson: "Victoria Sterling",
      contactEmail: "victoria@vanguardestates.com",
      contactPhone: "+1 (555) 902-8841",
      accountManagerId: admin1.id,
      status: "ON_HOLD",
      priority: "LOW",
      services: "Drone Video Editing, Property Showcase Reels, Local Meta Ads",
      startDate: new Date("2025-02-15"),
      internalNotes: "Paused for Q3 property portfolio restructuring. Resuming next month.",
      googleDriveFolder: "https://drive.google.com/drive/folders/1VanguardRealtyAssets",
    },
  });

  console.log("✅ Seeded 5 Agency Clients");

  // 5. Assign Team Members to Clients
  await prisma.clientAssignment.createMany({
    data: [
      // Apex Athletics Team
      { clientId: clientApex.id, userId: admin1.id, role: "ACCOUNT_MANAGER" },
      { clientId: clientApex.id, userId: empSarah.id, role: "SOCIAL_MEDIA_MANAGER" },
      { clientId: clientApex.id, userId: empDavid.id, role: "DESIGNER" },
      { clientId: clientApex.id, userId: empLiam.id, role: "VIDEO_EDITOR" },
      { clientId: clientApex.id, userId: empEmily.id, role: "COPYWRITER" },

      // Lumina Skincare Team
      { clientId: clientLumina.id, userId: admin2.id, role: "ACCOUNT_MANAGER" },
      { clientId: clientLumina.id, userId: empSarah.id, role: "SOCIAL_MEDIA_MANAGER" },
      { clientId: clientLumina.id, userId: empDavid.id, role: "DESIGNER" },
      { clientId: clientLumina.id, userId: empEmily.id, role: "COPYWRITER" },

      // Zenith Fintech Team
      { clientId: clientZenith.id, userId: empJordan.id, role: "ACCOUNT_MANAGER" },
      { clientId: clientZenith.id, userId: empDavid.id, role: "DESIGNER" },
      { clientId: clientZenith.id, userId: empEmily.id, role: "COPYWRITER" },

      // Kuro Coffee Team
      { clientId: clientKuro.id, userId: admin3.id, role: "ACCOUNT_MANAGER" },
      { clientId: clientKuro.id, userId: empSarah.id, role: "SOCIAL_MEDIA_MANAGER" },
      { clientId: clientKuro.id, userId: empLiam.id, role: "VIDEO_EDITOR" },
    ],
  });

  console.log("✅ Seeded Team Assignments");

  // 6. Seed Content Calendars (with realistic Google Sheets URLs)
  await prisma.contentCalendar.createMany({
    data: [
      {
        clientId: clientApex.id,
        month: "September 2026",
        year: 2026,
        googleSheetUrl: "https://docs.google.com/spreadsheets/d/1Apex-Sept2026-Calendar/edit",
        status: "IN_PROGRESS",
        approvalStatus: "PENDING",
        nextDeadline: new Date("2026-09-05"),
      },
      {
        clientId: clientApex.id,
        month: "August 2026",
        year: 2026,
        googleSheetUrl: "https://docs.google.com/spreadsheets/d/1Apex-Aug2026-Calendar/edit",
        status: "COMPLETED",
        approvalStatus: "APPROVED",
        nextDeadline: new Date("2026-08-31"),
      },
      {
        clientId: clientLumina.id,
        month: "September 2026",
        year: 2026,
        googleSheetUrl: "https://docs.google.com/spreadsheets/d/1Lumina-Sept2026-Calendar/edit",
        status: "APPROVED",
        approvalStatus: "APPROVED",
        nextDeadline: new Date("2026-09-08"),
      },
      {
        clientId: clientZenith.id,
        month: "September 2026",
        year: 2026,
        googleSheetUrl: "https://docs.google.com/spreadsheets/d/1Zenith-Sept2026-Calendar/edit",
        status: "IN_PROGRESS",
        approvalStatus: "CHANGES_REQUESTED",
        nextDeadline: new Date("2026-09-04"),
      },
      {
        clientId: clientKuro.id,
        month: "September 2026",
        year: 2026,
        googleSheetUrl: "https://docs.google.com/spreadsheets/d/1Kuro-Sept2026-Calendar/edit",
        status: "NOT_STARTED",
        approvalStatus: "PENDING",
        nextDeadline: new Date("2026-09-10"),
      },
    ],
  });

  console.log("✅ Seeded Content Calendar Directories");

  // 7. Seed Client Approval Tracker items
  await prisma.clientApproval.createMany({
    data: [
      {
        clientId: clientApex.id,
        deliverableName: "Instagram Reel 03 - Fall Apparel Reveal",
        deliverableType: "Reel",
        sentDate: new Date("2026-08-29"),
        status: "SENT_TO_CLIENT",
        previewUrl: "https://drive.google.com/file/d/1ApexReel03Preview/view",
        notes: "High-energy gym edit with upbeat audio. Awaiting Carlos's confirmation.",
      },
      {
        clientId: clientApex.id,
        deliverableName: "Meta Ads Story Variations (4 Sets)",
        deliverableType: "Ad Banner",
        sentDate: new Date("2026-08-26"),
        status: "APPROVED",
        previewUrl: "https://drive.google.com/file/d/1ApexMetaStories/view",
        notes: "Approved by client via email. Ready for media buyer scheduling.",
      },
      {
        clientId: clientLumina.id,
        deliverableName: "Hydration Serum Carousel (10 Slides)",
        deliverableType: "Carousel",
        sentDate: new Date("2026-08-30"),
        status: "SENT_TO_CLIENT",
        previewUrl: "https://drive.google.com/file/d/1LuminaHydrationCarousel/view",
        notes: "Clean aesthetic with customer testimonial quotes.",
      },
      {
        clientId: clientZenith.id,
        deliverableName: "Q3 Fintech Thought Leadership Infographic",
        deliverableType: "Static Post",
        sentDate: new Date("2026-08-25"),
        status: "CHANGES_REQUESTED",
        previewUrl: "https://drive.google.com/file/d/1ZenithInfographic/view",
        notes: "Client requested updating chart data in slide 3 to reflect Q2 actuals.",
      },
      {
        clientId: clientKuro.id,
        deliverableName: "Cold Brew Launch TikTok Video Draft",
        deliverableType: "Video",
        sentDate: new Date("2026-08-27"),
        status: "SENT_TO_CLIENT",
        previewUrl: "https://drive.google.com/file/d/1KuroColdBrewTikTok/view",
        notes: "Soundtrack synced with ASMR pour shots. Pending Kenji's review.",
      },
    ],
  });

  console.log("✅ Seeded Client Approval Pipeline items");

  // 8. Seed Leave Requests
  await prisma.leaveRequest.createMany({
    data: [
      {
        userId: empDavid.id,
        leaveType: "CASUAL",
        startDate: new Date("2026-09-04"),
        endDate: new Date("2026-09-05"),
        daysCount: 2.0,
        reason: "Family wedding out of town.",
        status: "PENDING",
      },
      {
        userId: empEmily.id,
        leaveType: "WFH",
        startDate: new Date("2026-09-01"),
        endDate: new Date("2026-09-01"),
        daysCount: 1.0,
        reason: "Home internet installation and apartment maintenance.",
        status: "APPROVED",
        adminComment: "Approved. Make sure copy deliverables for Apex are updated in Sheets.",
        reviewedById: admin1.id,
        reviewedAt: new Date("2026-08-30"),
      },
      {
        userId: empLiam.id,
        leaveType: "SICK",
        startDate: new Date("2026-08-20"),
        endDate: new Date("2026-08-21"),
        daysCount: 2.0,
        reason: "Viral flu and doctor checkup.",
        status: "APPROVED",
        reviewedById: admin2.id,
        reviewedAt: new Date("2026-08-20"),
      },
    ],
  });

  console.log("✅ Seeded Leave Requests");

  // 9. Seed Announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: "Q3 Agency All-Hands & Client Roster Expansion",
        content:
          "Great job team! We've officially onboarded Kuro Coffee Roasters and extended our contract with Apex Athletics. Let's make sure all September content calendars are updated in the directory before Friday.",
        priority: "HIGH",
        authorId: admin1.id,
        createdAt: new Date("2026-08-28"),
      },
      {
        title: "New Google Drive Folder Structure Standard",
        content:
          "All designers and video editors are requested to organize client project raw files inside the /01_Raw_Assets/ and /02_Final_Renders/ folders linked on the client CRM profile.",
        priority: "NORMAL",
        authorId: admin3.id,
        createdAt: new Date("2026-08-25"),
      },
    ],
  });

  console.log("✅ Seeded Announcements");

  // 10. Seed Activity Log
  await prisma.activityLog.createMany({
    data: [
      {
        action: "CLIENT_CREATED",
        entityType: "CLIENT",
        entityId: clientKuro.id,
        details: "Onboarded Kuro Coffee Roasters and assigned SMM + Video team",
        userId: admin1.id,
        createdAt: new Date("2026-08-24"),
      },
      {
        action: "CALENDAR_UPDATED",
        entityType: "CALENDAR",
        details: "Lumina Skincare September 2026 calendar marked as APPROVED",
        userId: admin2.id,
        createdAt: new Date("2026-08-29"),
      },
      {
        action: "APPROVAL_STATUS_CHANGED",
        entityType: "APPROVAL",
        details: "Apex Athletics Meta Ads Story marked as APPROVED",
        userId: admin1.id,
        createdAt: new Date("2026-08-30"),
      },
      {
        action: "LEAVE_APPROVED",
        entityType: "LEAVE",
        details: "Approved WFH request for Emily Watson on Sept 1",
        userId: admin1.id,
        createdAt: new Date("2026-08-30"),
      },
    ],
  });

  console.log("✨ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
