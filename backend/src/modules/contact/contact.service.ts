// backend/src/modules/contact/contact.service.ts - WITH NODEMAILER
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.setupEmailTransporter();
  }

  private setupEmailTransporter() {
    const emailConfig = this.configService.get<EmailConfig>('email');

    if (emailConfig?.host && emailConfig?.auth?.user) {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port || 587,
        secure: emailConfig.secure || false,
        auth: {
          user: emailConfig.auth.user,
          pass: emailConfig.auth.pass,
        },
      });

      // Verify connection configuration
      this.transporter.verify((error) => {
        if (error) {
          this.logger.error('Email transporter configuration error:', error);
        } else {
          this.logger.log('Email transporter is ready to send messages');
        }
      });
    } else {
      this.logger.warn(
        'Email configuration not found. Email notifications will be logged only.',
      );
    }
  }

  async createContactSubmission(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    userId?: string;
  }) {
    try {
      const submission = await this.prisma.contactSubmission.create({
        data: {
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          userId: data.userId,
          status: 'PENDING',
        },
      });

      // Send email notifications
      await this.sendEmailNotifications(data, submission.id);

      return {
        success: true,
        message: 'Contact form submitted successfully',
        data: { id: submission.id },
      };
    } catch (error) {
      this.logger.error('Failed to create contact submission:', error);
      throw error;
    }
  }

  private async sendEmailNotifications(
    data: {
      name: string;
      email: string;
      subject: string;
      message: string;
    },
    submissionId: string,
  ) {
    try {
      // 1. Send to admin
      await this.sendAdminNotification(data, submissionId);

      // 2. Send auto-reply to user
      await this.sendAutoReplyToUser(data);

      this.logger.log('Email notifications sent successfully');
    } catch (error) {
      this.logger.error('Failed to send email notifications:', error);
      // Don't throw - we don't want to fail the main request because of email
    }
  }

  private async sendAdminNotification(
    data: { name: string; email: string; subject: string; message: string },
    submissionId: string,
  ) {
    if (!this.transporter) {
      this.logger.warn(
        'Email transporter not configured. Skipping admin notification.',
      );
      return;
    }

    const adminEmail =
      this.configService.get('ADMIN_EMAIL') || 'admin@promptmarketplace.com';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">New Contact Form Submission</h2>
        <p>A new contact form has been submitted on the Prompt Marketplace.</p>
        
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">Submission Details:</h3>
          <p><strong>ID:</strong> ${submissionId}</p>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: white; padding: 12px; border-radius: 4px; border-left: 4px solid #4F46E5;">
            ${data.message.replace(/\n/g, '<br>')}
          </div>
          <p><strong>Submitted At:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Please respond within 24 hours. You can reply directly to ${data.email}.
          </p>
          <a href="${this.configService.get('ADMIN_PANEL_URL') || 'http://localhost:4060/admin'}" 
             style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            View in Admin Panel
          </a>
        </div>
      </div>
    `;

    const mailOptions: EmailOptions = {
      from: `"Prompt Marketplace" <${this.configService.get('EMAIL_FROM') || 'noreply@promptmarketplace.com'}>`,
      to: adminEmail,
      subject: `[Contact Form] ${data.subject} - From ${data.name}`,
      html: htmlContent,
    };

    await this.transporter.sendMail(mailOptions);
  }

  private async sendAutoReplyToUser(data: {
    name: string;
    email: string;
    subject: string;
  }) {
    if (!this.transporter) {
      this.logger.warn(
        'Email transporter not configured. Skipping auto-reply.',
      );
      return;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Thank You for Contacting Prompt Marketplace!</h2>
        
        <p>Hello ${data.name},</p>
        
        <p>We have received your message regarding <strong>"${data.subject}"</strong>.</p>
        
        <div style="background-color: #f0f9ff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
          <h3 style="color: #0369a1; margin-top: 0;">What happens next?</h3>
          <ul style="color: #374151;">
            <li>Our team will review your message within <strong>24 hours</strong></li>
            <li>We'll respond to the email address you provided: <strong>${data.email}</strong></li>
            <li>For prompt suggestions, we'll notify you if/when your prompt is added to the marketplace</li>
          </ul>
        </div>
        
        <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h4 style="color: #92400e; margin-top: 0;">Need immediate assistance?</h4>
          <p>If you have urgent issues with:</p>
          <ul style="color: #374151;">
            <li>Prompt access or purchases</li>
            <li>Technical problems</li>
            <li>Account issues</li>
          </ul>
          <p>Check our <a href="${this.configService.get('HELP_CENTER_URL') || '#'}" style="color: #4F46E5;">Help Center</a> for quick solutions.</p>
        </div>
        
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated message. Please do not reply to this email.<br>
            If you need to add more information, simply reply to this thread or submit another contact form.
          </p>
        </div>
        
        <p>Best regards,<br>
        <strong>The Prompt Marketplace Team</strong></p>
        
        <div style="margin-top: 30px; padding: 16px; background-color: #f9fafb; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            © ${new Date().getFullYear()} Prompt Marketplace. All rights reserved.<br>
            Telegram Mini App • Secure AI Prompt Marketplace
          </p>
        </div>
      </div>
    `;

    const mailOptions: EmailOptions = {
      from: `"Prompt Marketplace Support" <${this.configService.get('EMAIL_FROM') || 'support@promptmarketplace.com'}>`,
      to: data.email,
      subject: `We've received your message: ${data.subject}`,
      html: htmlContent,
    };

    await this.transporter.sendMail(mailOptions);
  }

  // Optional: Send weekly summary to admin
  async sendWeeklySummary() {
    if (!this.transporter) return;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const submissions = await this.prisma.contactSubmission.findMany({
      where: {
        createdAt: { gte: oneWeekAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (submissions.length === 0) return;

    const adminEmail = this.configService.get('ADMIN_EMAIL');
    if (!adminEmail) return;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">📊 Weekly Contact Form Summary</h2>
        <p>Here's a summary of contact form submissions from the past week:</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">📈 Statistics</h3>
          <p><strong>Total Submissions:</strong> ${submissions.length}</p>
          <p><strong>Pending Responses:</strong> ${submissions.filter((s) => s.status === 'PENDING').length}</p>
          <p><strong>Period:</strong> ${oneWeekAgo.toLocaleDateString()} to ${new Date().toLocaleDateString()}</p>
        </div>
        
        <h3>Recent Submissions:</h3>
        ${submissions
          .slice(0, 5)
          .map(
            (sub) => `
          <div style="border: 1px solid #e5e7eb; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
            <p><strong>${sub.name}</strong> (${sub.email})</p>
            <p><strong>Subject:</strong> ${sub.subject}</p>
            <p><strong>Status:</strong> <span style="color: ${sub.status === 'PENDING' ? '#f59e0b' : '#10b981'}">${sub.status}</span></p>
            <p><strong>Date:</strong> ${new Date(sub.createdAt).toLocaleString()}</p>
          </div>
        `,
          )
          .join('')}
        
        ${submissions.length > 5 ? `<p>... and ${submissions.length - 5} more submissions</p>` : ''}
        
        <div style="margin-top: 24px; text-align: center;">
          <a href="${this.configService.get('ADMIN_PANEL_URL')}/contact-submissions" 
             style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View All Submissions
          </a>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"Prompt Marketplace Analytics" <${this.configService.get('EMAIL_FROM') || 'analytics@promptmarketplace.com'}>`,
      to: adminEmail,
      subject: `📊 Weekly Contact Summary: ${submissions.length} new submissions`,
      html: htmlContent,
    });
  }
}
