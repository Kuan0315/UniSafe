const sendEmail = require('./utils/sendEmail');

async function testEmail() {
    try {
        console.log('🔍 Testing email functionality...');

        const testEmail = {
            email: 'your-test-email@example.com', // Replace with real email
            subject: 'Test Email from Campus Safety',
            message: `
                <h1>Test Email</h1>
                <p>This is a test to verify email service.</p>
            `
        };

        const success = await sendEmail(testEmail);

        if (success) {
            console.log('✅ Email sent successfully!');
        } else {
            console.warn('⚠️ Email function executed but sending failed.');
        }

    } catch (error) {
        console.error('❌ Email test failed:', error.message);
        console.log('\nCheck SMTP settings in your .env file:');
        console.log('EMAIL_HOST=smtp.gmail.com');
        console.log('EMAIL_PORT=587');
        console.log('EMAIL_USER=your-email@gmail.com');
        console.log('EMAIL_PASS=your-app-password');
        console.log('EMAIL_NAME="Campus Safety"');
    }
}

testEmail();
