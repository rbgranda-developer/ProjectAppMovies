import React from 'react';
import { Movie } from '../types';
import { getImageUrl } from '../services/tmdb';
import { Rating } from './Rating';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  return (
    <div 
      className="group relative flex flex-col gap-2 cursor-pointer transition-transform duration-200 active:scale-95"
      onClick={() => onClick(movie)}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-dark-card shadow-lg border border-white/5">
        <img
          src={getImageUrl(movie.poster_path, 'w500')}
          alt={movie.title}
          className="h-full w-full object-cover transition-opacity duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
           <p className="text-white text-xs line-clamp-2">{movie.overview}</p>
        </div>
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-xs font-bold text-primary border border-primary/30">
          {new Date(movie.release_date).getFullYear()}
        </div>
      </div>
      
      <div className="flex flex-col gap-1">
        <h3 className="text-white font-medium text-sm truncate leading-tight">
          {movie.title}
        </h3>
        <Rating value={movie.vote_average} size={12} />
      </div>
    </div>
  );
};