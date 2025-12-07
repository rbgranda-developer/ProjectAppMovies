import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon,
  Home as HomeIcon,
  Search as SearchIcon,
  LogOut,
  Camera,
  PlayCircle,
  Clock,
  Calendar,
  ChevronLeft,
  Film,
  Star,
} from 'lucide-react';

const TMDB_API_KEY = 'eaf45f010e951b56986a7210ee0a4f99';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

interface User {
  username: string;
  email: string;
  avatarUrl?: string;
  bio: string;
}

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
}

interface MovieDetails extends Movie {
  runtime: number;
  tagline: string;
  genres: { id: number; name: string }[];
  credits: { cast: CastMember[] };
}

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface TmdbResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

const getImageUrl = (path: string | null | undefined, size: 'w500' | 'original' = 'w500'): string => {
  if (!path) return `https://placehold.co/500x750/1e293b/a8a8a8?text=No+Image`;
  return `${IMAGE_BASE_URL}${size}${path}`;
};

const safeFetch = async (url: string, retries = 3): Promise<any> => {
  let delay = 1000;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i < retries - 1) await new Promise(resolve => setTimeout(resolve, delay));
      else throw error;
      delay *= 2;
    }
  }
};

const tmdbService = {
  getPopularMovies: async (): Promise<TmdbResponse> => {
    const url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=es-ES&page=1`;
    return safeFetch(url);
  },
  getMovieDetails: async (movieId: number): Promise<MovieDetails> => {
    const detailsUrl = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=es-ES`;
    const creditsUrl = `${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}&language=es-ES`;
    const [details, credits] = await Promise.all([safeFetch(detailsUrl), safeFetch(creditsUrl)]);
    return { ...details, credits };
  },
  searchMovies: async (query: string): Promise<TmdbResponse> => {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(query)}&page=1`;
    return safeFetch(url);
  },
};




const Rating = ({ value, size = 16, showText = false }: { value: number; size?: number; showText?: boolean }) => {
  const percentage = (value / 10) * 100;
  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      <div className="relative flex">
        {[...Array(5)].map((_, i) => (
          <Star key={`bg-${i}`} size={size} fill="currentColor" className="text-gray-600" />
        ))}
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${percentage}%` }}>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={`fg-${i}`} size={size} fill="currentColor" className="text-yellow-400" />
            ))}
          </div>
        </div>
      </div>
      <span className={`text-sm ${showText ? 'text-white' : 'text-gray-400'}`}>{value.toFixed(1)}</span>
    </div>
  );
};

const MovieCard = ({ movie, onClick, isFavorite, toggleFavorite }: { movie: Movie; onClick: (m: Movie) => void; isFavorite: boolean; toggleFavorite: (m: Movie) => void }) => {
  const posterUrl = getImageUrl(movie.poster_path, 'w500');
  const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
  return (
    <div
      className="bg-dark-card rounded-xl overflow-hidden shadow-lg cursor-pointer transform hover:scale-[1.03] transition-all duration-300 active:scale-[0.98] group relative"
    >
      <div className="relative pt-[150%]" onClick={() => onClick(movie)}>
        <img src={posterUrl} alt={movie.title} className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {(e.target as HTMLImageElement).src = getImageUrl(null);} }
        />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-end p-2.5">
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-medium text-yellow-400 border border-yellow-400/30">
            {releaseYear}
          </div>
          <div className="w-full">
            <h4 className="text-white text-sm font-semibold truncate drop-shadow-md">{movie.title}</h4>
            <div className="mt-1"><Rating value={movie.vote_average} size={12} /></div>
          </div>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); toggleFavorite(movie); }}
        className={`absolute top-2 left-2 p-1 rounded-full border border-white/20 ${isFavorite ? 'bg-yellow-400 text-black' : 'bg-black/50 text-white'} hover:scale-110 transition-transform`}
      >
        ★
      </button>
    </div>
  );
};

const AuthView = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const API_URL = 'http://10.0.2.2:3000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const endpoint = isLogin ? '/login' : '/registro';
    const payload = isLogin ? { email, password } : { nombre: name, email, password };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        if (isLogin) {
          const userFromDB = data.user || data.usuario;
          const appUser: User = {
            username: userFromDB.nombre,
            email: userFromDB.email,
            avatarUrl: undefined,
            bio: 'Usuario de MoviesLand',
          };
          localStorage.setItem('cineRedUser', JSON.stringify(appUser));
          if(data.token) localStorage.setItem('authToken', data.token);
          onLogin(appUser);
        } else {
          alert('Cuenta creada exitosamente. Ahora inicia sesión.');
          setIsLogin(true);
        }
      } else {
        alert(data.error || 'Ocurrió un error en la autenticación.');
      }
    } catch (err) {
      console.error(err);
      alert(`Error de conexión a ${API_URL}. Revisa que el servidor corra y el firewall permita Node.js.`);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#f59e0b]/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-primary tracking-tighter mb-2">MoviesLand</h1>
          <p className="text-gray-400">Tu universo cinematográfico</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 ml-1">Nombre</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-[#1f2937] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="Tu nombre"
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 ml-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#1f2937] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="usuario@ejemplo.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 ml-1">Contraseña</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#1f2937] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={isLoading}
            className={`w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-6 ${isLoading ? 'opacity-70' : ''}`}
          >
            {isLoading ? 'Conectando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>
        </form>
        <p className="text-center mt-8 text-gray-500 text-sm">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          <button type="button" onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-white underline decoration-primary decoration-2 underline-offset-4 font-medium">
            {isLogin ? 'Regístrate' : 'Inicia Sesión'}
          </button>
        </p>
      </div>
    </div>
  );
};

const MovieDetailsView = ({ movie, onBack }: { movie: Movie; onBack: () => void }) => {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      try { const data = await tmdbService.getMovieDetails(movie.id); setDetails(data); }
      catch (err) { console.error(err); } finally { setLoading(false); }
    };
    loadDetails();
  }, [movie.id]);

  if (loading) return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center text-primary">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  const displayDetails = details || (movie as MovieDetails);
  const backdropUrl = displayDetails?.backdrop_path ? getImageUrl(displayDetails.backdrop_path, 'original') : getImageUrl(displayDetails?.poster_path);
  const formatRuntime = (minutes?: number) => minutes ? `${Math.floor(minutes/60)}h ${minutes%60}m` : 'N/A';

  return (
    <div className="min-h-screen bg-dark-bg text-white pb-20">
      <div className="relative h-[60vh] w-full">
        <div className="absolute inset-0">
          <img src={backdropUrl} alt="Backdrop" className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/60 to-transparent"/>
          <div className="absolute inset-0 bg-gradient-to-r from-[#111827]/80 to-transparent"/>
        </div>
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
          <button onClick={onBack} className="bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10 hover:bg-black/60 transition-colors">
            <ChevronLeft size={24}/>
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <h1 className="text-3xl font-black mb-2 leading-tight drop-shadow-lg">{displayDetails.title}</h1>
          {details?.tagline && <p className="text-gray-300 italic text-sm mb-3 drop-shadow">{details.tagline}</p>}
          <div className="flex flex-wrap gap-3 mb-4 text-xs font-medium text-gray-300">
            <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded backdrop-blur-sm">
              <Clock size={12} className="text-primary"/> {formatRuntime(details?.runtime)}
            </span>
            <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded backdrop-blur-sm">
              <Calendar size={12} className="text-primary"/> {displayDetails.release_date.split('-')[0]}
            </span>
            <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded backdrop-blur-sm">
              <Rating value={displayDetails.vote_average} size={12} showText={true}/>
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {details?.genres.map(g => (
              <span key={g.id} className="text-xs text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-full">{g.name}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="px-6 -mt-4 relative z-20">
        <div className="bg-[#1f2937] rounded-2xl p-5 border border-white/5 shadow-xl mb-6">
          <h2 className="text-lg font-bold mb-2 text-white">Sinopsis</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{displayDetails.overview || "No hay sinopsis disponible."}</p>
        </div>
        {details?.credits.cast.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 text-white pl-1 border-l-4 border-primary leading-none">Reparto Principal</h2>
            <div className="flex overflow-x-auto space-x-4 pb-2 scrollbar-hide">
              {details.credits.cast.slice(0,10).map(member => (
                <div key={member.id} className="flex-shrink-0 w-24 text-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-1.5 bg-neutral-800 border-2 border-white/10">
                    <img src={getImageUrl(member.profile_path, 'w500')} alt={member.name} className="w-full h-full object-cover"
                      onError={(e)=>{(e.target as HTMLImageElement).src=`https://placehold.co/100x100/374151/d1d5db?text=`;}}/>
                  </div>
                  <p className="text-xs font-medium text-white line-clamp-2 leading-tight">{member.name}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-1 italic">{member.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 mb-8 active:scale-[0.98] transition-all">
          <PlayCircle size={20} fill="currentColor" className="text-white"/>
          Ver Trailer
        </button>
      </div>
    </div>
  );
};

const ProfileView = ({ user, onUpdate, onLogout, favorites }: { user: User, onUpdate: (u: User)=>void, onLogout: ()=>void, favorites: Movie[] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => { onUpdate(formData); setIsEditing(false); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if(file){ const reader=new FileReader(); reader.onloadend=()=>setFormData({...formData,avatarUrl:reader.result as string}); reader.readAsDataURL(file);}
  };

  return (
    <div className="min-h-screen bg-[#111827] p-6 pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <button onClick={onLogout} className="text-red-400 bg-red-500/10 p-2 rounded-lg hover:bg-red-500/20 transition-colors"><LogOut size={20}/></button>
      </div>
      <div className="flex flex-col items-center mb-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#1f2937] shadow-2xl bg-neutral-800">
            {formData.avatarUrl ? <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-500"><UserIcon size={48}/></div>}
          </div>
          {isEditing && <button onClick={()=>fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-primary text-white p-2.5 rounded-full shadow-lg border-2 border-[#111827] hover:bg-primary/90 transition-colors"><Camera size={18}/></button>}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange}/>
        </div>
        {!isEditing ? (
          <div className="text-center mt-4">
            <h2 className="text-xl font-bold text-white">{user.username}</h2>
            <p className="text-gray-400 text-sm">{user.email}</p>
            <p className="text-gray-500 text-sm mt-2 italic max-w-xs px-4">"{user.bio}"</p>
            <button onClick={()=>setIsEditing(true)} className="mt-4 px-6 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium hover:bg-white/10 transition-colors">Editar Perfil</button>
          </div>
        ) : (
          <div className="w-full mt-6 space-y-4 max-w-sm">
            <div className="space-y-1"><label className="text-xs text-gray-400 ml-1">Nombre de usuario</label>
              <input type="text" value={formData.username} onChange={e=>setFormData({...formData,username:e.target.value})} className="w-full bg-[#1f2937] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"/>
            </div>
            <div className="space-y-1"><label className="text-xs text-gray-400 ml-1">Biografía</label>
              <textarea value={formData.bio} onChange={e=>setFormData({...formData,bio:e.target.value})} className="w-full bg-[#1f2937] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary min-h-[100px]"/>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={()=>{setIsEditing(false); setFormData(user);}} className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300 font-medium hover:bg-gray-600 transition-colors">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-primary text-white font-medium shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">Guardar</button>
            </div>
          </div>
        )}
      </div>
      <div className="bg-[#1f2937] rounded-2xl p-5 border border-white/5 max-w-sm mx-auto">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Film size={18} className="text-primary"/> Estadísticas</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/30 p-3 rounded-xl text-center">
            <span className="block text-2xl font-black text-white">{favorites.length}</span>
            <span className="text-xs text-gray-500">Películas Favoritas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomeView = ({ onMovieSelect, favorites, toggleFavorite }: { onMovieSelect: (m: Movie)=>void, favorites: Movie[], toggleFavorite: (m: Movie)=>void }) => {
  const [popularMovies,setPopularMovies]=useState<Movie[]>([]);
  const [featured,setFeatured]=useState<Movie | null>(null);
  const [searchTerm,setSearchTerm]=useState('');
  const [searchResults,setSearchResults]=useState<Movie[]>([]);
  const [isLoading,setIsLoading]=useState(false);
  const [isSearching,setIsSearching]=useState(false);

  useEffect(()=>{
    const fetchMovies=async()=>{
      setIsLoading(true);
      try{
        const data = await tmdbService.getPopularMovies();
        setPopularMovies(data.results);
        const featuredCandidate = data.results.find(m=>m.backdrop_path)||data.results[0];
        setFeatured(featuredCandidate);
      }catch(e){ console.error(e); setPopularMovies([]);}
      finally{ setIsLoading(false);}
    };
    fetchMovies();
  },[]);

  useEffect(()=>{
    const search = async()=>{
      if(searchTerm.length>2){
        setIsSearching(true);
        try{ const data = await tmdbService.searchMovies(searchTerm); setSearchResults(data.results.filter(m=>m.poster_path));}
        catch(e){console.error(e);}
        finally{setIsSearching(false);}
      }else{setSearchResults([]);}
    };
    const debounce = setTimeout(search,500);
    return ()=>clearTimeout(debounce);
  },[searchTerm]);

  const displayMovies = searchTerm.length>2?searchResults:popularMovies.filter(m=>m.poster_path);
  const currentLoading = searchTerm.length>2?isSearching:isLoading;

  return (
    <div className="min-h-screen bg-[#111827] pb-24 text-white">
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md p-4 border-b border-white/5">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
          <input type="text" placeholder="Buscar películas..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
            className="w-full bg-[#1f2937] border-none rounded-full py-2.5 pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-primary focus:outline-none placeholder-gray-500"
          />
        </div>
      </div>
      {currentLoading && <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"/></div>}
      {!searchTerm && !currentLoading && featured && (
        <div className="relative h-96 w-full mb-6 cursor-pointer" onClick={()=>onMovieSelect(featured)}>
          <img src={getImageUrl(featured.backdrop_path,'original')} alt={featured.title} className="w-full h-full object-cover" onError={e=>(e.target as HTMLImageElement).src=getImageUrl(featured.poster_path)}/>
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent"/>
          <div className="absolute bottom-0 p-6 w-full">
            <span className="px-2 py-1 bg-primary text-white text-[10px] font-bold rounded mb-2 inline-block">DESTACADO</span>
            <h2 className="text-3xl font-black text-white mb-2 leading-none drop-shadow-md">{featured.title}</h2>
            <div className="flex items-center gap-2 mb-2"><Rating value={featured.vote_average}/></div>
            <p className="text-gray-300 text-xs line-clamp-2 drop-shadow-sm">{featured.overview}</p>
          </div>
        </div>
      )}
      <div className="px-4">
        <h3 className="text-lg font-bold text-white mb-4 pl-1 border-l-4 border-primary leading-none">{searchTerm?'Resultados de búsqueda':'Populares ahora'}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {displayMovies.map(m=><MovieCard key={m.id} movie={m} onClick={onMovieSelect} isFavorite={favorites.some(f=>f.id===m.id)} toggleFavorite={toggleFavorite}/>)}
        </div>
        {displayMovies.length===0 && !currentLoading && searchTerm && <div className="text-center text-gray-500 py-10">No se encontraron películas para "{searchTerm}".</div>}
      </div>
    </div>
  );
};

function App() {
  const [user,setUser]=useState<User | null>(null);
  const [activeTab,setActiveTab]=useState<'home'|'profile'>('home');
  const [selectedMovie,setSelectedMovie]=useState<Movie | null>(null);
  const [favorites, setFavorites] = useState<Movie[]>([]);

  useEffect(()=>{
    const savedUser=localStorage.getItem('cineRedUser');
    if(savedUser){ 
      try{setUser(JSON.parse(savedUser));}catch(e){console.error(e); localStorage.removeItem('cineRedUser');} 
    }
  },[]);

  useEffect(()=>{
    if(user){
      const favs = localStorage.getItem(`favorites_${user.email}`);
      if(favs) setFavorites(JSON.parse(favs));
    }
  },[user]);

  const handleLogin=(newUser:User)=>{
    setUser(newUser); 
    setActiveTab('home');
    const favs = localStorage.getItem(`favorites_${newUser.email}`);
    if(favs) setFavorites(JSON.parse(favs));
  };

  const handleUpdateProfile=(updatedUser:User)=>{
    setUser(updatedUser); 
    localStorage.setItem('cineRedUser',JSON.stringify(updatedUser));
  };

  const handleLogout=()=>{
    if(user) localStorage.setItem(`favorites_${user.email}`, JSON.stringify(favorites));
    setUser(null); 
    localStorage.removeItem('cineRedUser'); 
    localStorage.removeItem('authToken'); 
    setActiveTab('home'); 
    setSelectedMovie(null);
  };

  const toggleFavorite = (movie: Movie) => {
    let updated: Movie[];
    if(favorites.some(f=>f.id===movie.id)) updated = favorites.filter(f=>f.id!==movie.id);
    else updated = [...favorites, movie];
    setFavorites(updated);
    if(user) localStorage.setItem(`favorites_${user.email}`, JSON.stringify(updated));
  };

  if(!user) return <AuthView onLogin={handleLogin}/>;
  if(selectedMovie) return <MovieDetailsView movie={selectedMovie} onBack={()=>setSelectedMovie(null)}/>; 

  return (
    <div className="bg-dark-bg min-h-screen text-white font-sans selection:bg-primary selection:text-white">
      {activeTab==='home' && <HomeView onMovieSelect={setSelectedMovie} favorites={favorites} toggleFavorite={toggleFavorite}/>}
      {activeTab==='profile' && <ProfileView user={user} onUpdate={handleUpdateProfile} onLogout={handleLogout} favorites={favorites}/>}
      <div className="fixed bottom-0 left-0 right-0 bg-dark-bg/90 backdrop-blur-lg border-t border-white/10 px-6 py-3 flex justify-around items-center z-50 pb-4">
        <button onClick={()=>setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab==='home'?'text-primary':'text-gray-500 hover:text-gray-300'}`}><HomeIcon size={24} strokeWidth={activeTab==='home'?2.5:2}/><span className="text-[10px] font-medium">Inicio</span></button>
        <div className="w-px h-8 bg-white/10 mx-2"></div>
        <button onClick={()=>setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab==='profile'?'text-primary':'text-gray-500 hover:text-gray-300'}`}>
          {user.avatarUrl?<img src={user.avatarUrl} className={`w-6 h-6 rounded-full border-2 object-cover ${activeTab==='profile'?'border-primary':'border-gray-500'}`} alt="avatar"/>:<UserIcon size={24} strokeWidth={activeTab==='profile'?2.5:2}/>}
          <span className="text-[10px] font-medium">Perfil</span>
        </button>
      </div>
    </div>
  );
}

export default App;
