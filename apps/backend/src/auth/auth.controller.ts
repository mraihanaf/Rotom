import { All, Controller, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { toNodeHandler } from 'better-auth/node';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @All('*path')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    const handler = toNodeHandler(this.authService.instance);
    await handler(req, res);
  }
}
