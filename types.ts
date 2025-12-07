export interface User {
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
}

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
}

export interface MovieDetails extends Movie {
  runtime: number;
  genres: { id: number; name: string }[];
  tagline: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface ApiResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}