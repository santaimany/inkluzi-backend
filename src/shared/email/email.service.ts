import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private emailEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const smtpHost = this.configService.get('SMTP_HOST');
    const smtpUser = this.configService.get('SMTP_USER');
    
    // Check if email is configured
    if (!smtpHost || !smtpUser) {
      this.logger.warn('Email not configured. Email notifications will be disabled.');
      this.emailEnabled = false;
      return;
    }

    this.emailEnabled = true;
    
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: this.configService.get('SMTP_PASS'),
      },
    });

    // Verify connection configuration
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('SMTP connection error:', error);
        this.emailEnabled = false;
      } else {
        this.logger.log('SMTP server is ready to send emails');
      }
    });
  }

  async sendAccountActivationEmail(email: string, name: string, role: string): Promise<void> {
    if (!this.emailEnabled) {
      this.logger.warn(`Email disabled - would have sent activation email to: ${email}`);
      return;
    }

    try {
      const mailOptions = {
        from: `"MBG System" <${this.configService.get('SMTP_FROM')}>`,
        to: email,
        subject: 'Akun Anda Telah Diaktifkan - MBG System',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
              .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
              .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Selamat!</h1>
              </div>
              <div class="content">
                <p>Halo <strong>${name}</strong>,</p>
                <p>Kami dengan senang hati memberitahukan bahwa akun Anda sebagai <strong>${role === 'sppg' ? 'SPPG' : 'Sekolah'}</strong> telah <strong>diaktifkan</strong> oleh administrator.</p>
                <p>Anda sekarang dapat login dan mengakses sistem MBG (Makanan Bergizi) untuk:</p>
                <ul>
                  ${role === 'sppg' 
                    ? '<li>Mengelola menu makanan untuk sekolah-sekolah</li><li>Melihat laporan dari sekolah</li><li>Mengakses data sekolah binaan</li>' 
                    : '<li>Melihat menu makanan yang disediakan</li><li>Scan makanan untuk analisis nutrisi</li><li>Membuat laporan ke SPPG</li>'
                  }
                </ul>
                <p>Silakan login menggunakan email dan password yang telah Anda daftarkan.</p>
                <a href="${this.configService.get('FRONTEND_URL')}/login" class="button">Login Sekarang</a>
              </div>
              <div class="footer">
                <p>Email ini dikirim otomatis oleh sistem MBG. Jangan balas email ini.</p>
                <p>Jika Anda memiliki pertanyaan, hubungi administrator.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Activation email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}:`, error);
      // Tidak throw error agar proses utama tetap berjalan
    }
  }

  async sendAccountDeactivationEmail(email: string, name: string, role: string): Promise<void> {
    if (!this.emailEnabled) {
      this.logger.warn(`Email disabled - would have sent deactivation email to: ${email}`);
      return;
    }

    try {
      const mailOptions = {
        from: `"MBG System" <${this.configService.get('SMTP_FROM')}>`,
        to: email,
        subject: 'Akun Anda Telah Dinonaktifkan - MBG System',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
              .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚠️ Pemberitahuan</h1>
              </div>
              <div class="content">
                <p>Halo <strong>${name}</strong>,</p>
                <p>Kami informasikan bahwa akun Anda sebagai <strong>${role === 'sppg' ? 'SPPG' : 'Sekolah'}</strong> telah <strong>dinonaktifkan</strong> oleh administrator.</p>
                <p>Anda tidak dapat login ke sistem MBG sampai akun Anda diaktifkan kembali.</p>
                <p>Jika Anda merasa ini adalah kesalahan, silakan hubungi administrator untuk informasi lebih lanjut.</p>
              </div>
              <div class="footer">
                <p>Email ini dikirim otomatis oleh sistem MBG. Jangan balas email ini.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Deactivation email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}:`, error);
    }
  }
}