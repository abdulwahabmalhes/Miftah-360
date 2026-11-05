import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { authenticator } from 'otplib';
import {
  Role,
  WorkshopStaffRole,
  AdminRole,
  StaffStatus,
  AuthProvider,
  UserStatus,
  StandardErrorCode,
  JwtPayload,
  AuthTokenResponse,
  AdminMfaChallengeResponse,
  RegisterEmailDto,
  LoginEmailDto,
  RequestOtpDto,
  VerifyOtpDto,
  GoogleAuthDto,
  AdminVerifyMfaDto,
  RefreshTokenDto,
} from '@miftah/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  // Ephemeral in-memory OTP store for Phase 1 dev/testing (in production replaced by Redis)
  private readonly otpStore = new Map<string, { code: string; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  // ----------------------------------------------------------------
  // 1. CAR OWNER REGISTRATION (EMAIL)
  // ----------------------------------------------------------------
  async registerEmail(dto: RegisterEmailDto, correlationId: string): Promise<AuthTokenResponse> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new ConflictException({
        code: StandardErrorCode.VALIDATION_ERROR,
        message: 'An account with this email already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName: dto.fullName.trim(),
          email: normalizedEmail,
          preferredLanguage: dto.preferredLanguage || 'ar',
          status: UserStatus.ACTIVE,
        },
      });

      await tx.authIdentity.create({
        data: {
          userId: newUser.id,
          provider: AuthProvider.EMAIL_PASSWORD,
          providerSubject: normalizedEmail,
          passwordHash,
          verifiedAt: new Date(),
        },
      });

      return newUser;
    });

    await this.auditService.record({
      actorUserId: user.id,
      actorRole: Role.CAR_OWNER,
      entityType: 'User',
      entityId: user.id,
      action: 'USER_REGISTERED_EMAIL',
      correlationId,
    });

    return this.generateTokensForUser(user.id, Role.CAR_OWNER, user.preferredLanguage as 'ar' | 'en');
  }

  // ----------------------------------------------------------------
  // 2. UNIFIED EMAIL LOGIN (Multi-Actor)
  // ----------------------------------------------------------------
  async loginEmail(
    dto: LoginEmailDto,
    correlationId: string,
  ): Promise<AuthTokenResponse | AdminMfaChallengeResponse> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const identity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerSubject: {
          provider: AuthProvider.EMAIL_PASSWORD,
          providerSubject: normalizedEmail,
        },
      },
      include: {
        user: {
          include: {
            adminAccount: true,
            staffMemberships: {
              where: { status: StaffStatus.ACTIVE },
              include: { workshop: true },
            },
          },
        },
      },
    });

    if (!identity || !identity.passwordHash) {
      throw new UnauthorizedException({
        code: StandardErrorCode.UNAUTHORIZED,
        message: 'Invalid email or password',
      });
    }

    const isValidPassword = await bcrypt.compare(dto.password, identity.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException({
        code: StandardErrorCode.UNAUTHORIZED,
        message: 'Invalid email or password',
      });
    }

    const user = identity.user;
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException({
        code: StandardErrorCode.FORBIDDEN,
        message: 'Account is currently suspended or disabled',
      });
    }

    // A. Check if user is an ADMIN -> MFA is mandatory!
    if (user.adminAccount && user.adminAccount.status === UserStatus.ACTIVE) {
      const challengeToken = await this.jwtService.signAsync(
        {
          sub: user.id,
          type: 'MFA_CHALLENGE',
          admin_role: user.adminAccount.adminRole,
        },
        { expiresIn: '5m' },
      );

      return {
        mfaRequired: true,
        challengeToken,
        message: 'Multi-Factor Authentication required for Admin account',
      };
    }

    // B. Check if user is WORKSHOP STAFF
    if (user.staffMemberships.length > 0) {
      const activeMembership = user.staffMemberships[0];
      return this.generateTokensForUser(
        user.id,
        Role.WORKSHOP_OWNER, // or mapped staff role
        user.preferredLanguage as 'ar' | 'en',
        activeMembership.workshopId,
        activeMembership.role as WorkshopStaffRole,
      );
    }

    // C. Otherwise default to CAR_OWNER
    return this.generateTokensForUser(user.id, Role.CAR_OWNER, user.preferredLanguage as 'ar' | 'en');
  }

  // ----------------------------------------------------------------
  // 3. ADMIN MFA VERIFICATION
  // ----------------------------------------------------------------
  async verifyAdminMfa(dto: AdminVerifyMfaDto, correlationId: string): Promise<AuthTokenResponse> {
    let payload: { sub: string; type: string; admin_role: AdminRole };
    try {
      payload = await this.jwtService.verifyAsync(dto.challengeToken);
    } catch {
      throw new UnauthorizedException({
        code: StandardErrorCode.UNAUTHORIZED,
        message: 'Invalid or expired MFA challenge token',
      });
    }

    if (payload.type !== 'MFA_CHALLENGE') {
      throw new UnauthorizedException({
        code: StandardErrorCode.UNAUTHORIZED,
        message: 'Invalid challenge type',
      });
    }

    const admin = await this.prisma.adminAccount.findUnique({
      where: { userId: payload.sub },
      include: { user: true },
    });

    if (!admin || admin.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException({
        code: StandardErrorCode.FORBIDDEN,
        message: 'Admin account inactive or not found',
      });
    }

    // Verify TOTP if secret set, or dev master code '123456' for test/bootstrap environments
    let isValidCode = false;
    if (admin.mfaSecret) {
      isValidCode = authenticator.verify({ token: dto.code, secret: admin.mfaSecret });
    } else {
      // In initial bootstrap mode before TOTP QR enrollment
      isValidCode = dto.code === '123456';
    }

    if (!isValidCode) {
      throw new UnauthorizedException({
        code: StandardErrorCode.UNAUTHORIZED,
        message: 'Invalid MFA verification code',
      });
    }

    await this.auditService.record({
      actorUserId: admin.userId,
      actorRole: admin.adminRole,
      entityType: 'AdminAccount',
      entityId: admin.id,
      action: 'ADMIN_MFA_VERIFIED',
      correlationId,
    });

    return this.generateTokensForUser(
      admin.userId,
      admin.adminRole as unknown as Role,
      admin.user.preferredLanguage as 'ar' | 'en',
      undefined,
      undefined,
      admin.adminRole as unknown as AdminRole,
      true, // mfa_verified = true
    );
  }

  // ----------------------------------------------------------------
  // 4. PHONE OTP FLOW (Request & Verify with Account Linking)
  // ----------------------------------------------------------------
  async requestOtp(dto: RequestOtpDto) {
    const phone = dto.phone.trim();
    if (!phone.startsWith('+')) {
      throw new BadRequestException({
        code: StandardErrorCode.VALIDATION_ERROR,
        message: 'Phone number must be in international E.164 format (e.g. +971500000000)',
      });
    }

    // Generate 6-digit OTP code (in dev mode defaults to 123456)
    const code = process.env.NODE_ENV === 'production' ? Math.floor(100000 + Math.random() * 900000).toString() : '123456';
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    this.otpStore.set(phone, { code, expiresAt });

    return {
      success: true,
      message: 'OTP sent successfully',
      phone,
      // Dev helper
      debugCode: process.env.NODE_ENV !== 'production' ? code : undefined,
    };
  }

  async verifyOtp(dto: VerifyOtpDto, correlationId: string): Promise<AuthTokenResponse> {
    const phone = dto.phone.trim();
    const stored = this.otpStore.get(phone);

    if (!stored || Date.now() > stored.expiresAt) {
      throw new UnauthorizedException({
        code: StandardErrorCode.UNAUTHORIZED,
        message: 'OTP has expired or was not requested',
      });
    }

    if (stored.code !== dto.code) {
      throw new UnauthorizedException({
        code: StandardErrorCode.UNAUTHORIZED,
        message: 'Invalid verification code',
      });
    }

    this.otpStore.delete(phone);

    // Find or Link User
    let identity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerSubject: {
          provider: AuthProvider.PHONE_OTP,
          providerSubject: phone,
        },
      },
      include: {
        user: {
          include: {
            staffMemberships: {
              where: { status: StaffStatus.ACTIVE },
              include: { workshop: true },
            },
          },
        },
      },
    });

    let user = identity?.user || null;

    if (!user) {
      // Check if user already exists with this phone number to prevent duplicate account
      user = await this.prisma.user.findUnique({
        where: { phoneE164: phone },
        include: {
          staffMemberships: {
            where: { status: StaffStatus.ACTIVE },
            include: { workshop: true },
          },
        },
      });

      if (!user) {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            fullName: `User ${phone.slice(-4)}`,
            phoneE164: phone,
            preferredLanguage: 'ar',
            status: UserStatus.ACTIVE,
          },
          include: {
            staffMemberships: {
              where: { status: StaffStatus.ACTIVE },
              include: { workshop: true },
            },
          },
        });
      }

      // Link PHONE_OTP identity
      await this.prisma.authIdentity.create({
        data: {
          userId: user.id,
          provider: AuthProvider.PHONE_OTP,
          providerSubject: phone,
          verifiedAt: new Date(),
        },
      });
    }

    // Determine role: Workshop staff if membership exists, else CAR_OWNER
    if (user.staffMemberships && user.staffMemberships.length > 0) {
      const activeMembership = user.staffMemberships[0];
      return this.generateTokensForUser(
        user.id,
        Role.WORKSHOP_OWNER,
        user.preferredLanguage as 'ar' | 'en',
        activeMembership.workshopId,
        activeMembership.role as WorkshopStaffRole,
      );
    }

    return this.generateTokensForUser(user.id, Role.CAR_OWNER, user.preferredLanguage as 'ar' | 'en');
  }

  // ----------------------------------------------------------------
  // 5. GOOGLE SIGN-IN (Car Owner Only - Strict Workshop Exclusion)
  // ----------------------------------------------------------------
  async googleAuth(dto: GoogleAuthDto, correlationId: string): Promise<AuthTokenResponse> {
    // In production, verify with Google Auth Library. In dev/testing, extract or simulate subject & email:
    const mockGoogleSubject = `google_sub_${dto.idToken.slice(0, 16)}`;
    const mockEmail = `user_${dto.idToken.slice(0, 8)}@gmail.com`.toLowerCase();

    // Find identity by Google Subject
    let identity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerSubject: {
          provider: AuthProvider.GOOGLE,
          providerSubject: mockGoogleSubject,
        },
      },
      include: {
        user: {
          include: {
            adminAccount: true,
            staffMemberships: true,
          },
        },
      },
    });

    let user = identity?.user || null;

    if (!user) {
      // Check if user with this email already exists to link identity
      user = await this.prisma.user.findUnique({
        where: { email: mockEmail },
        include: { adminAccount: true, staffMemberships: true },
      });

      if (user) {
        // Enforce rule: Workshop Staff & Admin cannot use Google Sign-in!
        if (user.adminAccount || (user.staffMemberships && user.staffMemberships.length > 0)) {
          throw new ForbiddenException({
            code: StandardErrorCode.FORBIDDEN,
            message: 'Google Sign-In is restricted to Car Owners only. Workshop staff and admins must use password/OTP credentials.',
          });
        }

        // Link Google Identity
        await this.prisma.authIdentity.create({
          data: {
            userId: user.id,
            provider: AuthProvider.GOOGLE,
            providerSubject: mockGoogleSubject,
            verifiedAt: new Date(),
          },
        });
      } else {
        // Create new Car Owner User
        user = await this.prisma.user.create({
          data: {
            fullName: 'Google User',
            email: mockEmail,
            preferredLanguage: 'ar',
            status: UserStatus.ACTIVE,
            authIdentities: {
              create: {
                provider: AuthProvider.GOOGLE,
                providerSubject: mockGoogleSubject,
                verifiedAt: new Date(),
              },
            },
          },
          include: {
            adminAccount: true,
            staffMemberships: true,
          },
        });
      }
    }

    return this.generateTokensForUser(user.id, Role.CAR_OWNER, user.preferredLanguage as 'ar' | 'en');
  }

  // ----------------------------------------------------------------
  // 6. TOKEN ROTATION & REVOCATION
  // ----------------------------------------------------------------
  async refreshToken(dto: RefreshTokenDto): Promise<AuthTokenResponse> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_miftah_360',
      });
    } catch {
      throw new UnauthorizedException({
        code: StandardErrorCode.UNAUTHORIZED,
        message: 'Invalid or expired refresh token',
      });
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.session_id },
      include: {
        user: {
          include: {
            staffMemberships: {
              where: { status: StaffStatus.ACTIVE },
            },
          },
        },
      },
    });

    if (!session || session.isRevoked || session.tokenVersion !== payload.token_version) {
      throw new UnauthorizedException({
        code: StandardErrorCode.TOKEN_REVOKED,
        message: 'Session has been revoked or superseded',
      });
    }

    // Increment token version for rotation
    const updatedSession = await this.prisma.session.update({
      where: { id: session.id },
      data: { tokenVersion: session.tokenVersion + 1 },
    });

    return this.createTokenPair(
      session.user.id,
      payload.role,
      session.user.preferredLanguage as 'ar' | 'en',
      session.id,
      updatedSession.tokenVersion,
      payload.workshop_id,
      payload.workshop_staff_role,
      payload.admin_role,
      payload.mfa_verified,
    );
  }

  async logout(sessionId: string, userId: string): Promise<{ success: boolean }> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId },
      data: { isRevoked: true },
    });
    return { success: true };
  }

  // ----------------------------------------------------------------
  // TOKEN GENERATION HELPERS
  // ----------------------------------------------------------------
  private async generateTokensForUser(
    userId: string,
    role: Role,
    preferredLanguage: 'ar' | 'en',
    workshopId?: string,
    workshopStaffRole?: WorkshopStaffRole,
    adminRole?: AdminRole,
    mfaVerified: boolean = false,
  ): Promise<AuthTokenResponse> {
    const session = await this.prisma.session.create({
      data: {
        userId,
        tokenVersion: 1,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      include: { user: true },
    });

    return this.createTokenPair(
      userId,
      role,
      preferredLanguage,
      session.id,
      session.tokenVersion,
      workshopId,
      workshopStaffRole,
      adminRole,
      mfaVerified,
    );
  }

  private async createTokenPair(
    userId: string,
    role: Role,
    preferredLanguage: 'ar' | 'en',
    sessionId: string,
    tokenVersion: number,
    workshopId?: string,
    workshopStaffRole?: WorkshopStaffRole,
    adminRole?: AdminRole,
    mfaVerified: boolean = false,
  ): Promise<AuthTokenResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const payload: JwtPayload = {
      sub: userId,
      email: user.email || undefined,
      phone: user.phoneE164 || undefined,
      role,
      workshop_id: workshopId,
      workshop_staff_role: workshopStaffRole,
      admin_role: adminRole,
      mfa_verified: mfaVerified,
      session_id: sessionId,
      token_version: tokenVersion,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'dev_secret_miftah_360_replace_in_prod',
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_miftah_360',
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email || undefined,
        phone: user.phoneE164 || undefined,
        role,
        workshopId,
        preferredLanguage,
      },
    };
  }
}

