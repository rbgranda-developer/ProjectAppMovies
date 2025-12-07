import { ApiResponse, Movie, MovieDetails, CastMember } from '../types';

const API_KEY = 'eaf45f010e951b56986a7210ee0a4f99';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const getImageUrl = (path: string | null, size: 'w200' | 'w500' | 'original' = 'w500') => {
  if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

async function fetchFromApi<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const queryParams = new URLSearchParams({
    api_key: API_KEY,
    language: 'es-MX', // Spanish
    ...params,
  });

  const response = await fetch(`${BASE_URL}${endpoint}?${queryParams}`);
  if (!response.ok) {
    throw new Error(`Error fetching data: ${response.statusText}`);
  }
  return response.json();
}

export const tmdbService = {
  getPopularMovies: async (page = 1) => {
    return fetchFromApi<ApiResponse<Movie>>('/movie/popular', { page: String(page) });
  },

  getTopRatedMovies: async (page = 1) => {
    return fetchFromApi<ApiResponse<Movie>>('/movie/top_rated', { page: String(page) });
  },

  getMovieDetails: async (id: number) => {
    return fetchFromApi<MovieDetails>(`/movie/${id}`);
  },

  getMovieCast: async (id: number) => {
    const data = await fetchFromApi<{ cast: CastMember[] }>(`/movie/${id}/credits`);
    return data.cast;
  },

  searchMovies: async (query: string) => {
    return fetchFromApi<ApiResponse<Movie>>('/search/movie', { query });
  },
};