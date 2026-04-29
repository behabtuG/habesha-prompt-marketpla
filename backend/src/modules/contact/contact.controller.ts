// backend/src/modules/contact/contact.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async submitContactForm(@Body() body: any) {
    return this.contactService.createContactSubmission(body);
  }
}
