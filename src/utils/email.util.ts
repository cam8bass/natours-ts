import nodemailer, { TransportOptions } from 'nodemailer';
import { MailOptions } from 'nodemailer/lib/json-transport';
import { UserInterface } from '../shared/interfaces';
import SendmailTransport from 'nodemailer/lib/sendmail-transport';
import pug from 'pug';
import { htmlToText } from 'html-to-text';

class Email {
  public to: string;
  public firstname: string;
  public url: string;
  public from: string;

  constructor(user: UserInterface, url: string) {
    this.to = user.email;
    this.firstname = user.name.split(' ')[0];
    this.url = url;
    this.from = `Camille laignel <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport<SendmailTransport>({
        host: process.env.HOSTINGER_EMAIL_HOST,
        port: process.env.HOSTINGER_EMAIL_PORT,
        auth: {
          user: process.env.HOSTINGER_EMAIL_USERNAME,
          pass: process.env.HOSTINGER_EMAIL_PASSWORD
        }
      } as TransportOptions);
    }
    // mailtrap
    return nodemailer.createTransport<SendmailTransport>({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    } as TransportOptions);
  }

  async send(template: string, subject: string) {
    // 1) Render HTML based on pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstname: this.firstname,
      url: this.url,
      subject
    });
    // 2) Define email options
    const mailOptions: MailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html)
    };
    // 3) Create a tranport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelCome() {
    await this.send('welcome', 'Welcom to the Natours family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 min!)'
    );
  }
}

export default Email;
