import pg from 'pg';
import { League, News } from '../types.js';
import { environment } from './environment.js';
import { ILogger, logger as loggerSingleton } from './logger.js';


/**
 * Database class.
 */
export class Database {
  private connectionString: string;
  private logger: ILogger;
  private pool: pg.Pool | null = null;

  /**
   * Create a new database connection.
   */
  constructor(connectionString: string, logger: ILogger) {
    this.connectionString = connectionString;
    this.logger = logger;
  }

  open() {
    this.pool = new pg.Pool({ connectionString: this.connectionString });

    this.pool.on('error', (err) => {
      this.logger.error('error in database pool', err);
      this.close();
    });
  }

  /**
   * Close the database connection.
   */
  async close(): Promise<boolean> {
    if (!this.pool) {
      this.logger.error('unable to close database connection that is not open');
      return false;
    }

    try {
      await this.pool.end();
      return true;
    } catch (e) {
      this.logger.error('error closing database pool', { error: e });
      return false;
    } finally {
      this.pool = null;
    }
  }

  /**
   * Connect to the database via the pool.
   */
  async connect(): Promise<pg.PoolClient | null> {
    if (!this.pool) {
      this.logger.error('Reynt að nota gagnagrunn sem er ekki opinn');
      return null;
    }

    try {
      const client = await this.pool.connect();
      return client;
    } catch (e) {
      this.logger.error('error connecting to db', { error: e });
      return null;
    }
  }

  /**
   * Run a query on the database.
   * @param query SQL query.
   * @param values Parameters for the query.
   * @returns Result of the query.
   */
  async query(
    query: string,
    values: Array<string | number> = [],
  ): Promise<pg.QueryResult | null> {
    const client = await this.connect();

    if (!client) {
      return null;
    }

    try {
      const result = await client.query(query, values);
      return result;
    } catch (e) {
      this.logger.error('Error running query', e);
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Get all news from the database.
   */
  async getNews(): Promise<News[] | null> {
    const q = `
      SELECT
        id,
        league,
        title,
        content,
        inserted
      FROM
        news
      ORDER BY
        inserted DESC
    `;

    const result = await this.query(q);

    if (result && result.rows.length > 0) {
      return result.rows.map((row) => ({
        id: row.id,
        league: row.league,
        title: row.title,
        content: row.content,
        inserted: row.inserted,
      }));
    }

    return null;
  }

  /**
   * Get news from the database by id.
   */
  async getNewsById(id?: string): Promise<News | null> {
    const q = `
      SELECT
        id,
        league,
        title,
        content,
        inserted
      FROM
        news
      ${id ? 'WHERE id = $1' : ''}
      ORDER BY
        inserted DESC
    `;

    const result = await this.query(q, id ? [id] : []);

    if (result && result.rows.length > 0) {
      const news: News = {
        id: result.rows[0].id,
        league: result.rows[0].league,
        title: result.rows[0].title,
        content: result.rows[0].content,
        inserted: result.rows[0].inserted,
      };
      return news;
    }

    return null;
  }

  async getLeagues() {
    const q = `
      SELECT
        id,
        name,
        description
      FROM
        league
    `;

    const result = await this.query(q);

    if (result && result.rows.length > 0) {
      return result.rows;
    }

    return null;
  }

  /**
   * Get league by id from the database.
  **/
  async getLeagueById(id: string): Promise<League | null> {
    const q = `
      SELECT
        id,
        name,
        description
      FROM
        league
      WHERE
        id = $1
    `;

    const result = await this.query(q, [id]);

    if (result && result.rows.length > 0) {
      return result.rows[0];
    }

    return null;
  }


  /**
   * Insert news into the database.
   */
  async insertNews(title: string, content: string, league: string): Promise<News | null> {
    const result = await this.query(
      'INSERT INTO news (title, content, league) VALUES ($1, $2, $3) RETURNING id, inserted',
      [title, content, league],
    );

    if (result) {
      const news: News = {
        id: result.rows[0].id,
        league: league,
        title: title,
        content: content,
        inserted: result.rows[0].inserted,
      };
      return news;
    }
    return null;
  }

  /**
   * Delete news from the database.
   */
  async deleteNews(id: string): Promise<boolean> {
    const result = await this.query('DELETE FROM news WHERE id = $1', [id]);

    if (!result || result.rowCount !== 1) {
      this.logger.warn('unable to delete news', { result, id });
      return false;
    }
    return true;
  }

  /**
   * Get news by league from the database.
   */
  async getNewsByLeague(league_id: string): Promise<News[] | null> {
    const league = await this.getLeagueById(league_id);
    if (!league) {
      return null;
    }

    const q = `
      SELECT
        id,
        league,
        title,
        content,
        inserted
      FROM
        news
      WHERE
        league = $1
      ORDER BY
        inserted DESC
    `;

    const result = await this.query(q, [league.name]);

    if (result && result.rows.length > 0) {
      return result.rows.map((row) => ({
        id: row.id,
        league: row.league,
        title: row.title,
        content: row.content,
        inserted: row.inserted,
      }));
    }

    return null;
  }

}

let db: Database | null = null;

/**
 * Return a singleton database instance.
 */
export function getDatabase() {
  if (db) {
    return db;
  }

  const env = environment(process.env, loggerSingleton);

  if (!env) {
    return null;
  }
  db = new Database(env.connectionString, loggerSingleton);
  db.open();

  return db;
}


