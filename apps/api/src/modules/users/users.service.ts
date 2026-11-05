import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminAccount: true,
        staffMemberships: {
          where: { status: 'ACTIVE' },
          include: { workshop: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phoneE164,
      preferredLanguage: user.preferredLanguage,
      status: user.status,
      isAdmin: !!user.adminAccount,
      adminRole: user.adminAccount?.adminRole,
      workshops: user.staffMemberships.map((m) => ({
        workshopId: m.workshopId,
        workshopNameEn: m.workshop.displayNameEn,
        workshopNameAr: m.workshop.displayNameAr,
        role: m.role,
        status: m.status,
      })),
    };
  }

  async updateProfile(userId: string, data: { fullName?: string; preferredLanguage?: 'ar' | 'en' }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.fullName ? { fullName: data.fullName.trim() } : {}),
        ...(data.preferredLanguage ? { preferredLanguage: data.preferredLanguage } : {}),
      },
    });
  }
}

