import { PrismaClient, Role as RoleEnum } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISSIONS = [
  'MANAGE_USERS',
  'MANAGE_PAYMENTS',
  'MANAGE_COURSES',
  'MANAGE_CHALLENGES',
  'MANAGE_RECRUITERS',
  'MANAGE_MENTORS',
  'MANAGE_REPORTS',
  'MANAGE_NOTIFICATIONS',
  'MANAGE_ANALYTICS',
  'MANAGE_ROLES',
  'MANAGE_SETTINGS',
];

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'RECRUITER', 'STUDENT'];

async function main() {
  console.log('🌱 Seeding database with subscription plans, system roles, and permissions...');

  // 1. Seed Subscription Plans
  const plans = [
    {
      id: 'free-tier-plan-id',
      name: 'Free Plan',
      price: 0.00,
      gst: 0.00,
      total: 0.00,
      billingPeriod: 'MONTHLY',
      features: ['Basic Onboarding', 'Stage 1 Roadmap', '5 AI Checks Daily', 'Global Leaderboard'],
    },
    {
      id: 'pro-tier-plan-id',
      name: 'Pro Plan',
      price: 15.00,
      gst: 2.70, // 18% GST
      total: 17.70,
      billingPeriod: 'MONTHLY',
      features: ['All 4 Learning Stages', 'Unlimited AI Tutoring Sandbox', 'Recruiter Project Pipelines', 'Custom Mock Labs'],
    },
    {
      id: 'enterprise-tier-plan-id',
      name: 'Enterprise Plan',
      price: 99.00,
      gst: 17.82,
      total: 116.82,
      billingPeriod: 'MONTHLY',
      features: ['Dedicated Mentor Reviews', 'Custom Learning Path Builder', 'Bulk Student Accounts', 'SSO & Advanced Security'],
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.id },
      update: {
        name: plan.name,
        price: plan.price,
        gst: plan.gst,
        total: plan.total,
        billingPeriod: plan.billingPeriod,
        features: plan.features,
      },
      create: plan,
    });
  }

  // 2. Seed Permissions
  const permissionMap: Record<string, string> = {};
  for (const name of PERMISSIONS) {
    const perm = await prisma.systemPermission.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    permissionMap[name] = perm.id;
  }

  // 3. Seed Roles & Map Permissions
  const roleMap: Record<string, string> = {};
  for (const name of ROLES) {
    const roleObj = await prisma.systemRole.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    roleMap[name] = roleObj.id;
  }

  // Map permissions to SUPER_ADMIN (All permissions)
  for (const permName of PERMISSIONS) {
    await prisma.systemRolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleMap['SUPER_ADMIN'],
          permissionId: permissionMap[permName],
        },
      },
      update: {},
      create: {
        roleId: roleMap['SUPER_ADMIN'],
        permissionId: permissionMap[permName],
      },
    });
  }

  // Map permissions to ADMIN
  const ADMIN_PERMS = ['MANAGE_USERS', 'MANAGE_PAYMENTS', 'MANAGE_COURSES', 'MANAGE_CHALLENGES', 'MANAGE_REPORTS', 'MANAGE_NOTIFICATIONS', 'MANAGE_ANALYTICS'];
  for (const permName of ADMIN_PERMS) {
    await prisma.systemRolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleMap['ADMIN'],
          permissionId: permissionMap[permName],
        },
      },
      update: {},
      create: {
        roleId: roleMap['ADMIN'],
        permissionId: permissionMap[permName],
      },
    });
  }

  // Map permissions to MENTOR
  const MENTOR_PERMS = ['MANAGE_COURSES', 'MANAGE_CHALLENGES'];
  for (const permName of MENTOR_PERMS) {
    await prisma.systemRolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleMap['MENTOR'],
          permissionId: permissionMap[permName],
        },
      },
      update: {},
      create: {
        roleId: roleMap['MENTOR'],
        permissionId: permissionMap[permName],
      },
    });
  }

  // Map permissions to RECRUITER
  const RECRUITER_PERMS = ['MANAGE_RECRUITERS'];
  for (const permName of RECRUITER_PERMS) {
    await prisma.systemRolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleMap['RECRUITER'],
          permissionId: permissionMap[permName],
        },
      },
      update: {},
      create: {
        roleId: roleMap['RECRUITER'],
        permissionId: permissionMap[permName],
      },
    });
  }

  // 4. Create the first SUPER_ADMIN account
  const superAdminEmail = 'superadmin@makemistakes.com';
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash('SuperSecretPassword123!', salt);

  await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      passwordHash: hashedPassword,
      role: RoleEnum.ADMIN, // keeps compatibility with existing enum checks
      roleId: roleMap['SUPER_ADMIN'], // links to new SUPER_ADMIN permission set
    },
    create: {
      email: superAdminEmail,
      passwordHash: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: RoleEnum.ADMIN,
      roleId: roleMap['SUPER_ADMIN'],
      subscriptionTier: 'PRO', // Super Admins get Pro tier access
    },
  });

  console.log(`
======================================================
🌱 Seeding completed!
Super Admin Created:
Email: ${superAdminEmail}
Password: SuperSecretPassword123!
======================================================
  `);
}

main()
  .catch((e) => {
    console.error('Seed script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
