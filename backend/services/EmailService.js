const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 30000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    });

    this.templatesPath = path.join(__dirname, '../templates/email');
  }

  /**
   * Send email with template
   */
  async sendEmail({ to, subject, template, data = {} }) {
    try {
      // Verify connection first
      await this.transporter.verify();
      console.log('SMTP connection verified for EmailService');

      const html = await this.renderTemplate(template, data);

      const mailOptions = {
        from: `"${process.env.APP_NAME || 'Finance App'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text: this.htmlToText(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', result.messageId);
      return result;
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
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title || 'Notification'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6366F1; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${process.env.APP_NAME || 'Finance App'}</h1>
          </div>
          <div class="content">
            <h2>${data.title || 'Notification'}</h2>
            <p>Hello ${data.userName || 'User'},</p>
            <p>${data.message || 'You have a new notification.'}</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || 'Finance App'}</p>
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
