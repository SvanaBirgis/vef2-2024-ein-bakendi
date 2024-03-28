import express, { Request, Response } from 'express';
import { getLeagues } from './league.js';
import { createNews, deleteNews, getNews, listNews } from './news.js';


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
    }
  ]);
}

router.get('/', index);


router.get('/news', listNews);
router.post('/news', createNews);
router.get('/news/:id', getNews);
router.delete('/news/:id', deleteNews);
router.get('/leagues', getLeagues);

