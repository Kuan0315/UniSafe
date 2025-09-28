// Simple test script for notification endpoints
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:4000';

// Mock data for testing
const mockUser = {
  email: 'test@example.com',
  name: 'Test User',
  role: 'student'
};

const mockGuardian = {
  email: 'guardian@example.com',
  name: 'Guardian User',
  role: 'guardian'
};

const mockToken = 'test-token-123';

async function testNotificationEndpoints() {
  console.log('Testing Notification Endpoints...\n');

  try {
    // Test 1: Create a notification
    console.log('1. Testing notification creation...');
    const notificationData = {
      recipientId: '507f1f77bcf86cd799439011', // Mock guardian ID
      senderId: '507f1f77bcf86cd799439012', // Mock student ID
      sessionId: '507f1f77bcf86cd799439013', // Mock session ID
      type: 'guardian_mode_started',
      title: 'Guardian Mode Started',
      message: 'John Doe has started Guardian Mode and is traveling to University Library.',
      location: {
        latitude: 3.1203,
        longitude: 101.6544,
        address: 'University of Malaya'
      },
      destination: 'University Library',
      data: {
        route: [
          { latitude: 3.1203, longitude: 101.6544 },
          { latitude: 3.1213, longitude: 101.6554 }
        ],
        estimatedArrival: new Date(Date.now() + 30 * 60000).toISOString(),
        checkInInterval: 5
      }
    };

    const createResponse = await fetch(`${BASE_URL}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify(notificationData)
    });

    if (createResponse.ok) {
      const createdNotification = await createResponse.json();
      console.log('✅ Notification created successfully:', createdNotification._id);
      
      // Test 2: Fetch notifications
      console.log('\n2. Testing notification fetching...');
      const fetchResponse = await fetch(`${BASE_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${mockToken}`
        }
      });

      if (fetchResponse.ok) {
        const notifications = await fetchResponse.json();
        console.log('✅ Notifications fetched successfully:', notifications.length, 'notifications');
      } else {
        console.log('❌ Failed to fetch notifications:', fetchResponse.status);
      }

      // Test 3: Get unread count
      console.log('\n3. Testing unread count...');
      const countResponse = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${mockToken}`
        }
      });

      if (countResponse.ok) {
        const countData = await countResponse.json();
        console.log('✅ Unread count:', countData.count);
      } else {
        console.log('❌ Failed to get unread count:', countResponse.status);
      }

      // Test 4: Mark as read
      console.log('\n4. Testing mark as read...');
      const markReadResponse = await fetch(`${BASE_URL}/api/notifications/${createdNotification._id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${mockToken}`
        }
      });

      if (markReadResponse.ok) {
        console.log('✅ Notification marked as read successfully');
      } else {
        console.log('❌ Failed to mark as read:', markReadResponse.status);
      }

    } else {
      console.log('❌ Failed to create notification:', createResponse.status);
      const error = await createResponse.text();
      console.log('Error:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testGuardianEndpoints() {
  console.log('\n\nTesting Guardian Endpoints...\n');

  try {
    // Test 1: Start guardian mode
    console.log('1. Testing guardian mode start...');
    const guardianData = {
      destination: 'University Library',
      estimatedArrival: new Date(Date.now() + 30 * 60000).toISOString(),
      route: [
        { latitude: 3.1203, longitude: 101.6544 },
        { latitude: 3.1213, longitude: 101.6554 }
      ],
      trustedContacts: ['507f1f77bcf86cd799439011'],
      checkInIntervalMinutes: 5
    };

    const startResponse = await fetch(`${BASE_URL}/api/guardian/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify(guardianData)
    });

    if (startResponse.ok) {
      const session = await startResponse.json();
      console.log('✅ Guardian mode started successfully:', session._id);

      // Test 2: Send location update
      console.log('\n2. Testing location update...');
      const locationData = {
        latitude: 3.1213,
        longitude: 101.6554,
        address: 'Current location'
      };

      const locationResponse = await fetch(`${BASE_URL}/api/guardian/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        },
        body: JSON.stringify(locationData)
      });

      if (locationResponse.ok) {
        console.log('✅ Location update sent successfully');
      } else {
        console.log('❌ Failed to send location update:', locationResponse.status);
      }

      // Test 3: End guardian mode
      console.log('\n3. Testing guardian mode end...');
      const endResponse = await fetch(`${BASE_URL}/api/guardian/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`
        }
      });

      if (endResponse.ok) {
        console.log('✅ Guardian mode ended successfully');
      } else {
        console.log('❌ Failed to end guardian mode:', endResponse.status);
      }

    } else {
      console.log('❌ Failed to start guardian mode:', startResponse.status);
      const error = await startResponse.text();
      console.log('Error:', error);
    }

  } catch (error) {
    console.error('❌ Guardian test failed:', error.message);
  }
}

// Test status endpoints
async function testStatusEndpoints() {
  console.log('\n\nTesting Status Endpoints...\n');

  try {
    // Test database status
    console.log('1. Testing database status...');
    const dbStatusResponse = await fetch(`${BASE_URL}/api/status/database`);
    if (dbStatusResponse.ok) {
      const dbStatus = await dbStatusResponse.json();
      console.log('✅ Database status:', dbStatus.database.status);
      console.log('   Collections:', dbStatus.database.collections);
    } else {
      console.log('❌ Failed to get database status:', dbStatusResponse.status);
    }

    // Test notification status
    console.log('\n2. Testing notification status...');
    const notifStatusResponse = await fetch(`${BASE_URL}/api/status/notifications`);
    if (notifStatusResponse.ok) {
      const notifStatus = await notifStatusResponse.json();
      console.log('✅ Notification status:', notifStatus.notifications);
    } else {
      console.log('❌ Failed to get notification status:', notifStatusResponse.status);
    }

    // Test guardian mode status
    console.log('\n3. Testing guardian mode status...');
    const guardianStatusResponse = await fetch(`${BASE_URL}/api/status/guardian-mode`);
    if (guardianStatusResponse.ok) {
      const guardianStatus = await guardianStatusResponse.json();
      console.log('✅ Guardian mode status:', guardianStatus.guardianMode);
    } else {
      console.log('❌ Failed to get guardian mode status:', guardianStatusResponse.status);
    }

  } catch (error) {
    console.error('❌ Status test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Backend API Tests...\n');
  
  // Test health endpoint first
  try {
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend is running and healthy');
      console.log('   Database:', healthData.database.status);
      console.log('   Services:', healthData.services);
      console.log('');
    } else {
      console.log('❌ Backend health check failed\n');
      return;
    }
  } catch (error) {
    console.log('❌ Cannot connect to backend. Make sure it\'s running on', BASE_URL, '\n');
    return;
  }

  await testStatusEndpoints();
  await testNotificationEndpoints();
  await testGuardianEndpoints();
  
  console.log('\n🎉 All tests completed!');
}

runTests().catch(console.error);
