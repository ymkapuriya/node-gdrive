const { once } = require('lodash')
const Drive = require('./drive.js')

let authClient;

/**
 * Setup auth client
 * Only once
 */
const init = once(async () => {
  authClient = await Drive.authorize();
})

/**
 * List files
 */
async function listFiles() {
  await init()
  await Drive.listFiles(authClient)
}

/**
 * Get file response by id
 * @param {String} fileId 
 * @returns 
 */
async function getFile(fileId) {
  await init()
  const response = await Drive.getFile(authClient, fileId)
  return response;
}

// listFiles()
// getFile('0B1N9snDSA9nIX1dUeTJJWi1jNHE1YUNWVXNIMWdpbXNrQzVz').then((res) => console.log(res));