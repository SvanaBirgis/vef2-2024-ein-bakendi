export type News = {
  id?: string;
  league: string;
  title: string;
  content: string;
  inserted?: Date;
};

export type League = {
  name: string;
  description: string;
};
