import { News } from '../types.js';

export function parseNewsFile(
  data: string): News {
  let newsParsed: unknown;

  try {
    newsParsed = JSON.parse(data);
  } catch (e) {
    throw new Error('unable to parse news data');
  }

  if (typeof newsParsed !== 'object' || !newsParsed) {
    throw new Error('news data is not an object');
  }

  if (!('title' in newsParsed) || typeof newsParsed.title !== 'string') {
    throw new Error('news data does not have title');
  }

  if (!('content' in newsParsed) || typeof newsParsed.content !== 'string') {
    throw new Error('news data does not have content');
  }

  if (!('league' in newsParsed) || typeof newsParsed.league !== 'string') {
    throw new Error('news data does not have league');
  }

  return {
    title: newsParsed.title,
    content: newsParsed.content,
    league: newsParsed.league,
  };
}
