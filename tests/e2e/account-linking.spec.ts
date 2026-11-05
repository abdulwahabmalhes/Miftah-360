import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../apps/api/src/modules/auth/auth.service';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { AuditService } from '../../apps/api/src/modules/audit/audit.service';
import { Role, AuthProvider } from '@miftah/contracts';
import { ForbiddenException } from '@nestjs/common';

describe('Account Linking & Identity Unification (E2E Verification)', () => {
  let authService: AuthService;
  let prismaMock: any;
  let jwtServiceMock: any;
  let auditServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      authIdentity: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      session: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    jwtServiceMock = {
      signAsync: jest.fn().mockResolvedValue('mock_jwt_token'),
      verifyAsync: jest.fn(),
    };

    auditServiceMock = {
      record: jest.fn().mockResolvedValue({}),
    };

    authService = new AuthService(
      prismaMock as unknown as PrismaService,
      jwtServiceMock as unknown as JwtService,
      auditServiceMock as unknown as AuditService,
    );
  });

  it('LINKS verified phone number to existing Car Owner account without creating duplicates', async () => {
    const existingUserId = 'user-uuid-100';
    const phone = '+971501112233';

    // 1. Request OTP
    await authService.requestOtp({ phone });

    // 2. Mock identity lookup: No existing PHONE_OTP identity yet
    prismaMock.authIdentity.findUnique.mockResolvedValueOnce(null);

    // 3. User already exists with this phone number (e.g. from prior email registration with phone added)
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: existingUserId,
      fullName: 'Ahmed Al Mansoori',
      phoneE164: phone,
      preferredLanguage: 'ar',
      staffMemberships: [],
    });

    // 4. Mock session creation
    prismaMock.session.create.mockResolvedValue({
      id: 'session-uuid-1',
      tokenVersion: 1,
    });

    prismaMock.user.findUniqueOrThrow = jest.fn().mockResolvedValue({
      id: existingUserId,
      fullName: 'Ahmed Al Mansoori',
      preferredLanguage: 'ar',
    });

    // 5. Verify OTP
    const result = await authService.verifyOtp({ phone, code: '123456' }, 'test-corr-id');

    expect(result.user.id).toBe(existingUserId);
    expect(prismaMock.authIdentity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: existingUserId,
        provider: AuthProvider.PHONE_OTP,
        providerSubject: phone,
      }),
    });
    // Verify that a second user was NOT created
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('PREVENTS Workshop Staff and Admin accounts from authenticating via Google Sign-In', async () => {
    const staffEmail = 'advisor@workshop.ae';

    // Mock that identity for Google doesn't exist yet
    prismaMock.authIdentity.findUnique.mockResolvedValueOnce(null);

    // Existing user found by email, but they are workshop staff!
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'staff-uuid-1',
      email: staffEmail,
      staffMemberships: [{ id: 'membership-1', workshopId: 'ws-1', role: 'SERVICE_ADVISOR' }],
    });

    await expect(
      authService.googleAuth({ idToken: 'token_for_advisor@workshop.ae' }, 'test-corr-id'),
    ).rejects.toThrow(ForbiddenException);
  });
});

