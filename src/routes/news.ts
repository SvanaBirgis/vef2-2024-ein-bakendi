import { NextFunction, Request, Response } from 'express';

import { getDatabase } from '../lib/db.js';
import {
    atLeastOneBodyValueValidator,
    genericSanitizer,
    stringValidator,
    validationCheck,
    xssSanitizer
} from '../lib/validation.js';

export async function listNews(req: Request, res: Response) {
  const news = await getDatabase()?.getNews();

  if (!news) {
    return res.status(500).json({ error: 'Could not get news' });
  }

  return res.json(news);
}

export async function createNewsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { title, content, league } = req.body;

  const createdNews = await getDatabase()?.insertNews(title, content, league);

  if (!createdNews) {
    return next(new Error('unable to create news'));
  }

  return res.status(201).json(createdNews);
}

export const createNews = [
  stringValidator({ field: 'title', maxLength: 64 }),
  stringValidator({
    field: 'content',
    valueRequired: false,
    maxLength: 1000,
  }),
  atLeastOneBodyValueValidator,
  xssSanitizer('title'),
  xssSanitizer('content'),
  validationCheck,
  genericSanitizer('title'),
  genericSanitizer('content'),
  createNewsHandler,
];

export async function getNews(req: Request, res: Response) {
  const news = await getDatabase()?.getNews(req.params.id);

  if (!news) {
    return res.status(404).json({ error: 'News not found' });
  }

  return res.json(news);
}

export async function deleteNews(req: Request, res: Response) {
  const news = await getDatabase()?.deleteNews(req.params.id);

  if (!news) {
    return res.status(404).json({ error: 'News not found' });
  }

  return res.json(news);
}