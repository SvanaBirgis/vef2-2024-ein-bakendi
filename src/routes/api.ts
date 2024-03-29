import express, { Request, Response } from 'express';
import { getLeagueById, getLeagues } from './league.js';
import { createNews, deleteNews, getNews, getNewsByLeague, listNews } from './news.js';


export const router = express.Router();

export async function index(req: Request, res: Response) {
  return res.json([
    {
      href: '/news',
      methods: ['GET', 'POST'],
    },
    {
      href: '/news/:id', // or /news/:slug
      methods: ['GET', 'PATCH', 'DELETE'],
    },
    {
      href: '/leagues',
      methods: ['GET'],
    },
    {
      href: '/leagues/:id',
      methods: ['GET'],
    },
    {
      href: '/news/leagues/:id',
      methods: ['GET'],
    }
  ]);
}

router.get('/', index);


router.get('/news', listNews);
router.post('/news', createNews);
router.get('/news/:id', getNews);
router.delete('/news/:id', deleteNews);
router.get('/leagues', getLeagues);
router.get('/leagues/:id', getLeagueById);
router.get('/news/leagues/:id', getNewsByLeague);

