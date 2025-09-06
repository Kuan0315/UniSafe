import nodemailer from 'nodemailer';

async function sendEmail({ email, subject, message }) {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
            secure: process.env.EMAIL_PORT == 587,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"${process.env.EMAIL_NAME || 'Campus Safety'}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            html: message,
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully to:', email);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        console.log({ email, subject, message });
        return false;
    }
}

export default sendEmail;
