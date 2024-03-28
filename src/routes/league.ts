import { Request, Response } from 'express';
import { getDatabase } from '../lib/db.js';


export async function getLeagues(req: Request, res: Response) {
    const leagues = await getDatabase()?.getLeagues();

    if (!leagues) {
        return res.status(404).json({ error: 'Leagues not found' });
    }

    return res.json(leagues);
}