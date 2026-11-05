import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import {
  RegisterEmailDto,
  LoginEmailDto,
  RequestOtpDto,
  VerifyOtpDto,
  GoogleAuthDto,
  AdminVerifyMfaDto,
  RefreshTokenDto,
  JwtPayload,
} from '@miftah/contracts';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/email')
  @ApiOperation({ summary: 'Register a new Car Owner via Email and Password' })
  @ApiResponse({ status: 201, description: 'Car Owner registered and tokens returned' })
  async registerEmail(@Body() dto: RegisterEmailDto, @Req() req: Request & { correlationId?: string }) {
    return this.authService.registerEmail(dto, req.correlationId || 'none');
  }

  @Post('login/email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login via Email and Password (Multi-Actor)' })
  @ApiResponse({ status: 200, description: 'Tokens returned OR MFA challenge required for Admins' })
  async loginEmail(@Body() dto: LoginEmailDto, @Req() req: Request & { correlationId?: string }) {
    return this.authService.loginEmail(dto, req.correlationId || 'none');
  }

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a phone OTP (Car Owner / Workshop Staff)' })
  @ApiResponse({ status: 200, description: 'OTP sent' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify phone OTP and sign in / link account' })
  @ApiResponse({ status: 200, description: 'Tokens returned' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request & { correlationId?: string }) {
    return this.authService.verifyOtp(dto, req.correlationId || 'none');
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google Sign-In (Car Owner only)' })
  @ApiResponse({ status: 200, description: 'Tokens returned' })
  async googleAuth(@Body() dto: GoogleAuthDto, @Req() req: Request & { correlationId?: string }) {
    return this.authService.googleAuth(dto, req.correlationId || 'none');
  }

  @Post('admin/mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Admin MFA code following login challenge' })
  @ApiResponse({ status: 200, description: 'Admin tokens returned with mfa_verified=true' })
  async verifyAdminMfa(@Body() dto: AdminVerifyMfaDto, @Req() req: Request & { correlationId?: string }) {
    return this.authService.verifyAdminMfa(dto, req.correlationId || 'none');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate Refresh Token and issue new token pair' })
  @ApiResponse({ status: 200, description: 'New access and refresh tokens returned' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke active session' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  async logout(@CurrentUser() user: JwtPayload) {
    return this.authService.logout(user.session_id, user.sub);
  }
}

