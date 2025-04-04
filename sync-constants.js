#!/usr/bin/env node

/**
 * This script synchronizes the API endpoints, socket events, and game constants
 * between the client and server constants files.
 * 
 * Usage: node sync-constants.js
 */

const fs = require('fs');
const path = require('path');

// Path to the constants files
const SERVER_CONSTANTS_PATH = path.join(__dirname, 'server', 'constants.js');
const CLIENT_CONSTANTS_PATH = path.join(__dirname, 'client', 'src', 'constants.js');

// Constants to sync between server and client (these should be kept identical)
const SHARED_SECTIONS = [
  'API_ENDPOINTS',
  'SOCKET_EVENTS',
  'WORD_LIST',
  'GAME_CONSTANTS',
  'GAME_STATE',
];

// Read the server constants file
console.log(`Reading server constants from ${SERVER_CONSTANTS_PATH}`);
const serverConstants = fs.readFileSync(SERVER_CONSTANTS_PATH, 'utf8');

// Read the client constants file
console.log(`Reading client constants from ${CLIENT_CONSTANTS_PATH}`);
const clientConstants = fs.readFileSync(CLIENT_CONSTANTS_PATH, 'utf8');

// Extract each shared section from the server constants
const extractedSections = {};
for (const section of SHARED_SECTIONS) {
  const regex = new RegExp(`export const ${section} = (\\{[\\s\\S]*?\\};)`, 'gm');
  const match = regex.exec(serverConstants);
  
  if (match && match[1]) {
    extractedSections[section] = match[0]; // Store the whole export statement
    console.log(`✓ Extracted ${section} from server constants`);
  } else {
    console.error(`✗ Failed to extract ${section} from server constants`);
  }
}

// Update the client constants file with the extracted sections
let updatedClientConstants = clientConstants;

for (const [section, content] of Object.entries(extractedSections)) {
  const regex = new RegExp(`export const ${section} = \\{[\\s\\S]*?\\};`, 'gm');
  
  if (regex.test(updatedClientConstants)) {
    updatedClientConstants = updatedClientConstants.replace(regex, content);
    console.log(`✓ Updated ${section} in client constants`);
  } else {
    console.error(`✗ Section ${section} not found in client constants`);
  }
}

// Write the updated client constants file
fs.writeFileSync(CLIENT_CONSTANTS_PATH, updatedClientConstants, 'utf8');
console.log(`✓ Written updated constants to ${CLIENT_CONSTANTS_PATH}`);

// Final confirmation message
console.log('\nConstants synchronization complete!');
console.log('Remember: This script only synchronizes the standard constants sections.');
console.log('Environment-specific configurations (ENV_CONFIG) remain separate for client and server.');