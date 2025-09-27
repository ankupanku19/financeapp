const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

class EmailService {
  constructor() {
    // Initialize SendGrid
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.useSendGrid = true;
      console.log('Email service initialized with SendGrid');
    } else {
      // Fallback to SMTP
      this.useSendGrid = false;
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        logger: true,
        debug: true
      });
      console.log('Email service initialized with SMTP fallback');
    }

    this.templatesPath = path.join(__dirname, '../templates/email');
  }

  /**
   * Send email with template
   */
  async sendEmail({ to, subject, template, data = {} }) {
    try {
      const html = await this.renderTemplate(template, data);
      const text = this.htmlToText(html);

      if (this.useSendGrid) {
        // Use SendGrid HTTP API
        const msg = {
          to,
          from: {
            email: process.env.FROM_EMAIL || process.env.SMTP_USER,
            name: process.env.APP_NAME || 'Finance App'
          },
          subject,
          html,
          text
        };

        const result = await sgMail.send(msg);
        console.log('Email sent via SendGrid:', result[0].statusCode);
        return result;
      } else {
        // Use SMTP fallback
        await this.transporter.verify();
        console.log('SMTP connection verified for EmailService');

        const mailOptions = {
          from: `"${process.env.APP_NAME || 'Finance App'}" <${process.env.SMTP_USER}>`,
          to,
          subject,
          html,
          text
        };

        const result = await this.transporter.sendMail(mailOptions);
        console.log('Email sent via SMTP:', result.messageId);
        return result;
      }
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Render email template
   */
  async renderTemplate(templateName, data) {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      let template = await fs.readFile(templatePath, 'utf8');
      
      // Replace placeholders with data
      template = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] || match;
      });

      return template;
    } catch (error) {
      console.error(`Error rendering template ${templateName}:`, error);
      // Fallback to default template
      return this.getDefaultTemplate(data);
    }
  }

  /**
   * Get default email template
   */
  getDefaultTemplate(data) {
    const otpSection = data.otp ? `
      <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
        <h1 style="color: #6366F1; font-size: 32px; margin: 0; letter-spacing: 4px;">${data.otp}</h1>
      </div>
      ${data.expiryMessage ? `<p style="text-align: center; color: #666;">${data.expiryMessage}</p>` : ''}
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title || 'Notification'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: #6366F1; color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .footer { padding: 20px; text-align: center; color: #666; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">${process.env.APP_NAME || 'Finance App'}</h1>
          </div>
          <div class="content">
            <h2 style="color: #6366F1; margin-top: 0;">${data.title || 'Notification'}</h2>
            <p>Hello ${data.userName || 'User'},</p>
            <p>${data.message || 'You have a new notification.'}</p>
            ${otpSection}
          </div>
          <div class="footer">
            <p style="margin: 0;">© ${new Date().getFullYear()} ${process.env.APP_NAME || 'Finance App'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Convert HTML to plain text
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to Finance App!',
      template: 'welcome',
      data: {
        userName: user.name,
        title: 'Welcome!',
        message: 'Thank you for joining our financial management platform.'
      }
    });
  }

  /**
   * Send goal achievement email
   */
  async sendGoalAchievementEmail(user, goal) {
    return this.sendEmail({
      to: user.email,
      subject: `🎉 Goal Achieved: ${goal.name}`,
      template: 'goal-achieved',
      data: {
        userName: user.name,
        title: 'Goal Achieved!',
        message: `Congratulations! You've achieved your goal: ${goal.name}`,
        goalName: goal.name,
        goalAmount: goal.targetAmount,
        achievedDate: new Date().toLocaleDateString()
      }
    });
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlertEmail(user, alertType, details) {
    return this.sendEmail({
      to: user.email,
      subject: '🔒 Security Alert',
      template: 'security-alert',
      data: {
        userName: user.name,
        title: 'Security Alert',
        message: 'We detected unusual activity on your account.',
        alertType,
        details,
        timestamp: new Date().toLocaleString()
      }
    });
  }
}

module.exports = EmailService;
