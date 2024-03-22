// import { SendGridService } from '@anchan828/nest-sendgrid';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
    private transporter;

    constructor() {}

    async sendVerificationCode(email: string, code: string) {
        const mailOptions = {
            from: process.env.FROM_EMAIL,
            to: email,
            subject: 'Your verification code',
            text: `Your verification code is: ${code}`,
            html: `<b> your code${code}</b>`,
        };

        await this.transporter.sendMail(mailOptions);
    }
}
