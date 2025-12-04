import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { env } from 'prisma/config';
if (process.env.NODE_ENV !== 'production') {
  require('dotenv/config');
}
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private prismaClient: PrismaClient;
  private pool: Pool;

  constructor(private configService: ConfigService) {
    const databaseUrl = env('DATABASE_URL');
    
    this.pool = new Pool({
      connectionString: databaseUrl,
    });

    const adapter = new PrismaPg(this.pool);
    
    this.prismaClient = new PrismaClient({
      adapter,
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.prismaClient.$connect();
    this.logger.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await this.prismaClient.$disconnect();
    await this.pool.end();
    this.logger.log('👋 Database disconnected');
  }

  // Expose all Prisma models
  get user() {
    return this.prismaClient.user;
  }

  get refreshToken() {
    return this.prismaClient.refreshToken;
  }

  get sppgProfile() {
    return this.prismaClient.sppgProfile;
  }

  get schoolProfile() {
    return this.prismaClient.schoolProfile;
  }

  get disabilityType() {
    return this.prismaClient.disabilityType;
  }

  get menu() {
    return this.prismaClient.menu;
  }

  get menuAssignment() {
    return this.prismaClient.menuAssignment;
  }

  get foodScan() {
    return this.prismaClient.foodScan;
  }

  get report() {
    return this.prismaClient.report;
  }

  // Expose transaction API
  get $transaction() {
    return this.prismaClient.$transaction.bind(this.prismaClient);
  }
}