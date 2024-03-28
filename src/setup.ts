import { readFile } from 'node:fs/promises';
import { Database } from './lib/db.js';
import { environment } from './lib/environment.js';
import { readFilesFromDir } from './lib/file.js';
import { ILogger, logger as loggerSingleton } from './lib/logger.js';
import { parseNewsFile } from './lib/parse.js';

const SCHEMA_FILE = './sql/schema.sql';
const DROP_SCHEMA_FILE = './sql/drop.sql';
const INSERT_FILE = './sql/insert.sql';
const INPUT_DIR = './data';

async function setupDbFromFiles(
  db: Database,
  logger: ILogger,
): Promise<boolean> {
  const dropScript = await readFile(DROP_SCHEMA_FILE);
  const createScript = await readFile(SCHEMA_FILE);
  const insertScript = await readFile(INSERT_FILE);

  if (await db.query(dropScript.toString('utf-8'))) {
    logger.info('schema dropped');
  } else {
    logger.info('schema not dropped, exiting');
    return false;
  }

  if (await db.query(createScript.toString('utf-8'))) {
    logger.info('schema created');
  } else {
    logger.info('schema not created');
    return false;
  }

  if (await db.query(insertScript.toString('utf-8'))) {
    logger.info('data inserted');
  } else {
    logger.info('data not inserted');
    return false;
  }

  return true;
}

async function setupData(db: Database, logger: ILogger) {
  const files = await readFilesFromDir(INPUT_DIR);
  const newsFiles = files.filter((file) => file.indexOf('news-') > 0);
  logger.info('news files found', { total: newsFiles.length });

  const newsArr = [];
  logger.info('starting to parse news files');
  for await (const newsFile of newsFiles) {
    const file = await readFile(newsFile);

    try {
      newsArr.push(parseNewsFile(file.toString('utf-8')));
    } catch (e) {
      logger.error(`unable to parse ${newsFile}`, {
        error: (e as Error).message,
      });
    }
  }
  logger.info('news files parsed', { total: newsArr.length });

  let totalInserted = 0;
  for (const news of newsArr) {
    const { title, content, league } = news;
    const dbNews = await db.insertNews(title, content, league);

    if (!dbNews) {
      logger.info('error inserting news');
    } else {
      totalInserted += 1;
    }

  }
  if (totalInserted !== newsArr.length) {
    logger.info('error inserting news');
    return false;
  }

  return true;
}

async function create() {
  const logger = loggerSingleton;
  const env = environment(process.env, logger);

  if (!env) {
    process.exit(1);
  }

  logger.info('starting setup');

  const db = new Database(env.connectionString, logger);
  db.open();

  const resultFromFileSetup = await setupDbFromFiles(db, logger);

  if (!resultFromFileSetup) {
    logger.info('error setting up database from files');
    process.exit(1);
  }

  let resultFromReadingData;
  try {
    resultFromReadingData = await setupData(db, logger);
  } catch (e) {
    // falls through
  }

  if (!resultFromReadingData) {
    logger.info('error reading data from files');
    process.exit(1);
  }

  logger.info('setup complete');
  await db.close();
}

create().catch((err) => {
  console.error('error running setup', err);
});
