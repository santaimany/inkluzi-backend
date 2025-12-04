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

    const loginUrl = this.configService.get('FRONTEND_URL') || 'https://inkluzi.my.id';
    const roleName = role === 'sppg' ? 'SPPG (Satuan Pelayanan Pangan Bergizi)' : 'Pihak Sekolah';

    try {
      const mailOptions = {
        from: `"Inkluzi MBG System" <${this.configService.get('SMTP_FROM')}>`,
        to: email,
        subject: 'Aktivasi Akun - Inkluzi MBG System',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333333; }
              .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden; }
              .header { background-color: #2c3e50; padding: 24px; text-align: center; }
              .header h1 { color: #ffffff; font-size: 20px; margin: 0; font-weight: 500; letter-spacing: 0.5px; }
              .content { padding: 40px; }
              .greeting { font-size: 16px; font-weight: bold; margin-bottom: 24px; color: #2c3e50; }
              .text { font-size: 15px; line-height: 1.6; color: #555555; margin-bottom: 24px; }
              .info-box { background-color: #f8f9fa; border-left: 4px solid #3498db; padding: 20px; margin-bottom: 30px; border-radius: 4px; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
              .info-label { font-weight: 600; color: #7f8c8d; width: 100px; }
              .info-value { color: #2c3e50; font-weight: 500; }
              .btn-container { text-align: center; margin: 32px 0; }
              .btn { background-color: #3498db; color: #ffffff !important; padding: 14px 28px; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; transition: background-color 0.3s; }
              .btn:hover { background-color: #2980b9; }
              .footer { background-color: #f8f9fa; padding: 24px; text-align: center; font-size: 12px; color: #95a5a6; border-top: 1px solid #e0e0e0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Inkluzi MBG System</h1>
              </div>
              <div class="content">
                <p class="greeting">Yth. ${name},</p>
                
                <p class="text">
                  Kami informasikan bahwa proses verifikasi akun Anda telah selesai. 
                  Saat ini akun Anda telah <strong>aktif</strong> dan dapat digunakan untuk mengakses sistem.
                </p>

                <div class="info-box">
                  <div class="text" style="margin: 0; font-size: 14px;">
                    <strong>Detail Akun:</strong><br><br>
                    <span style="color: #7f8c8d;">Email:</span> <span style="color: #2c3e50;">${email}</span><br>
                    <span style="color: #7f8c8d;">Akses Role:</span> <span style="color: #2c3e50;">${roleName}</span><br>
                    <span style="color: #7f8c8d;">Status:</span> <span style="color: #27ae60; font-weight: bold;">Aktif</span>
                  </div>
                </div>

                <p class="text">
                  Silakan masuk ke dashboard untuk mulai mengelola data dan menggunakan fitur yang tersedia sesuai dengan hak akses Anda.
                </p>

                <div class="btn-container">
                  <a href="${loginUrl}/login" class="btn">Masuk ke Dashboard</a>
                </div>
                
                <p class="text" style="font-size: 13px; color: #95a5a6; margin-top: 30px;">
                  Catatan: Jika Anda tidak merasa melakukan pendaftaran ini, mohon abaikan email ini atau hubungi administrator.
                </p>
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} Inkluzi MBG System.<br>
                Makanan Bergizi untuk Anak Berkebutuhan Khusus.
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
    }
  }

  async sendAccountDeactivationEmail(email: string, name: string, role: string): Promise<void> {
    if (!this.emailEnabled) {
      this.logger.warn(`Email disabled - would have sent deactivation email to: ${email}`);
      return;
    }

    try {
      const mailOptions = {
        from: `"Inkluzi MBG System" <${this.configService.get('SMTP_FROM')}>`,
        to: email,
        subject: 'Pemberitahuan Status Akun - Inkluzi MBG',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333333; }
              .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden; }
              .header { background-color: #c0392b; padding: 24px; text-align: center; } /* Merah gelap profesional */
              .header h1 { color: #ffffff; font-size: 20px; margin: 0; font-weight: 500; letter-spacing: 0.5px; }
              .content { padding: 40px; }
              .greeting { font-size: 16px; font-weight: bold; margin-bottom: 24px; color: #2c3e50; }
              .text { font-size: 15px; line-height: 1.6; color: #555555; margin-bottom: 24px; }
              .alert-box { background-color: #fdf2f2; border: 1px solid #fadbd8; padding: 20px; margin-bottom: 30px; border-radius: 4px; color: #c0392b; }
              .footer { background-color: #f8f9fa; padding: 24px; text-align: center; font-size: 12px; color: #95a5a6; border-top: 1px solid #e0e0e0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Pemberitahuan Sistem</h1>
              </div>
              <div class="content">
                <p class="greeting">Yth. ${name},</p>
                
                <p class="text">
                  Melalui email ini, kami ingin memberitahukan mengenai perubahan status akun Anda pada sistem Inkluzi MBG.
                </p>

                <div class="alert-box">
                  <strong>Status Akun: Dinonaktifkan</strong><br>
                  <span style="font-size: 14px; color: #636e72;">Akses masuk ke dalam sistem telah dibatasi untuk sementara waktu.</span>
                </div>

                <p class="text">
                  Jika Anda merasa ini adalah kekeliruan atau membutuhkan informasi lebih lanjut mengenai alasan penonaktifan ini, silakan menghubungi Administrator sistem kami.
                </p>

                <p class="text" style="margin-top: 30px;">
                  Terima kasih atas perhatian Anda.
                </p>
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} Inkluzi MBG System.<br>
                Makanan Bergizi untuk Anak Berkebutuhan Khusus.
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