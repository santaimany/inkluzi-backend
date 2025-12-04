import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Cek apakah admin sudah ada
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'admin' },
  });

  if (existingAdmin) {
    console.log('⚠️  Admin account already exists. Skipping...');
    console.log(`📧 Email: ${existingAdmin.email}`);
    return;
  }

  // 2. Buat admin account
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mbg.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash: hashedPassword,
      role: 'admin',
      status: 'active', // Admin langsung active
    },
  });

  console.log('✅ Admin account created successfully!');
  console.log('📧 Email:', adminEmail);
  console.log('🔑 Password:', adminPassword);
  console.log('⚠️  IMPORTANT: Please change the default password after first login!');
  console.log('');
  console.log('Admin ID:', admin.id);
  console.log('Status:', admin.status);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });