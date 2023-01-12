
const { once } = require('lodash')
const Drive = require('./drive.js')
const { writeFile, readFile } = require('fs/promises')

const { announcements, timetables, notices } = require('./data.js')

let authClient;

/**
 * Setup auth client
 * Only once
 */
const init = once(async () => {
  authClient = await Drive.authorize();
})

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

/**
 * Prepare url
 * Input - https://drive.google.com/open?id={fileId}
 * Output - https://drive.google.com/file/d/{fileId}/view?resourcekey={resourceKey}
 * 
 * @param {String} fileId 
 * @param {String} resourceKey 
 * @returns 
 */
const prepareUrl = (fileId, resourceKey) => {
  if (resourceKey) {
    return `https://drive.google.com/file/d/${fileId}/view?resourcekey=${resourceKey}`;
  } else {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }
}

/**
 * Get file id from url
 * @param {String} url 
 * @returns {String}
 */
const getIdFromUrl = (url) => {
  const pos = url.lastIndexOf('=')
  const id = url.substring(pos + 1)
  return id;
}

/**
 * Get resource key from file resource object
 * @param {Object} response 
 * @returns {String}
 */
const getResourceKey = (response) => {
  return response['data'].resourceKey ?? undefined
}

/**
 * Converts array of urls to new format
 * @param {array} inputUrls 
 * @returns {Object}
 */
async function convert(inputUrls, outputFile) {
  let outputUrls = []
  try {
    for (const input of inputUrls) {
      const id = getIdFromUrl(input);
      console.log(`Convert : ${id}`)
      const res = await getFile(id)
      const resourceKey = getResourceKey(res)
      const output = prepareUrl(id, resourceKey)
      // console.log(`${input} -> ${output}`);
      outputUrls.push({ input, output })
    }
  } catch (error) {
    console.error(error);
  }
  // console.log(outputUrls);
  try {
    const promise = writeFile(outputFile, JSON.stringify(outputUrls))
    await promise
  } catch (error) {
    console.error("File ", error)
  }
}

// convert(['https://drive.google.com/open?id=0B1N9snDSA9nIUGZ4Mm5yZDV4d25ycV9kS1ZfbTJ2LWJlTWF3'], 'test.json')

/**
 * Prepare sql queries
 * @param {String} file File path
 * @param {String} tabl
 */
async function prepareSQl(file, table, field) {
  const inputFile = `${file}.json`
  const outputFile = `${file}.sql`
  const data = await readFile(inputFile)
  const records = JSON.parse(data);
  let queries = [];
  records.forEach(record => {
    const query = `UPDATE ${table} SET ${field} = '${record.output}' WHERE ${field} = '${record.input}'`
    queries.push(query)
  });
  try {
    const promise = writeFile(outputFile, queries.join(';\r\n'))
    await promise
  } catch (error) {
    console.error("File ", error)
  }
}
// prepareSQl('test', 'test', 'remote_url').then((query) => console.log(query))

async function updateTimetables() {
  const data = await readFile('data/timetable_backup.json')
  const input = JSON.parse(data).timetables;
  console.log(input);

  const mapData = await readFile('data/timetables.json')
  const map = JSON.parse(mapData)

  const getUrl = (input) => {
    let output;
    map.forEach(item => {
      if (item.input === input) {
        output = item.output
      }
    });
    return output
  }

  let output = []

  input.forEach(termLinks => {
    const links = termLinks.links
    let outputLinks = []
    links.forEach(link => {
      const iUrl = link.url
      const oUrl = getUrl(iUrl)
      outputLinks.push({
        "title": link.title,
        "url": oUrl ?? iUrl
      })
    });
    console.log(outputLinks);
    output.push({
      "term": termLinks.term,
      "links": outputLinks
    })
  });

  //write into files
  try {
    const promise = writeFile('data/timetable_output.json', JSON.stringify(output))
    await promise
  } catch (error) {
    console.error("File ", error)
  }

}
updateTimetables()