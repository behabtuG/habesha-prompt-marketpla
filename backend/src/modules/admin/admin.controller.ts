// src/modules/admin/admin.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Put,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('prompts')
  @UseInterceptors(FileInterceptor('image'))
  async createPrompt(
    @Body() body: any,
    @Request() req,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    // Image is OPTIONAL for simplicity
    return this.adminService.createPrompt({
      ...body,
      creatorId: req.user.sub,
      imageFile: image,
    });
  }

  @Get('prompts/:id/edit')
  async getPromptForEdit(@Param('id') id: string, @Request() req) {
    return this.adminService.getPromptForEdit(id);
  }

  @Get('prompts')
  async getAllPrompts(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.adminService.getAllPrompts(
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
  }

  @Put('prompts/:id')
  @UseInterceptors(FileInterceptor('image'))
  async updatePrompt(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.adminService.updatePrompt(id, {
      ...body,
      imageFile: image,
    });
  }

  @Delete('prompts/:id')
  async deletePrompt(@Param('id') id: string) {
    return this.adminService.deletePrompt(id);
  }

  @Get('users')
  async getAllUsers(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.adminService.getAllUsers(
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
  }

  @Post('users/:id/role')
  async updateUserRole(
    @Param('id') userId: string,
    @Body() body: { isAdmin: boolean },
    @Request() req,
  ) {
    return this.adminService.updateUserRole(userId, body.isAdmin);
  }

  @Get('stats')
  async getStats() {
    return this.adminService.getSystemStats();
  }
}
