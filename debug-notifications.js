/**
 * Debug Script for Testing Notification System
 * Run this script to test if notifications are working properly
 */

console.log("🔍 Starting Notification System Debug...");

// Test 1: Check if Socket.IO is available
if (typeof io !== 'undefined') {
  console.log("✅ Socket.IO client is available");
} else {
  console.error("❌ Socket.IO client not found");
}

// Test 2: Check if notification store is available
try {
  const { useMessageStore } = require('./src/stores/messageStore.js');
  const store = useMessageStore();
  console.log("✅ Message store available:", {
    unreadCounts: store.unreadCounts,
    totalUnreadCount: store.totalUnreadCount
  });
} catch (error) {
  console.error("❌ Message store not available:", error.message);
}

// Test 3: Check notification API endpoints
async function testNotificationAPI() {
  console.log("🔌 Testing notification API...");
  
  try {
    // Test fetching notifications
    const response = await fetch('http://localhost:3000/api/notifications', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Notifications API working:", data);
    } else {
      console.error("❌ Notifications API failed:", response.status, response.statusText);
    }
  } catch (error) {
    console.error("❌ Error testing notifications API:", error.message);
  }
}

// Test 4: Check database connection
async function testDatabaseConnection() {
  console.log("🗄️ Testing database connection...");
  
  try {
    const pool = require('./connection/databaseConnection.js').default;
    const result = await pool.query('SELECT COUNT(*) as count FROM notifications');
    console.log("✅ Database connection working:", result.rows[0]);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
}

// Test 5: Check Socket.IO server
async function testSocketServer() {
  console.log("🔌 Testing Socket.IO server...");
  
  try {
    const response = await fetch('http://localhost:3000/api/socketio', {
      method: 'GET',
    });
    
    if (response.ok) {
      console.log("✅ Socket.IO server endpoint accessible");
    } else {
      console.error("❌ Socket.IO server endpoint failed:", response.status);
    }
  } catch (error) {
    console.error("❌ Error testing Socket.IO server:", error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log("\n🧪 Running all notification system tests...\n");
  
  await testDatabaseConnection();
  await testSocketServer();
  await testNotificationAPI();
  
  console.log("\n🎯 Debug tests completed!");
  console.log("\n📋 Manual Testing Steps:");
  console.log("1. Open browser developer tools");
  console.log("2. Go to chat page");
  console.log("3. Send a message to another user");
  console.log("4. Check console logs for debugging messages");
  console.log("5. Verify toast notifications appear");
  console.log("6. Check unread counts update in chat list");
  console.log("7. Check dashboard notification count");
  console.log("8. Test with different browser tabs");
}

// Run the tests
runAllTests().catch(console.error);
