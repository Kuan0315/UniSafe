
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT == 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function notifyGuardians(emails, subject, body) {
    if (!emails || emails.length === 0) return;

    for (const email of emails) {
        try {
            await transporter.sendMail({
                from: `"${process.env.EMAIL_NAME || 'Campus Safety'}" <${process.env.EMAIL_USER}>`,
                to: email,
                subject,
                text: typeof body === 'string' ? body : JSON.stringify(body),
            });
            console.log(`Email sent to: ${email}`);
        } catch (err) {
            console.error(`Failed to send email to ${email}:`, err.message);
        }
    }
}
