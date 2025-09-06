// utils/emailService.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendEmail = async (to, subject, text, html = null) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@unisafe.com',
            to,
            subject,
            text,
            html: html || text
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
