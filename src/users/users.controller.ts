import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from './types/auth-user.type';
import { UpdateUserDto } from './dto/update-user.dto';
import { avatarMulterOptions } from './config/avatar-multer.config';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  updateMe(@Body() updateUserDto: UpdateUserDto, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.usersService.update(user.id, updateUserDto);
  }

  @Patch('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', avatarMulterOptions))
  async updateAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    const user = req.user as AuthenticatedUser;
    return this.usersService.updateAvatar(user.id, file);
  }

  @Delete('me')
  removeMe(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.usersService.remove(user.id);
  }
}
