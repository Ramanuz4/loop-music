import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowDownRight, ArrowLeft, ArrowRight, AudioLines, BadgeCheck, BarChart3, Check,
  ChevronDown, CircleHelp, Disc3, Headphones, Heart, LayoutDashboard, LogOut,
  Menu, Music2, Play, Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles,
  Upload, Users, X,
} from 'lucide-react';

type Role = 'listener' | 'creator' | 'admin';
type User = { name: string; email: string; role: Role };
type Track = { id: number; title: string; creator: string; category: string; bpm: number; key: string; price: string; color: string; tag: string; bars: number[]; audioAvailable?: boolean };

const initialTracks: Track[] = [
  { id: 1, title: 'Soft Focus', creator: 'moss.wav', category: 'Ambient', bpm: 84, key: 'C maj', price: '$12', color: 'sage', tag: 'NEW DROP', bars: [16, 29, 21, 43, 35, 18, 30, 48, 37, 22, 43, 27, 35, 17, 40, 31, 22, 45, 28, 38, 17, 31, 45, 25] },
  { id: 2, title: 'After Hours', creator: 'Niko June', category: 'Soul', bpm: 92, key: 'F min', price: '$8', color: 'lavender', tag: 'TRENDING', bars: [20, 32, 46, 26, 40, 18, 35, 48, 24, 37, 18, 44, 30, 22, 47, 34, 20, 40, 27, 46, 31, 19, 38, 24] },
  { id: 3, title: 'Sunroom', creator: 'juniper club', category: 'Indie', bpm: 108, key: 'A maj', price: '$15', color: 'peach', tag: 'STAFF PICK', bars: [25, 45, 30, 18, 40, 28, 47, 21, 37, 17, 44, 29, 38, 20, 47, 32, 22, 39, 17, 45, 29, 36, 20, 42] },
  { id: 4, title: 'Blue Hour', creator: 'sunroom.fm', category: 'Electronic', bpm: 120, key: 'D min', price: '$10', color: 'blue', tag: 'JUST ADDED', bars: [18, 42, 27, 47, 22, 37, 18, 44, 30, 47, 21, 35, 48, 26, 40, 18, 31, 45, 23, 38, 18, 43, 29, 39] },
  { id: 5, title: 'Little Things', creator: 'mila miles', category: 'Hip-hop', bpm: 86, key: 'G min', price: '$9', color: 'butter', tag: 'LOVED', bars: [42, 25, 37, 19, 45, 28, 39, 17, 46, 30, 41, 22, 35, 47, 26, 40, 18, 33, 45, 24, 38, 20, 43, 31] },
  { id: 6, title: 'Off Script', creator: 'lowkey leo', category: 'R&B', bpm: 74, key: 'B min', price: '$11', color: 'rose', tag: 'UNDERGROUND', bars: [25, 36, 18, 46, 32, 20, 41, 27, 48, 22, 34, 17, 42, 29, 38, 19, 46, 30, 22, 40, 26, 48, 31, 18] },
];
const genres = ['All sounds', 'Ambient', 'Soul', 'Indie', 'Electronic', 'Hip-hop', 'R&B'];

function readUser(): User | null {
  try { return JSON.parse(localStorage.getItem('loop-user') || 'null') as User | null; } catch { return null; }
}
function readUploads(): Track[] {
  try { return JSON.parse(localStorage.getItem('loop-uploads') || '[]') as Track[]; } catch { return []; }
}

function saveAudioFile(id: number, file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('loop-audio-library', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('audio', { keyPath: 'id' });
    request.onerror = () => reject(request.error ?? new Error('Could not open local audio storage.'));
    request.onsuccess = () => {
      const transaction = request.result.transaction('audio', 'readwrite');
      transaction.objectStore('audio').put({ id, file });
      transaction.oncomplete = () => { request.result.close(); resolve(); };
      transaction.onerror = () => { request.result.close(); reject(transaction.error ?? new Error('Could not save this audio file.')); };
    };
  });
}

function loadAudioFile(id: number): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('loop-audio-library', 1);
    request.onerror = () => reject(request.error ?? new Error('Could not open local audio storage.'));
    request.onsuccess = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains('audio')) { database.close(); resolve(null); return; }
      const transaction = database.transaction('audio', 'readonly');
      const getRequest = transaction.objectStore('audio').get(id);
      getRequest.onsuccess = () => { database.close(); resolve((getRequest.result?.file as Blob | undefined) ?? null); };
      getRequest.onerror = () => { database.close(); reject(getRequest.error ?? new Error('Could not load this audio file.')); };
    };
  });
}

function App() {
  const [user, setUser] = useState<User | null>(readUser);
  const [uploads, setUploads] = useState<Track[]>(readUploads);
  const [playing, setPlaying] = useState<number | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState('');
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('All sounds');
  const audioRef = useRef<HTMLAudioElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const allTracks = useMemo(() => [...uploads, ...initialTracks], [uploads]);
  const filteredTracks = allTracks.filter((track) => {
    const matchesQuery = `${track.title} ${track.creator} ${track.category}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (genre === 'All sounds' || track.category === genre);
  });

  useEffect(() => {
    let frame = 0;
    if (location.pathname === '/' && location.hash) {
      frame = window.requestAnimationFrame(() => {
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else if (location.pathname !== '/') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.hash, location.key]);

  useEffect(() => {
    if (!playbackUrl) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().catch(() => {
      setPlaying(null);
      setPlaybackError('This browser could not play that audio file. Try another format.');
    });
    return () => audio.pause();
  }, [playbackUrl]);

  useEffect(() => () => {
    if (playbackUrl) URL.revokeObjectURL(playbackUrl);
  }, [playbackUrl]);

  function login(nextUser: User) {
    localStorage.setItem('loop-user', JSON.stringify(nextUser));
    setUser(nextUser);
    navigate(nextUser.role === 'creator' ? '/creator' : nextUser.role === 'admin' ? '/admin' : '/');
  }
  function logout() {
    localStorage.removeItem('loop-user');
    setUser(null);
    navigate('/');
  }
  function addUpload(track: Track) {
    const next = [track, ...uploads];
    setUploads(next);
    localStorage.setItem('loop-uploads', JSON.stringify(next));
  }
  async function togglePlay(id: number) {
    setPlaybackError('');
    if (playing === id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    audioRef.current?.pause();
    const track = allTracks.find((item) => item.id === id);
    if (track?.audioAvailable) {
      try {
        const file = await loadAudioFile(id);
        if (!file) throw new Error('The saved audio file is missing. Please upload the sound again.');
        setPlaying(id);
        setPlaybackUrl(URL.createObjectURL(file));
      } catch (error) {
        setPlaybackError(error instanceof Error ? error.message : 'Could not load this audio file.');
        setPlaying(null);
      }
      return;
    }
    setPlaybackUrl(null);
    setPlaying(id);
  }

  return (
    <div className="app-shell">
      <Header user={user} onLogout={logout} />
      <audio ref={audioRef} src={playbackUrl ?? undefined} hidden onEnded={() => setPlaying(null)} />
      {playbackError && <div className="playback-error" role="status">{playbackError}<button onClick={() => setPlaybackError('')} aria-label="Dismiss message"><X size={14} /></button></div>}
      <Routes>
        <Route path="/" element={<Home tracks={filteredTracks} query={query} setQuery={setQuery} genre={genre} setGenre={setGenre} playing={playing} togglePlay={togglePlay} />} />
        <Route path="/login" element={<AuthPage mode="login" onSubmit={login} />} />
        <Route path="/signup" element={<AuthPage mode="signup" onSubmit={login} />} />
        <Route path="/creator" element={user?.role === 'creator' ? <CreatorPage user={user} uploads={uploads} onUpload={addUpload} playing={playing} togglePlay={togglePlay} /> : <Navigate to={user ? '/' : '/login'} replace state={{ from: location.pathname }} />} />
        <Route path="/admin" element={user?.role === 'admin' ? <AdminPage tracks={allTracks} /> : <Navigate to={user ? '/' : '/login'} replace state={{ from: location.pathname }} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  );
}

function Header({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="Loop home"><span className="brand-mark"><AudioLines size={21} strokeWidth={2.2} /></span><span>loop<span className="brand-dot">.</span></span></Link>
        <button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`}>
          <Link className={location.pathname === '/' ? 'nav-active' : ''} onClick={() => setMenuOpen(false)} to="/">Explore</Link>
          <Link to="/#sounds" onClick={() => setMenuOpen(false)}>Sounds</Link>
          <Link to="/#how-it-works" onClick={() => setMenuOpen(false)}>How it works</Link>
        </nav>
        <div className="header-actions">
          {user ? <>
            <span className="user-greeting">Hey, {user.name.split(' ')[0]}</span>
            {user.role === 'creator' && <Link className="button button-quiet header-dashboard" to="/creator"><LayoutDashboard size={15} /> Studio</Link>}
            {user.role === 'admin' && <Link className="button button-quiet header-dashboard" to="/admin"><ShieldCheck size={15} /> Admin</Link>}
            <button className="icon-button logout-button" title="Log out" onClick={onLogout}><LogOut size={17} /></button>
          </> : <><Link className="button button-quiet login-button" to="/login">Log in</Link><Link className="button button-dark signup-button" to="/signup">Join Loop <ArrowRight size={15} /></Link></>}
        </div>
      </div>
    </header>
  );
}

function Home({ tracks, query, setQuery, genre, setGenre, playing, togglePlay }: {
  tracks: Track[]; query: string; setQuery: (value: string) => void; genre: string; setGenre: (value: string) => void; playing: number | null; togglePlay: (id: number) => void;
}) {
  return <main>
    <section className="hero section-wrap">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-line" /> THE SOUND OF WHAT'S NEXT</div>
        <h1>Find your<br />next <span className="serif-word">sound.</span></h1>
        <p className="hero-description">A home for independent sounds and the people who make them. Find your feeling, then make it yours.</p>
        <div className="hero-buttons"><a className="button button-dark button-large" href="#sounds">Explore sounds <ArrowRight size={17} /></a><a href="#how-it-works" className="text-link">How Loop works <ArrowDownRight size={16} /></a></div>
        <div className="hero-proof"><div className="avatar-stack"><i>J</i><i>M</i><i>S</i><i>A</i></div><span>Made for music people,<br /><b>by music people</b></span></div>
      </div>
      <div className="hero-art" aria-label="Abstract artwork representing music">
        <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
        <div className="hero-record"><div className="record-groove groove-one" /><div className="record-groove groove-two" /><div className="record-groove groove-three" /><div className="record-label"><AudioLines size={24} /><span>LOOP<br />SIDE A</span></div></div>
        <div className="art-sticker sticker-top"><Sparkles size={14} /> SOUND<br />WITHOUT<br />BORDERS</div>
        <div className="art-caption"><span>VOL. 01 — NOW PLAYING</span><strong>Good things<br />in rotation.</strong></div>
        <div className="art-note note-one">♪</div><div className="art-note note-two">♫</div>
      </div>
      <div className="hero-bottom-label"><span>INDEPENDENT SOUND MARKETPLACE</span><span>SCROLL TO EXPLORE ↓</span></div>
    </section>

    <section className="ticker" aria-label="Loop community"><div className="ticker-track">MADE TO MAKE SOMETHING <span>✳</span> YOUR NEXT FAVORITE SOUND <span>✳</span> INDEPENDENT BY NATURE <span>✳</span> MADE TO MAKE SOMETHING <span>✳</span> YOUR NEXT FAVORITE SOUND <span>✳</span></div></section>

    <section className="sounds-section section-wrap" id="sounds">
      <div className="section-heading">
        <div><div className="eyebrow"><span className="eyebrow-line" /> THE GOOD STUFF</div><h2>Sounds to get<br className="mobile-break" /> <span className="serif-word">lost in.</span></h2></div>
        <div className="section-heading-aside"><span>Little pieces of inspiration,<br />ready for whatever's next.</span><span className="results-count">{tracks.length.toString().padStart(2, '0')} SOUNDS <span>↘</span></span></div>
      </div>
      <div className="discovery-controls">
        <div className="genre-tabs" role="group" aria-label="Filter by genre">{genres.map((item) => <button key={item} className={genre === item ? 'genre-active' : ''} onClick={() => setGenre(item)}>{item}</button>)}</div>
        <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a feeling..." aria-label="Search sounds" />{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={14} /></button>}</label>
      </div>
      {tracks.length ? <div className="track-grid">{tracks.map((track, index) => <TrackCard key={track.id} track={track} index={index} playing={playing === track.id} onPlay={() => togglePlay(track.id)} />)}</div> : <div className="empty-results"><Disc3 size={30} /><p>No sounds found just yet.</p><button className="text-link" onClick={() => { setQuery(''); setGenre('All sounds'); }}>Clear filters <ArrowRight size={15} /></button></div>}
      <div className="browse-footer"><span>GOOD SOUND FINDS ITS PEOPLE.</span><span>{tracks.length} sounds to explore</span></div>
    </section>

    <section className="manifesto" id="how-it-works"><div className="manifesto-inner section-wrap"><span className="manifesto-index">01 / THE LOOP IDEA</span><div className="manifesto-content"><h2>Find it.<br /><span className="serif-word">Feel it.</span><br />Make it yours.</h2><p>Skip the endless scroll. Loop brings independent creators and music makers together over sounds worth sharing. One little spark can change everything.</p><Link className="button button-outline" to="/signup">Find your loop <ArrowRight size={16} /></Link></div><div className="manifesto-stamp"><div><Music2 size={26} /><span>GOOD<br />SOUND<br />ONLY</span></div></div></div></section>

    <section className="creator-cta section-wrap"><div className="creator-cta-art"><div className="cta-wave">{Array.from({ length: 28 }, (_, i) => <span key={i} style={{ height: `${18 + ((i * 17 + 13) % 70)}%` }} />)}</div><span className="cta-art-caption">YOUR SOUND. YOUR TERMS.</span></div><div className="creator-cta-copy"><span className="eyebrow"><span className="eyebrow-line" /> FOR THE MAKERS</span><h2>You make the<br /><span className="serif-word">magic.</span> We make<br />room for it.</h2><p>Put your sounds in front of music makers who are looking for exactly what you do. Keep your rights. Keep making.</p><Link className="button button-dark" to="/signup?role=creator">Meet your people <ArrowRight size={16} /></Link></div></section>
    <section className="bottom-note section-wrap"><span>INDEPENDENT SOUNDS. ENDLESS POSSIBILITIES.</span><span>MADE WITH FEELING <Heart size={13} fill="currentColor" /></span></section>
  </main>;
}

function TrackCard({ track, index, playing, onPlay }: { track: Track; index: number; playing: boolean; onPlay: () => void }) {
  const [liked, setLiked] = useState(false);
  return <article className="track-card" style={{ animationDelay: `${index * 55}ms` }}>
    <div className={`track-art art-${track.color}`}>
      <span className="track-tag">{track.tag}</span>
      <div className="cover-orb orb-a" /><div className="cover-orb orb-b" />
      <div className="cover-wave">{track.bars.map((bar, i) => <span key={i} style={{ height: `${bar}px` }} />)}</div>
      <button className={`play-button ${playing ? 'is-playing' : ''}`} aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`} onClick={onPlay}>{playing ? <span className="pause-mark">Ⅱ</span> : <Play size={18} fill="currentColor" />}</button>
      <span className="cover-number">L—0{index + 1}</span>
    </div>
    <div className="track-info"><div><h3>{track.title}</h3><span className="track-creator">by {track.creator}</span></div><button className={`like-button ${liked ? 'liked' : ''}`} aria-label={liked ? 'Unlike sound' : 'Like sound'} onClick={() => setLiked(!liked)}><Heart size={17} fill={liked ? 'currentColor' : 'none'} /></button></div>
    <div className="track-meta"><span>{track.category}</span><span className="meta-dot" /> <span>{track.bpm} BPM</span><span className="meta-spacer" /><span className="track-price">{track.price}</span></div>
  </article>;
}

function AuthPage({ mode, onSubmit }: { mode: 'login' | 'signup'; onSubmit: (user: User) => void }) {
  const isSignup = mode === 'signup';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(new URLSearchParams(window.location.search).get('role') === 'creator' ? 'creator' : 'listener');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.includes('@')) { setError('Enter a valid email address to continue.'); return; }
    onSubmit({ name: name.trim() || email.split('@')[0], email, role });
  }
  return <main className="auth-page section-wrap">
    <div className="auth-back"><button className="text-link" onClick={() => navigate(-1)}><ArrowLeft size={15} /> Back</button></div>
    <div className="auth-layout"><div className="auth-editorial"><div className="eyebrow"><span className="eyebrow-line" /> YOUR PEOPLE ARE HERE</div><h1>{isSignup ? <>A little more<br />room to <span className="serif-word">create.</span></> : <>Good to<br />have you <span className="serif-word">back.</span></>}</h1><p>{isSignup ? 'Join a community that believes the best sounds are still waiting to be found.' : 'Pick up where the good stuff left off.'}</p><div className="auth-decoration"><div className="auth-disc"><span /><span /><span /><i><AudioLines size={19} /></i></div><span className="auth-note">SIDE A — YOU'RE IN GOOD COMPANY</span></div></div>
      <form className="auth-form" onSubmit={submit}><div className="form-kicker">{isSignup ? 'MAKE YOURSELF AT HOME' : 'STEP BACK INTO THE SOUND'}</div><h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2><p className="form-subtitle">{isSignup ? 'A few details and you’re in.' : 'Enter your email to continue.'}</p>
        {isSignup && <label className="field-label">Your name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="What should we call you?" /></label>}
        <label className="field-label">Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label className="field-label">Password<input required type="password" minLength={6} placeholder="At least 6 characters" /></label>
        {isSignup && <div className="field-label role-label">I’m here as a <span className="role-options">{(['listener', 'creator'] as Role[]).map((item) => <button type="button" className={role === item ? 'role-selected' : ''} onClick={() => setRole(item)} key={item}>{item === 'listener' ? <Headphones size={14} /> : <Music2 size={14} />}{item}</button>)}</span></div>}
        {error && <div className="form-error">{error}</div>}
        <button className="button button-dark auth-submit" type="submit">{isSignup ? 'Create my account' : 'Log in to Loop'} <ArrowRight size={16} /></button>
        <div className="auth-switch">{isSignup ? 'Already part of the loop?' : 'New around here?'} <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Make an account'}</Link></div>
        <div className="demo-login"><span>JUST LOOKING AROUND?</span><p>Try a demo space</p><div><button type="button" onClick={() => onSubmit({ name: 'Jamie Creator', email: 'creator@loop.demo', role: 'creator' })}><Music2 size={13} /> Creator</button><button type="button" onClick={() => onSubmit({ name: 'Alex Admin', email: 'admin@loop.demo', role: 'admin' })}><ShieldCheck size={13} /> Admin</button></div></div>
      </form>
    </div>
  </main>;
}

function CreatorPage({ user, uploads, onUpload, playing, togglePlay }: { user: User; uploads: Track[]; onUpload: (track: Track) => void; playing: number | null; togglePlay: (id: number) => void }) {
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Ambient');
  const [bpm, setBpm] = useState('90');
  const [notice, setNotice] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  function chooseAudio(file: File | undefined) {
    setUploadError('');
    if (!file) return;
    const extensionLooksAudio = /\.(mp3|wav|ogg|m4a|aac|flac|aiff?)$/i.test(file.name);
    if (file.type && !file.type.startsWith('audio/') && !extensionLooksAudio) {
      setUploadError('Choose an audio file such as MP3, WAV, OGG, M4A, or FLAC.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setUploadError('Audio files must be smaller than 100 MB.');
      return;
    }
    setAudioFile(file);
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = Date.now();
    const track: Track = { id, title: title.trim(), creator: user.name, category, bpm: Number(bpm) || 90, key: 'C maj', price: '$10', color: ['sage', 'peach', 'blue', 'lavender'][uploads.length % 4], tag: 'JUST ADDED', bars: Array.from({ length: 24 }, (_, i) => 18 + ((i * 19 + title.length * 7) % 30)), audioAvailable: Boolean(audioFile) };
    if (audioFile) {
      try {
        await saveAudioFile(id, audioFile);
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Could not save your audio file.');
        return;
      }
    }
    onUpload(track); setTitle(''); setAudioFile(null); setShowUpload(false); setUploadError(''); setNotice(audioFile ? 'Your sound and audio file were saved in this browser.' : 'Your sound is live in the marketplace.'); window.setTimeout(() => setNotice(''), 3500);
  }
  return <main className="dashboard-page section-wrap"><div className="dashboard-topline"><span>LOOP STUDIO <span className="topline-slash">/</span> YOUR SPACE</span><span className="dashboard-date">GOOD THINGS TAKE SHAPE HERE <Sparkles size={14} /></span></div>
    <div className="dashboard-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> CREATOR DASHBOARD</div><h1>Hey, {user.name.split(' ')[0]}<span className="serif-word">.</span></h1><p>Your sounds are finding their people.</p></div><button className="button button-dark" onClick={() => setShowUpload(!showUpload)}><Plus size={17} /> Add a sound</button></div>
    {notice && <div className="success-notice"><Check size={16} /> {notice}</div>}
    <div className="stats-grid"><StatCard label="TOTAL PLAYS" value="2,481" trend="↑ 18% this month" icon={<Headphones />} /><StatCard label="YOUR SOUNDS" value={String(uploads.length).padStart(2, '0')} trend="Keep the good stuff coming" icon={<AudioLines />} /><StatCard label="EARNINGS" value="$384.20" trend="↑ $62.40 this month" icon={<BarChart3 />} /><StatCard label="COLLECTIONS" value="126" trend="People saved your sound" icon={<Heart />} /></div>
    {showUpload && <form className="upload-panel" onSubmit={submit}><div className="upload-panel-title"><div><span className="form-kicker">NEW RELEASE</span><h2>Put a sound out there.</h2></div><button type="button" className="icon-button" onClick={() => setShowUpload(false)} aria-label="Close upload"><X size={19} /></button></div><div className="upload-fields"><label className="field-label">Sound title<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give it a name" /></label><label className="field-label">Genre<select value={category} onChange={(event) => setCategory(event.target.value)}>{genres.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label className="field-label">Tempo (BPM)<input type="number" min="40" max="240" value={bpm} onChange={(event) => setBpm(event.target.value)} /></label></div><label className="upload-drop"><Upload size={20} /><span><b>{audioFile ? audioFile.name : 'Choose an audio file'}</b><small>{audioFile ? `${(audioFile.size / (1024 * 1024)).toFixed(1)} MB · ready to publish` : 'MP3, WAV, OGG, M4A, or FLAC · up to 100 MB · optional'}</small></span><input type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.aiff" onChange={(event) => chooseAudio(event.target.files?.[0])} /></label>{uploadError && <p className="upload-error" role="alert">{uploadError}</p>}<button className="button button-dark" type="submit">Publish sound <ArrowRight size={16} /></button></form>}
    <div className="dashboard-content"><div className="dashboard-list-header"><div><span className="form-kicker">YOUR CATALOG</span><h2>Sounds in the wild</h2></div><button className="filter-button"><SlidersHorizontal size={14} /> All sounds <ChevronDown size={14} /></button></div>{uploads.length ? <div className="creator-track-list">{uploads.map((track) => <div className="creator-track-row" key={track.id}><div className={`mini-art art-${track.color}`}><Music2 size={19} /></div><button className="row-play" onClick={() => togglePlay(track.id)} aria-label="Play sound">{playing === track.id ? 'Ⅱ' : <Play size={13} fill="currentColor" />}</button><div className="row-track-copy"><strong>{track.title}</strong><span>{track.category} · {track.bpm} BPM</span></div><span className="status-pill"><i /> LIVE</span><span className="row-plays">0 PLAYS</span><button className="more-button" aria-label="More options">···</button></div>)}</div> : <div className="creator-empty"><div className="empty-disc"><AudioLines size={24} /></div><div><h3>The first one is the best one.</h3><p>Your catalog’s looking a little quiet. Let’s change that.</p></div><button className="button button-outline" onClick={() => setShowUpload(true)}>Add your first sound <ArrowRight size={15} /></button></div>}</div>
    <div className="creator-tip"><Sparkles size={17} /><div><b>A little studio note</b><span>Good descriptions help your sounds find their people. Tell them what inspired you.</span></div><ArrowRight size={16} /></div>
  </main>;
}
function StatCard({ label, value, trend, icon }: { label: string; value: string; trend: string; icon: React.ReactNode }) { return <div className="stat-card"><div className="stat-top"><span>{label}</span><i>{icon}</i></div><strong>{value}</strong><small>{trend}</small></div>; }

function AdminPage({ tracks }: { tracks: Track[] }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'people'>('overview');
  const [status, setStatus] = useState<Record<number, string>>({});
  const pendingCount = tracks.filter((item) => status[item.id] !== 'approved').length;
  return <main className="dashboard-page admin-page section-wrap"><div className="dashboard-topline"><span>LOOP HQ <span className="topline-slash">/</span> ADMIN</span><span className="dashboard-date">A LITTLE HOUSEKEEPING <ShieldCheck size={14} /></span></div>
    <div className="dashboard-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> THE BACKSTAGE PASS</div><h1>Good morning<span className="serif-word">.</span></h1><p>Here’s what’s happening across Loop today.</p></div><span className="admin-live"><i /> ALL SYSTEMS SOUND</span></div>
    <div className="stats-grid"><StatCard label="COMMUNITY" value="8,429" trend="↑ 12.8% this month" icon={<Users />} /><StatCard label="SOUNDS LIVE" value={String(tracks.length + 142)} trend="Across every genre" icon={<AudioLines />} /><StatCard label="TO REVIEW" value={String(pendingCount).padStart(2, '0')} trend="Sounds awaiting a look" icon={<CircleHelp />} /><StatCard label="THIS MONTH" value="$12.8k" trend="Creator earnings paid" icon={<BarChart3 />} /></div>
    <div className="admin-console"><div className="admin-console-head"><div><span className="form-kicker">THE CONTROL ROOM</span><h2>Keep the good going.</h2></div><div className="admin-tabs">{(['overview', 'content', 'people'] as const).map((tab) => <button className={activeTab === tab ? 'admin-tab-active' : ''} onClick={() => setActiveTab(tab)} key={tab}>{tab}</button>)}</div></div>
      {activeTab === 'people' ? <div className="people-panel"><div className="people-illustration"><Users size={24} /></div><div><h3>Good people make Loop.</h3><p>Community management tools are in demo mode. Member data will show here when an account service is connected.</p></div><span className="status-pill"><i /> COMMUNITY HEALTHY</span></div> : <div className="moderation-table"><div className="table-row table-header"><span>{activeTab === 'content' ? 'ALL SOUNDS' : 'RECENT ACTIVITY'}</span><span>CREATOR</span><span>GENRE</span><span>STATUS</span><span>ACTION</span></div>{tracks.slice(0, 5).map((track) => <div className="table-row" key={track.id}><div className="table-track"><span className={`table-thumb art-${track.color}`}><Music2 size={14} /></span><span><b>{track.title}</b><small>{track.bpm} BPM · {track.key}</small></span></div><span className="table-creator">{track.creator}</span><span className="table-genre">{track.category}</span><span><span className={`status-pill ${status[track.id] === 'approved' ? 'approved' : ''}`}><i /> {status[track.id] === 'approved' ? 'APPROVED' : 'IN REVIEW'}</span></span><span><button className="review-button" onClick={() => setStatus((current) => ({ ...current, [track.id]: current[track.id] === 'approved' ? 'review' : 'approved' }))}>{status[track.id] === 'approved' ? 'Undo' : 'Review'} <ArrowRight size={13} /></button></span></div>)}</div>}
    </div><div className="admin-note"><BadgeCheck size={17} /><span>You're keeping the independent spirit alive. That's a pretty good day's work.</span><span>LOOP HQ · EST. 2025</span></div>
  </main>;
}

function Footer() { return <footer className="site-footer"><div className="footer-inner section-wrap"><Link className="brand" to="/"><span className="brand-mark"><AudioLines size={20} /></span><span>loop<span className="brand-dot">.</span></span></Link><span className="footer-line">A LITTLE MORE FEELING IN EVERYTHING.</span><span className="footer-copy">© 2025 LOOP SOUND CO.</span></div></footer>; }

export default App;
