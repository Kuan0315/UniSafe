import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

export const sendEmail = async (to, subject, text, html = null) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'UniSafe <noreply@unisafe.com>',
            to,
            subject,
            text,
            html: html || text
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', result.messageId);
        return result;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

export const sendWelcomeEmail = async (user) => {
    const subject = 'Welcome to UniSafe!';
    const text = `
    Hi ${user.name},
    
    Welcome to UniSafe! Your account has been successfully created.
    
    Stay safe on campus with our features:
    - Emergency SOS alerts
    - Guardian mode for safe travel
    - Incident reporting
    - Campus safety resources
    
    If you have any questions, please contact our support team.
    
    Stay safe,
    The UniSafe Team
  `;

    return sendEmail(user.email, subject, text);
};

export const sendIncidentReportEmail = async (user, incident) => {
    const subject = 'Your Incident Report Has Been Received';
    const text = `
    Hi ${user.name},
    
    Thank you for reporting the incident. Your report has been received and is being reviewed by our security team.
    
    Incident Details:
    - Type: ${incident.type}
    - Description: ${incident.description}
    - Location: ${incident.location.address}
    - Reported: ${incident.createdAt.toLocaleString()}
    
    We will keep you updated on the status of your report.
    
    Stay safe,
    The UniSafe Team
  `;

    return sendEmail(user.email, subject, text);
};
