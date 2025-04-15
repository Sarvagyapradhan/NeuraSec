/**
 * This file tests if the dependencies are working correctly
 */
import axios from 'axios';
import whoisJson from 'whois-json';
import { checkDomain } from 'ssl-checker';

async function testDependencies() {
  console.log("Testing axios...");
  try {
    const response = await axios.get('https://httpbin.org/get');
    console.log("✅ Axios working: ", response.status === 200);
  } catch (error) {
    console.error("❌ Axios error:", error);
  }

  console.log("\nTesting whois-json...");
  try {
    const whoisData = await whoisJson('google.com');
    console.log("✅ whois-json working:", whoisData && !!whoisData.creationDate);
  } catch (error) {
    console.error("❌ whois-json error:", error);
  }

  console.log("\nTesting ssl-checker...");
  try {
    const sslInfo = await checkDomain('google.com');
    console.log("✅ ssl-checker working:", sslInfo && sslInfo.valid !== undefined);
  } catch (error) {
    console.error("❌ ssl-checker error:", error);
  }
}

// If this file is run directly
if (require.main === module) {
  testDependencies().catch(console.error);
}

export default testDependencies; 