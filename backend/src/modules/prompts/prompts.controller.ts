// // modules/prompts/prompts.controller.ts
// import {
//   Controller,
//   Get,
//   Param,
//   Query,
//   UseGuards,
//   Request,
// } from '@nestjs/common';
// import { PromptsService } from './prompts.service';
// import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

// @Controller('prompts')
// export class PromptsController {
//   constructor(private readonly promptsService: PromptsService) {}

//   @Get()
//   async findAll(
//     @Request() req,
//     @Query('category') category?: string,
//     @Query('search') search?: string,
//     @Query('limit') limit?: number,
//     @Query('page') page?: number,
//     @Query('includePurchased') includePurchased?: string,
//   ) {
//     // Try to extract user ID from JWT token if present
//     let userId: string | undefined;

//     // Check if Authorization header exists
//     const authHeader = req.headers.authorization;
//     if (authHeader) {
//       try {
//         // Manually decode JWT to get user ID without requiring the guard
//         const token = authHeader.split(' ')[1];
//         if (token) {
//           const jwtService = new (require('@nestjs/jwt').JwtService)();
//           const payload = jwtService.decode(token);
//           if (payload && payload.sub) {
//             userId = payload.sub;
//             console.log(
//               '🔍 [PROMPTS CONTROLLER] Extracted userId from token:',
//               userId,
//             );
//           }
//         }
//       } catch (error) {
//         console.log(
//           '🔍 [PROMPTS CONTROLLER] Failed to decode token:',
//           error.message,
//         );
//       }
//     }

//     console.log(
//       '🔍 [PROMPTS CONTROLLER] Received request with userId:',
//       userId,
//     );

//     return this.promptsService.findAll({
//       userId,
//       category,
//       search,
//       limit: limit ? Number(limit) : 20,
//       page: page ? Number(page) : 1,
//       includePurchased: includePurchased === 'true',
//     });
//   }

//   @Get('categories')
//   async getCategories() {
//     return this.promptsService.getCategories();
//   }

//   @Get(':id')
//   async findOne(@Param('id') id: string, @Request() req) {
//     const userId = req.user?.sub;
//     return this.promptsService.findOne(id, userId);
//   }

//   @UseGuards(JwtAuthGuard)
//   @Get(':id/full')
//   async getFullPrompt(@Param('id') id: string, @Request() req) {
//     return this.promptsService.getFullPrompt(req.user.sub, id);
//   }

//   @UseGuards(JwtAuthGuard)
//   @Get('purchased')
//   async findPurchased(
//     @Request() req,
//     @Query('category') category?: string,
//     @Query('search') search?: string,
//     @Query('limit') limit?: number,
//     @Query('page') page?: number,
//   ) {
//     return this.promptsService.findPurchased(req.user.sub, {
//       category,
//       search,
//       limit: limit ? Number(limit) : 20,
//       page: page ? Number(page) : 1,
//     });
//   }
// }
// modules/prompts/prompts.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { GetPromptsQueryDto } from './dto/get-prompts-query.dto';

@Controller('prompts')
export class PromptsController {
  constructor(
    private readonly promptsService: PromptsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  async findAll(@Request() req, @Query() query: GetPromptsQueryDto) {
    // Try to extract user ID from JWT token if present
    let userId: string | undefined;

    // Check if Authorization header exists
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        if (token) {
          const payload = this.jwtService.decode(token);
          if (payload && payload.sub) {
            userId = payload.sub;
            console.log(
              '🔍 [PROMPTS CONTROLLER] Extracted userId from token:',
              userId,
            );
          }
        }
      } catch (error) {
        console.log(
          '🔍 [PROMPTS CONTROLLER] Failed to decode token:',
          error.message,
        );
      }
    }

    console.log(
      '🔍 [PROMPTS CONTROLLER] Received request with userId:',
      userId,
    );

    return this.promptsService.findAll({
      userId,
      category: query.category,
      search: query.search,
      limit: query.limit,
      page: query.page,
      includePurchased: query.includePurchased === 'true',
    });
  }

  @Get('categories')
  async getCategories() {
    return this.promptsService.getCategories();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user?.sub;
    return this.promptsService.findOne(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/full')
  async getFullPrompt(@Param('id') id: string, @Request() req) {
    return this.promptsService.getFullPrompt(req.user.sub, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('purchased')
  async findPurchased(@Request() req, @Query() query: GetPromptsQueryDto) {
    return this.promptsService.findPurchased(req.user.sub, {
      category: query.category,
      search: query.search,
      limit: query.limit,
      page: query.page,
    });
  }
}
