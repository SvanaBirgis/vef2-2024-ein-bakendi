CREATE TABLE public.league (
  id serial primary key,
  name CHARACTER VARYING(64) NOT NULL UNIQUE,
  description TEXT DEFAULT ''
);

CREATE TABLE public.news (
  id serial primary key,
  league CHARACTER VARYING(64) NOT NULL REFERENCES league(name),
  title CHARACTER VARYING(128) NOT NULL,
  content TEXT NOT NULL,
  inserted TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
