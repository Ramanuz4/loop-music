import { Fragment, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowDownRight, ArrowLeft, ArrowRight, AudioLines, BadgeCheck, BarChart3, Bot, Check,
  ChevronDown, CircleHelp, CreditCard, Disc3, Headphones, Heart, LayoutDashboard, LogOut,
  CalendarDays, Menu, Music2, Play, Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles,
  Upload, Users, X, Wallet, CircleDollarSign, FileText, UserRound, LifeBuoy, Settings,
  Radio, ClipboardList, Ticket, Tags, Building2, Send, ExternalLink,
} from 'lucide-react';

type Role = 'creator' | 'admin';
type User = { name: string; email: string; role: Role };
type Track = { id: number; title: string; creator: string; category: string; bpm: number; key: string; price: string; color: string; tag: string; bars: number[]; audioAvailable?: boolean };

const genres = ['Ambient', 'Soul', 'Indie', 'Electronic', 'Hip-hop', 'R&B'];
const sampleTracks: Track[] = [
  { id: -1, title: 'Soft Focus', creator: 'moss.wav', category: 'Ambient', bpm: 84, key: 'C maj', price: '$12', color: 'sage', tag: 'NEW DROP', bars: [16, 29, 21, 43, 35, 18, 30, 48, 37, 22, 43, 27, 35, 17, 40, 31, 22, 45, 28, 38, 17, 31, 45, 25] },
  { id: -2, title: 'After Hours', creator: 'Niko June', category: 'Soul', bpm: 92, key: 'F min', price: '$8', color: 'lavender', tag: 'TRENDING', bars: [20, 32, 46, 26, 40, 18, 35, 48, 24, 37, 18, 44, 30, 22, 47, 34, 20, 40, 27, 46, 31, 19, 38, 24] },
  { id: -3, title: 'Sunroom', creator: 'juniper club', category: 'Indie', bpm: 108, key: 'A maj', price: '$15', color: 'peach', tag: 'STAFF PICK', bars: [25, 45, 30, 18, 40, 28, 47, 21, 37, 17, 44, 29, 38, 20, 47, 32, 22, 39, 17, 45, 29, 36, 20, 42] },
  { id: -4, title: 'Blue Hour', creator: 'sunroom.fm', category: 'Electronic', bpm: 120, key: 'D min', price: '$10', color: 'blue', tag: 'JUST ADDED', bars: [18, 42, 27, 47, 22, 37, 18, 44, 30, 47, 21, 35, 48, 26, 40, 18, 31, 45, 23, 38, 18, 43, 29, 39] },
  { id: -5, title: 'Little Things', creator: 'mila miles', category: 'Hip-hop', bpm: 86, key: 'G min', price: '$9', color: 'butter', tag: 'LOVED', bars: [42, 25, 37, 19, 45, 28, 39, 17, 46, 30, 41, 22, 35, 47, 26, 40, 18, 33, 45, 24, 38, 20, 43, 31] },
  { id: -6, title: 'Off Script', creator: 'lowkey leo', category: 'R&B', bpm: 74, key: 'B min', price: '$11', color: 'rose', tag: 'UNDERGROUND', bars: [25, 36, 18, 46, 32, 20, 41, 27, 48, 22, 34, 17, 42, 29, 38, 19, 46, 30, 22, 40, 26, 48, 31, 18] },
  { id: -7, title: 'Golden', creator: 'ada lune', category: 'Soul', bpm: 98, key: 'E maj', price: '$10', color: 'butter', tag: 'ON REPEAT', bars: [32, 18, 39, 25, 46, 30, 20, 43, 28, 38, 22, 48, 31, 18, 40, 26, 45, 21, 35, 19, 42, 29, 47, 24] },
  { id: -8, title: 'Night Drive', creator: 'atlas bloom', category: 'Electronic', bpm: 114, key: 'G min', price: '$13', color: 'blue', tag: 'FRESH FIND', bars: [19, 40, 27, 45, 21, 36, 48, 25, 41, 18, 32, 46, 23, 39, 29, 17, 44, 30, 47, 20, 35, 25, 42, 31] },
];

function readUser(): User | null {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem('loop-user') || 'null');
    if (typeof stored !== 'object' || stored === null || !('name' in stored) || !('email' in stored) || !('role' in stored) || typeof stored.name !== 'string' || typeof stored.email !== 'string' || stored.role !== 'creator') {
      localStorage.removeItem('loop-user');
      return null;
    }
    return { name: stored.name, email: stored.email, role: stored.role };
  } catch {
    localStorage.removeItem('loop-user');
    return null;
  }
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
  const [user, setUser] = useState<User | null>(null);
  const [uploads, setUploads] = useState<Track[]>([]);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const pathname = usePathname() ?? '/';
  const router = useRouter();

  useEffect(() => {
    setUser(readUser());
    setUploads(readUploads());
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      fetch('/api/admin/session', { cache: 'no-store' }).then(async (response) => {
        if (!response.ok) throw new Error('Your admin session could not be verified. Please sign in again.');
        const session: unknown = await response.json();
        if (typeof session !== 'object' || session === null || !('authenticated' in session) || session.authenticated !== true || !('email' in session) || typeof session.email !== 'string') {
          throw new Error('Your admin session could not be verified. Please sign in again.');
        }
        const adminUser: User = { name: 'Loop Admin', email: session.email, role: 'admin' };
        localStorage.setItem('loop-user', JSON.stringify(adminUser));
        setUser(adminUser);
      }).catch((error: unknown) => {
        localStorage.removeItem('loop-user');
        setUser(null);
        setPlaybackError(error instanceof Error ? error.message : 'Your admin session could not be verified. Please sign in again.');
      }).finally(() => setHasLoadedStorage(true));
    } else {
      setHasLoadedStorage(true);
    }
  }, []);

  useEffect(() => {
    let frame = 0;
    if (pathname === '/' && window.location.hash) {
      frame = window.requestAnimationFrame(() => {
        document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else if (pathname !== '/') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    if (pathname === '/' && user) {
      router.replace(user.role === 'admin' ? '/admin' : '/creator');
    } else if (pathname.startsWith('/creator') && user?.role !== 'creator') {
      router.replace('/');
    } else if (!['/', '/login', '/signup', '/discover'].includes(pathname) && !pathname.startsWith('/creator') && !pathname.startsWith('/admin')) {
      router.replace('/');
    }
  }, [hasLoadedStorage, pathname, router, user]);

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
    if (nextUser.role !== 'creator') return;
    localStorage.setItem('loop-user', JSON.stringify(nextUser));
    setUser(nextUser);
    router.push('/creator');
  }
  function adminLogin(email: string) {
    const nextUser: User = { name: 'Loop Admin', email, role: 'admin' };
    localStorage.setItem('loop-user', JSON.stringify(nextUser));
    setUser(nextUser);
    router.push('/admin');
  }
  async function logout() {
    if (user?.role === 'admin') {
      try {
        const response = await fetch('/api/admin/session', { method: 'DELETE' });
        if (!response.ok) throw new Error('Could not end the admin session. Please try again.');
      } catch (error) {
        setPlaybackError(error instanceof Error ? error.message : 'Could not end the admin session. Please try again.');
        return;
      }
    }
    localStorage.removeItem('loop-user');
    setUser(null);
    router.push('/');
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
    const track = uploads.find((item) => item.id === id);
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
      <audio ref={audioRef} src={playbackUrl ?? undefined} hidden onEnded={() => setPlaying(null)} />
      {playbackError && <div className="playback-error" role="status">{playbackError}<button onClick={() => setPlaybackError('')} aria-label="Dismiss message"><X size={14} /></button></div>}
      {pathname === '/' && !user && <EntryPage />}
      {(pathname === '/login' || pathname === '/signup') && <><LoginHeader /><AuthPage key={pathname} mode={pathname === '/signup' ? 'signup' : 'login'} onSubmit={login} /></>}
      {pathname === '/discover' && <DiscoverPage tracks={[...uploads, ...sampleTracks]} playing={playing} togglePlay={togglePlay} />}
      {pathname === '/admin/login' && <><LoginHeader /><AdminLoginPage onSuccess={adminLogin} /></>}
      {pathname.startsWith('/admin') && pathname !== '/admin/login' && user?.role === 'admin' && <ConsoleLayout user={user} role="admin" onLogout={logout} onSwitchRole={() => login({ ...user, role: 'creator' })} uploadsCount={uploads.length} pathname={pathname}>
        {pathname === '/admin' && <AdminPage tracks={uploads} />}
        {pathname !== '/admin' && <AdminSectionPage section={pathname.split('/')[2] ?? 'overview'} />}
      </ConsoleLayout>}
      {pathname.startsWith('/admin') && pathname !== '/admin/login' && user?.role !== 'admin' && <AdminAccessPage />}
      {user?.role === 'creator' && pathname.startsWith('/creator') && <ConsoleLayout user={user} role="creator" onLogout={logout} onSwitchRole={() => router.push('/admin/login')} uploadsCount={uploads.length} pathname={pathname}>
        {pathname === '/creator' && <CreatorPage user={user} uploads={uploads} onUpload={addUpload} playing={playing} togglePlay={togglePlay} />}
        {pathname === '/creator/releases' && <ArtistContentPage title="Releases" eyebrow="YOUR CATALOG" description="Every release, all in one place." uploads={uploads} />}
        {pathname === '/creator/upload' && <CreatorPage key={pathname} user={user} uploads={uploads} onUpload={addUpload} playing={playing} togglePlay={togglePlay} />}
        {pathname === '/creator/royalties' && <ArtistInfoPage page="royalties" />}
        {pathname === '/creator/payments' && <ArtistInfoPage page="payments" />}
        {pathname === '/creator/pricing' && <PricingPage />}
        {pathname === '/creator/support' && <ArtistInfoPage page="support" />}
        {pathname === '/creator/profile' && <ArtistInfoPage page="profile" user={user} />}
        {pathname === '/creator/chatbot' && <ArtistInfoPage page="chatbot" />}
      </ConsoleLayout>}
    </div>
  );
}

function LoginHeader() {
  return <header className="login-header"><Link className="brand" href="/discover" aria-label="Explore Loop songs"><span className="brand-mark"><AudioLines size={21} strokeWidth={2.2} /></span><span>loop<span className="brand-dot">.</span></span></Link><div className="entry-actions"><BookCallLink /><Link className="button button-dark" href="/login">Log In</Link><Link className="button button-outline" href="/signup">Sign Up</Link></div></header>;
}

function BookCallLink({ entry = false }: { entry?: boolean }) {
  return <a className={`button book-call-button${entry ? ' book-call-entry' : ''}`} href="https://cal.com/karandwip-das-zkmvdd/30min" target="_blank" rel="noopener noreferrer" aria-label="Book a Call">
    <CalendarDays size={15} /> <span>Book a Call</span>
  </a>;
}

function EntryPage() {
  return <main className="entry-page"><section className="entry-card">
    <div className="entry-brand-row">
      <Link className="brand" href="/discover" aria-label="Explore Loop songs"><span className="brand-mark"><AudioLines size={21} /></span><span>loop<span className="brand-dot">.</span></span></Link>
      <span className="entry-vinyl auth-disc" aria-hidden="true"><span /><span /><span /><i><AudioLines size={15} /></i></span>
    </div>
    <span className="entry-label">ARTISTS & LOOP TEAM</span>
    <h1>Welcome to Loop</h1>
    <p>Your home for managing releases, royalties, and distribution.</p>
    <div className="entry-actions"><Link className="button button-dark" href="/login">Log In <ArrowRight size={16} /></Link><Link className="button button-outline" href="/signup">Sign Up <ArrowRight size={16} /></Link></div>
    <div className="entry-book-call"><span>Want to talk through your release plans?</span><BookCallLink entry /></div>
    <div className="entry-team-link">Loop team? <Link href="/admin/login">Admin sign in</Link></div>
    <span className="entry-note">LOOP MUSIC · MADE FOR ARTISTS</span>
  </section></main>;
}

function TrackCard({ track, index, playing, togglePlay }: { track: Track; index: number; playing: number | null; togglePlay: (id: number) => void }) {
  const [liked, setLiked] = useState(false);

  return <article className="track-card" style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}>
    <div className={`track-art art-${track.color}`}>
      <span className="track-tag">{track.tag}</span>
      <div className="cover-wave" aria-hidden="true">{track.bars.map((bar, barIndex) => <span key={barIndex} style={{ height: `${bar}px` }} />)}</div>
      <button className={`play-button${playing === track.id ? ' is-playing' : ''}`} onClick={() => togglePlay(track.id)} aria-label={playing === track.id ? `Pause ${track.title}` : `Play ${track.title}`}>
        {playing === track.id ? <span>Ⅱ</span> : <Play size={16} fill="currentColor" />}
      </button>
    </div>
    <div className="track-info">
      <div><h3>{track.title}</h3><span className="track-creator">by {track.creator}</span></div>
      <button className={`like-button${liked ? ' liked' : ''}`} onClick={() => setLiked((current) => !current)} aria-label={liked ? `Unlike ${track.title}` : `Like ${track.title}`} aria-pressed={liked}>
        <Heart size={17} fill={liked ? 'currentColor' : 'none'} />
      </button>
    </div>
    <div className="track-meta"><span>{track.category}</span><span>·</span><span>{track.bpm} BPM</span><span>·</span><span>{track.key}</span><span className="track-price">{track.price}</span></div>
  </article>;
}

function DiscoverPage({ tracks, playing, togglePlay }: { tracks: Track[]; playing: number | null; togglePlay: (id: number) => void }) {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('All sounds');
  const filteredTracks = tracks.filter((track) => {
    const matchesQuery = `${track.title} ${track.creator} ${track.category}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (genre === 'All sounds' || track.category === genre);
  });

  return <div className="app-shell">
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/discover" aria-label="Explore Loop songs"><span className="brand-mark"><AudioLines size={19} /></span><span>loop<span className="brand-dot">.</span></span></Link>
        <div className="header-actions"><Link className="button button-dark dashboard-return-button" href="/creator"><LayoutDashboard size={15} /> <span>Back to dashboard</span><ArrowRight size={14} /></Link></div>
      </div>
    </header>
    <main>
      <section className="hero section-wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> A NEW HOME FOR INDEPENDENT MUSIC</div>
          <h1>Find your<br />next <span className="serif-word">sound.</span></h1>
          <p className="hero-description">A place for independent artists to share their music and help new audiences find a sound they love.</p>
          <div className="hero-proof"><span className="avatar-stack" aria-hidden="true"><i>J</i><i>M</i><i>A</i><i>K</i></span><span><b>Independent by nature.</b><br />Connected through sound.</span></div>
        </div>
        <div className="hero-art" aria-label="A spinning Loop Music record">
          <span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" />
          <span className="hero-record"><span className="record-groove" /><span className="record-groove groove-two" /><span className="record-groove groove-three" /><span className="record-label"><AudioLines size={22} /><span>LOOP MUSIC</span></span></span>
          <span className="art-sticker"><Sparkles size={15} /> GOOD<br />SOUNDS<br />TRAVEL</span>
          <span className="art-caption"><span>INDEPENDENT SOUND / 001</span><strong>Made to be<br />found.</strong></span>
          <span className="art-note note-one">♪</span><span className="art-note note-two">♫</span>
        </div>
        <div className="hero-bottom-label"><span>ARTISTS FIRST, ALWAYS</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>
      <div className="ticker" aria-label="Independent music for every mood"><div className="ticker-track" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => <Fragment key={index}><span>FIND YOUR NEXT SOUND</span> / INDEPENDENT ARTISTS <span>MADE TO BE DISCOVERED</span> / LOOP MUSIC <span>GOOD SOUND FINDS ITS PEOPLE</span> /</Fragment>)}
      </div></div>
      <section className="sounds-section section-wrap" id="sounds">
        <div className="section-heading">
          <div><div className="eyebrow"><span className="eyebrow-line" /> THE LOOP COLLECTION</div><h2>Sounds worth<br /><span className="serif-word">finding.</span></h2></div>
          <div className="section-heading-aside"><span>Independent music, made by artists<br className="mobile-break" /> building something of their own.</span><span className="results-count">SHOWING <span>{String(filteredTracks.length).padStart(2, '0')}</span> TRACKS</span></div>
        </div>
        <div className="discovery-controls">
          <div className="genre-tabs" role="group" aria-label="Filter songs by genre">
            {['All sounds', ...genres].map((item) => <button key={item} className={genre === item ? 'genre-active' : ''} onClick={() => setGenre(item)}>{item}</button>)}
          </div>
          <div className="search-box"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a sound..." aria-label="Search songs or artists" />{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={13} /></button>}</div>
        </div>
        {filteredTracks.length ? <div className="track-grid">{filteredTracks.map((track, index) => <TrackCard key={track.id} track={track} index={index} playing={playing} togglePlay={togglePlay} />)}</div> : <div className="portal-empty"><Disc3 size={28} /><h2>No sounds found.</h2><p>Try another title, artist, or genre.</p><button className="text-link" onClick={() => { setQuery(''); setGenre('All sounds'); }}>Clear filters <ArrowRight size={15} /></button></div>}
        <div className="browse-footer"><span>GOOD SOUND FINDS ITS PEOPLE.</span><span>MADE FOR ARTISTS, SHARED WITH EVERYONE.</span></div>
      </section>
      <section className="manifesto" id="how-it-works">
        <div className="manifesto-inner section-wrap">
          <div className="manifesto-index eyebrow"><span className="eyebrow-line" /> THE LOOP IDEA / 001</div>
          <div className="manifesto-content"><h2>Music moves<br />when we <span className="serif-word">share it.</span></h2><p>Loop helps independent artists share their music and reach new audiences. Explore new sounds, support the people behind them, and keep good music moving.</p><a className="button button-outline" href="#sounds">Back to the sounds <ArrowRight size={14} /></a></div>
          <div className="manifesto-stamp"><div><AudioLines size={25} /><span>INDEPENDENT<br />BY NATURE</span></div></div>
        </div>
      </section>
      <section className="creator-cta section-wrap">
        <div className="creator-cta-art"><span className="hero-record"><span className="record-groove" /><span className="record-groove groove-two" /><span className="record-label"><AudioLines size={19} /><span>YOUR SOUND</span></span></span></div>
        <div className="creator-cta-copy"><div className="eyebrow"><span className="eyebrow-line" /> FOR THE PEOPLE MAKING MUSIC</div><h2>Make something<br /><span className="serif-word">worth finding.</span></h2><p>Build your artist home on Loop. Upload your music, manage your releases, and let new listeners discover what you make.</p><Link className="button button-dark" href="/signup">Get started <ArrowRight size={14} /></Link></div>
      </section>
      <div className="bottom-note section-wrap"><span>GOOD MUSIC IS OUT THERE. GO FIND IT.</span><span><AudioLines size={12} /> LOOP MUSIC · MADE FOR ARTISTS</span></div>
    </main>
    <footer><div className="footer-inner section-wrap"><Link className="brand" href="/discover" aria-label="Loop Music home"><span className="brand-mark"><AudioLines size={17} /></span><span>loop<span className="brand-dot">.</span></span></Link><span className="footer-line">INDEPENDENT SOUNDS, SHARED EVERYWHERE</span><span className="footer-copy">© LOOP MUSIC</span></div></footer>
  </div>;
}

function AdminAccessPage() {
  return <main className="admin-access-page"><section className="admin-access-card">
    <span className="admin-access-icon"><ShieldCheck size={24} /></span>
    <span className="portal-eyebrow">PRIVATE TEAM CONSOLE</span>
    <h1>Admin access is unavailable</h1>
    <p>The team dashboard is locked until trusted admin authentication is configured. Artist accounts cannot access this area.</p>
    <Link className="button button-dark" href="/">Back to Loop <ArrowRight size={16} /></Link>
  </section></main>;
}

function AdminLoginPage({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message = typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string'
          ? result.error
          : 'Admin sign-in failed. Please try again.';
        setError(message);
        return;
      }
      if (typeof result !== 'object' || result === null || !('authenticated' in result) || result.authenticated !== true || !('email' in result) || typeof result.email !== 'string') {
        setError('The server returned an invalid sign-in response. Please try again.');
        return;
      }
      onSuccess(result.email);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not reach the sign-in service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="admin-login-page section-wrap">
    <div className="admin-login-copy">
      <span className="portal-eyebrow">PRIVATE TEAM CONSOLE</span>
      <h1>Backstage<br /><span className="serif-word">access.</span></h1>
      <p>Sign in with your Loop team credentials to open the admin dashboard.</p>
      <div className="auth-disc" aria-hidden="true"><span /><span /><span /><i><AudioLines size={19} /></i></div>
    </div>
    <form className="auth-form admin-login-form" onSubmit={submit}>
      <div className="admin-access-icon"><ShieldCheck size={23} /></div>
      <div className="form-kicker">LOOP TEAM</div>
      <h2>Admin sign in</h2>
      <label className="field-label">Email address<input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="team@example.com" /></label>
      <label className="field-label">Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your admin password" /></label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="button button-dark auth-submit" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in to team console'} <ArrowRight size={16} /></button>
      <Link className="admin-login-back" href="/">Back to Loop</Link>
    </form>
  </main>;
}

type ConsoleNavItem = { label: string; href: string; icon: React.ReactNode; badge?: number; external?: boolean };
const artistNav: ConsoleNavItem[] = [
  { label: 'Overview', href: '/creator', icon: <LayoutDashboard /> },
  { label: 'Releases', href: '/creator/releases', icon: <Disc3 /> },
  { label: 'Upload release', href: '/creator/upload', icon: <Upload /> },
  { label: 'Royalties', href: '/creator/royalties', icon: <CircleDollarSign /> },
  { label: 'Payments', href: '/creator/payments', icon: <CreditCard /> },
  { label: 'Docs', href: 'https://docs.google.com/document/', icon: <FileText />, external: true },
  { label: 'Chatbot', href: '/creator/chatbot', icon: <Bot /> },
  { label: 'Support', href: '/creator/support', icon: <LifeBuoy /> },
  { label: 'Profile', href: '/creator/profile', icon: <UserRound /> },
];
const adminNav: ConsoleNavItem[] = [
  { label: 'Overview', href: '/admin', icon: <LayoutDashboard /> },
  { label: 'Artists', href: '/admin/artists', icon: <Users /> },
  { label: 'Releases', href: '/admin/releases', icon: <Disc3 /> },
  { label: 'Approvals', href: '/admin/approvals', icon: <BadgeCheck />, badge: 4 },
  { label: 'Metadata', href: '/admin/metadata', icon: <FileText /> },
  { label: 'Distribution', href: '/admin/distribution', icon: <Radio /> },
  { label: 'Royalties', href: '/admin/royalties', icon: <CircleDollarSign /> },
  { label: 'Payouts', href: '/admin/payouts', icon: <Wallet /> },
  { label: 'Pricing', href: '/admin/pricing', icon: <Tags /> },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: <CreditCard /> },
  { label: 'Support tickets', href: '/admin/support-tickets', icon: <Ticket /> },
  { label: 'Staff', href: '/admin/staff', icon: <Building2 /> },
  { label: 'Reports', href: '/admin/reports', icon: <ClipboardList /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings /> },
];

function ConsoleLayout({ user, role, onLogout, onSwitchRole, uploadsCount, pathname, children }: {
  user: User; role: 'creator' | 'admin'; onLogout: () => void; onSwitchRole: () => void; uploadsCount: number; pathname: string; children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const isArtist = role === 'creator';
  const nav = isArtist ? artistNav : adminNav;
  const activeHref = nav.find((item) => item.href === pathname)?.href ?? '';
  const activeLabel = nav.find((item) => item.href === activeHref)?.label ?? pathname.split('/').pop()?.replace(/-/g, ' ') ?? '';
  useEffect(() => { setDrawerOpen(false); }, [pathname]);
  function moveSpotlight(event: React.PointerEvent<HTMLDivElement>) {
    const spotlight = spotlightRef.current;
    if (!spotlight) return;
    spotlight.style.setProperty('--pointer-x', `${event.clientX}px`);
    spotlight.style.setProperty('--pointer-y', `${event.clientY}px`);
    spotlight.style.opacity = '1';
  }
  function hideSpotlight() { if (spotlightRef.current) spotlightRef.current.style.opacity = '0'; }
  return <div className="console-shell" onPointerMove={moveSpotlight} onPointerLeave={hideSpotlight}>
    <div className="console-spotlight" ref={spotlightRef} aria-hidden="true" />
    {drawerOpen && <button className="drawer-scrim" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />}
    <aside className={`console-sidebar ${drawerOpen ? 'drawer-open' : ''}`}>
      <Link className="console-brand" href="/discover" aria-label="Explore Loop songs"><span className="console-brand-icon"><AudioLines size={19} /></span><span>loop<span>.</span></span></Link>
      <div className="sidebar-account"><span className="account-avatar">{user.name.slice(0, 1).toUpperCase()}</span><span><b>{user.name}</b><small>{isArtist ? 'ARTIST ACCOUNT' : 'ADMIN ACCOUNT'}</small></span><button aria-label="Log out" title="Log out" onClick={onLogout}><LogOut size={15} /></button></div>
      <div className="sidebar-label">{isArtist ? 'ARTIST WORKSPACE' : 'ADMIN CONSOLE'}</div>
      <nav className="console-nav" aria-label={`${isArtist ? 'Artist' : 'Admin'} navigation`}>
        {nav.map((item, index) => <Fragment key={item.label}>
          {isArtist && index === 5 && <div className="sidebar-label workspace-label">WORKSPACE</div>}
          {item.external ? <a href={item.href} target="_blank" rel="noreferrer" className="console-nav-link"><span className="nav-icon">{item.icon}</span><span>{item.label}</span><ExternalLink className="external-nav-icon" size={13} /></a> : <Link className={`console-nav-link ${activeHref === item.href ? 'console-nav-active' : ''}`} href={item.href}><span className="nav-icon">{item.icon}</span><span>{item.label}</span>{item.label === 'Releases' && isArtist && <small className="nav-count">{uploadsCount}</small>}{item.badge && <small className="nav-count nav-badge">{item.badge}</small>}</Link>}
        </Fragment>)}
      </nav>
      <div className="sidebar-bottom"><button className="sidebar-switch" onClick={onSwitchRole}>{isArtist ? 'Switch to team console' : 'Artist portal'} <ArrowRight size={14} /></button><Link href="/" className="sidebar-back">Back to Loop <ArrowDownRight size={14} /></Link></div>
    </aside>
    <div className="console-main">
      <header className="console-topbar"><button className="drawer-toggle" aria-label="Open menu" onClick={() => setDrawerOpen(true)}><Menu size={20} /></button><span>{isArtist ? 'ARTIST PORTAL' : 'TEAM CONSOLE'} <i>/</i> {activeLabel.toUpperCase()}</span><div className="topbar-actions"><BookCallLink /><span className="topbar-status"><i /> ALL SYSTEMS SOUND</span><button className="topbar-avatar" aria-label={`Signed in as ${user.name}`}>{user.name.slice(0, 1).toUpperCase()}</button></div></header>
      <div className="console-content">{children}</div>
    </div>
    {chatOpen && <ChatWidget onClose={() => setChatOpen(false)} />}
    <button className="chat-launcher" onClick={() => setChatOpen((open) => !open)} aria-label={chatOpen ? 'Close chatbot' : 'Open chatbot'}>{chatOpen ? <X size={20} /> : <Bot size={20} />}<span>{chatOpen ? 'Close' : 'Chat with Loop'}</span></button>
  </div>;
}

type BotMessage = { text: string; href?: string; linkText?: string };
function getBotAnswer(question: string): BotMessage {
  const text = question.toLowerCase();
  if (/(besides|other|apart|else|additional|beyond|extra|another)/.test(text) && (text.includes('upload') || text.includes('fee') || text.includes('pay'))) {
    return { text: 'No required payment besides the upload fee: it is ₹250 per song at upload, and the 70/30 split applies to royalties only. Artist Pro and Artist Starter are optional annual plans; Loop does not deduct a commission from royalties.' , href: '/creator/payments', linkText: 'View payments' };
  }
  if (text.includes('pro') || text.includes('starter') || text.includes('plan') || text.includes('price')) {
    return { text: 'Artist Pro is an optional ₹2,500/year plan and includes songs never removed after the term, lifetime free Content ID, no assistant deletion, and distribution to 350+ platforms. Artist Starter is an optional ₹1,500/year plan and gives 100% of revenue in the first year. Free keeps 70% of royalties; Loop takes 30%. For the first 2 years, artists keep 100% of revenue, subject to applicable rules.' , href: '/creator/pricing', linkText: 'Compare plans' };
  }
  if (text.includes('royalt') || text.includes('payout') || text.includes('revenue') || text.includes('split')) {
    return { text: 'On Free, you keep 70% of royalties and Loop Music takes 30%. For the first 2 years, artists keep 100% of their revenue, subject to applicable rules. There is no commission deducted from royalties.' , href: '/creator/royalties', linkText: 'View royalties' };
  }
  if (text.includes('upload') || text.includes('song') || text.includes('release')) {
    return { text: 'Upload your release from the Upload release page. The upload fee is ₹250 per song, charged at upload.' , href: '/creator/upload', linkText: 'Upload a release' };
  }
  if (text.includes('distribut') || text.includes('platform') || text.includes('content id')) {
    return { text: 'Artist Pro includes distribution to 350+ platforms, lifetime free Content ID, and songs that are never removed after the term ends.' , href: '/creator/pricing', linkText: 'See Artist Pro' };
  }
  return { text: 'I can help with plans, payouts, uploads, and distribution. What would you like to know?' };
}

function ChatWidget({ onClose }: { onClose: () => void }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<BotMessage[]>([{ text: 'Hi! Ask me about plans, payouts, uploads, or distribution.' }]);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);
  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = question.trim();
    if (!prompt) return;
    setMessages((current) => [...current, { text: `You asked: ${prompt}` }, getBotAnswer(prompt)]);
    setQuestion('');
  }
  return <section className="chat-widget" aria-label="Loop chatbot">
    <header><span className="chat-avatar"><Bot size={17} /></span><span><b>Loop assistant</b><small>Plans, payouts & more</small></span><button onClick={onClose} aria-label="Close chat"><X size={17} /></button></header>
    <div className="chat-messages" ref={listRef}>{messages.map((message, index) => <div key={`${index}-${message.text}`} className={message.text.startsWith('You asked:') ? 'chat-message chat-user' : 'chat-message'}>{message.text}{message.href && <Link href={message.href} className="chat-link">{message.linkText} <ArrowRight size={13} /></Link>}</div>)}</div>
    <form className="chat-input" onSubmit={send}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question..." aria-label="Ask the Loop assistant" /><button aria-label="Send message" type="submit"><Send size={16} /></button></form>
  </section>;
}

function ArtistContentPage({ title, eyebrow, description, uploads }: { title: string; eyebrow: string; description: string; uploads: Track[] }) {
  return <main className="portal-page"><div className="portal-heading"><div><span className="portal-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><Link className="button button-dark" href="/creator/upload"><Plus size={16} /> Upload release</Link></div>
    {uploads.length ? <div className="portal-card release-table">{uploads.map((track) => <div className="release-row" key={track.id}><span className={`mini-art art-${track.color}`}><Music2 size={18} /></span><span><b>{track.title}</b><small>{track.category} · {track.bpm} BPM</small></span><span className="release-status"><i /> LIVE</span><span>{track.creator}</span></div>)}</div> : <div className="portal-card portal-empty"><Disc3 size={28} /><h2>No releases yet</h2><p>Your releases will show here once you upload your first song.</p><Link className="button button-dark" href="/creator/upload"><Upload size={15} /> Upload your first release</Link></div>}
  </main>;
}

function ArtistInfoPage({ page, user }: { page: 'royalties' | 'payments' | 'support' | 'profile' | 'chatbot'; user?: User }) {
  if (page === 'royalties') return <main className="portal-page"><div className="portal-heading"><div><span className="portal-eyebrow">YOUR EARNINGS</span><h1>Royalties</h1><p>Understand your share and keep an eye on your earnings.</p></div></div><div className="info-grid"><InfoCard title="Free plan split" value="70 / 30" detail="Artist keeps 70% of royalties. Loop Music takes 30%." icon={<CircleDollarSign />} /><InfoCard title="First 2 years" value="100%" detail="Artists keep 100% of revenue for the first 2 years, subject to applicable rules." icon={<Sparkles />} /></div><div className="portal-footnote">* Applicable rules include the terms and eligibility requirements for the release, platform, territory, and relevant rights. See the applicable plan and distribution terms for details.</div></main>;
  if (page === 'payments') return <main className="portal-page"><div className="portal-heading"><div><span className="portal-eyebrow">FEES & PAYOUTS</span><h1>Payments</h1><p>Clear terms for every song and every payout.</p></div></div><div className="payment-highlight"><span className="payment-icon"><CreditCard size={22} /></span><span><small>UPLOAD FEE · CHARGED AT UPLOAD</small><strong>₹250 <em>/ song</em></strong></span></div><div className="portal-card policy-list"><p><Check size={16} /> The fee is charged per song when you upload it.</p><p><Check size={16} /> Loop does not deduct a commission from royalties.</p><p><Check size={16} /> On Free, the 70/30 split applies to royalties only.</p><Link href="/creator/pricing" className="portal-inline-link">Compare plans <ArrowRight size={14} /></Link></div></main>;
  if (page === 'profile') return <main className="portal-page"><div className="portal-heading"><div><span className="portal-eyebrow">YOUR ACCOUNT</span><h1>Profile</h1><p>Manage your artist account details.</p></div></div><div className="portal-card profile-card"><span className="profile-large-avatar">{user?.name.slice(0, 1).toUpperCase() ?? 'A'}</span><div><span className="portal-eyebrow">ARTIST</span><h2>{user?.name ?? 'Your profile'}</h2><p>{user?.email}</p></div></div></main>;
  if (page === 'support') return <main className="portal-page"><div className="portal-heading"><div><span className="portal-eyebrow">WE'RE HERE TO HELP</span><h1>Support</h1><p>Need a hand with a release, payout, or distribution?</p></div></div><div className="portal-card support-card"><LifeBuoy size={25} /><div><h2>Talk to the Loop assistant</h2><p>Get quick answers about plans, payouts, uploads, and distribution.</p></div><Link href="/creator/chatbot" className="button button-dark">Open Chatbot <ArrowRight size={15} /></Link><BookCallLink /></div></main>;
  return <main className="portal-page"><div className="portal-heading"><div><span className="portal-eyebrow">LOOP ASSISTANT</span><h1>Chatbot</h1><p>Ask a question about your plan, royalties, uploads, or where your music is distributed.</p></div></div><div className="portal-card portal-empty"><Bot size={30} /><h2>How can I help?</h2><p>Open the floating chat at the bottom-right to ask Loop assistant a question.</p></div></main>;
}

function InfoCard({ title, value, detail, icon }: { title: string; value: string; detail: string; icon: React.ReactNode }) {
  return <article className="info-card"><div className="info-card-top"><span>{title}</span><i>{icon}</i></div><strong>{value}</strong><p>{detail}</p></article>;
}

function PricingPage() {
  return <main className="portal-page"><div className="portal-heading"><div><span className="portal-eyebrow">SIMPLE, ARTIST-FIRST TERMS</span><h1>Plans & pricing</h1><p>Choose the setup that fits your music. Upload fees are separate from royalties.</p></div></div>
    <div className="pricing-callout"><span className="payment-icon"><Upload size={20} /></span><div><small>ONE-TIME UPLOAD FEE</small><strong>₹250 per song</strong><p>Charged when a song is uploaded. No commission is deducted from royalties.</p></div></div>
    <div className="pricing-grid"><article className="pricing-card"><span className="plan-tag">START HERE</span><h2>Free</h2><div className="plan-price">₹0 <small>/ year</small></div><p className="plan-summary">A straightforward start for independent artists.</p><ul><li>Artist keeps 70% of royalties; Loop Music takes 30%.</li><li>For the first 2 years, artists keep 100% of revenue, subject to applicable rules.*</li></ul></article>
      <article className="pricing-card pricing-featured"><span className="plan-tag">MORE FOR YOUR MUSIC</span><h2>Artist Pro</h2><div className="plan-price">₹2,500 <small>/ year</small></div><p className="plan-summary">More protection and reach for your catalog.</p><ul><li>Songs are never removed from any platform after the term ends.</li><li>Lifetime free Content ID.</li><li>The assistant never deletes songs from any platform.</li><li>Distribution to 350+ platforms.</li></ul></article>
      <article className="pricing-card"><span className="plan-tag">YOUR FIRST YEAR</span><h2>Artist Starter</h2><div className="plan-price">₹1,500 <small>/ year</small></div><p className="plan-summary">Keep all of your revenue in year one.</p><ul><li>100% of revenue in the first year.</li></ul></article></div>
    <p className="pricing-footnote">* Applicable rules and eligibility are governed by the current artist plan terms, distribution agreements, rights ownership, platform requirements, territory, taxes, and payout policies. Revenue shares apply to royalties; plan prices are optional annual plan fees.</p>
  </main>;
}

export function AdminSectionPage({ section }: { section: string }) {
  const labels: Record<string, string> = { 'support-tickets': 'Support tickets' };
  const title = labels[section] ?? section.charAt(0).toUpperCase() + section.slice(1);
  return <main className="portal-page"><div className="portal-heading"><div><span className="portal-eyebrow">LOOP TEAM CONSOLE</span><h1>{title}</h1><p>Manage {title.toLowerCase()} across Loop Music.</p></div></div><div className="portal-card portal-empty"><LayoutDashboard size={28} /><h2>{title} workspace</h2><p>This section is ready for team workflows and account data.</p></div></main>;
}

function AuthPage({ mode, onSubmit }: { mode: 'login' | 'signup'; onSubmit: (user: User) => void }) {
  const isSignup = mode === 'signup';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.includes('@')) { setError('Enter a valid email address to continue.'); return; }
    onSubmit({ name: name.trim() || email.split('@')[0], email, role: 'creator' });
  }
  return <main className="auth-page section-wrap">
    <div className="auth-back"><button className="text-link" onClick={() => router.back()}><ArrowLeft size={15} /> Back</button></div>
    <div className="auth-layout"><div className="auth-editorial"><div className="eyebrow"><span className="eyebrow-line" /> YOUR ARTIST SPACE</div><h1>{isSignup ? <>A little more<br />room to <span className="serif-word">create.</span></> : <>Good to<br />have you <span className="serif-word">back.</span></>}</h1><p>{isSignup ? 'Create your artist account to manage releases, royalties, and distribution.' : 'Pick up where the good stuff left off.'}</p><div className="auth-decoration"><div className="auth-disc"><span /><span /><span /><i><AudioLines size={19} /></i></div><span className="auth-note">ARTIST ACCESS — YOUR SOUND STARTS HERE</span></div></div>
      <form className="auth-form" onSubmit={submit}><div className="form-kicker">{isSignup ? 'MAKE YOURSELF AT HOME' : 'STEP BACK INTO THE SOUND'}</div><h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2><p className="form-subtitle">{isSignup ? 'A few details and you’re in.' : 'Enter your email to continue.'}</p>
        {isSignup && <label className="field-label">Your name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="What should we call you?" /></label>}
        <label className="field-label">Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label className="field-label">Password<input required type="password" minLength={6} placeholder="At least 6 characters" /></label>
        {isSignup && <div className="field-label role-label"><span>I’m here as an</span><span className="role-options"><span className="role-selected"><Music2 size={14} />Artist</span></span></div>}
        {error && <div className="form-error">{error}</div>}
        <button className="button button-dark auth-submit" type="submit">{isSignup ? 'Create my account' : 'Log in to Loop'} <ArrowRight size={16} /></button>
        <div className="auth-switch">{isSignup ? 'Already part of the loop?' : 'New around here?'} <Link href={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Make an account'}</Link></div>
        <div className="demo-login"><span>JUST LOOKING AROUND?</span><p>Try a demo space</p><div><button type="button" onClick={() => onSubmit({ name: 'Jamie Artist', email: 'artist@loop.demo', role: 'creator' })}><Music2 size={13} /> Artist</button></div></div>
      </form>
    </div>
  </main>;
}

function CreatorPage({ user, uploads, onUpload, playing, togglePlay }: { user: User; uploads: Track[]; onUpload: (track: Track) => void; playing: number | null; togglePlay: (id: number) => void }) {
  const pathname = usePathname();
  const [showUpload, setShowUpload] = useState(pathname === '/creator/upload');
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
    <div className="artist-plan-shortcut"><span><b>Explore artist plans</b><small>Compare Free, Artist Pro, and Artist Starter.</small></span><Link href="/creator/pricing">View plans <ArrowRight size={14} /></Link></div>
    {showUpload && <form className="upload-panel" onSubmit={submit}><div className="upload-panel-title"><div><span className="form-kicker">NEW RELEASE</span><h2>Put a sound out there.</h2></div><button type="button" className="icon-button" onClick={() => setShowUpload(false)} aria-label="Close upload"><X size={19} /></button></div><div className="upload-fields">    <label className="field-label">Sound title<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give it a name" /></label><label className="field-label">Genre<select value={category} onChange={(event) => setCategory(event.target.value)}>{genres.map((item) => <option key={item}>{item}</option>)}</select></label><label className="field-label">Tempo (BPM)<input type="number" min="40" max="240" value={bpm} onChange={(event) => setBpm(event.target.value)} /></label></div><label className="upload-drop"><Upload size={20} /><span><b>{audioFile ? audioFile.name : 'Choose an audio file'}</b><small>{audioFile ? `${(audioFile.size / (1024 * 1024)).toFixed(1)} MB · ready to publish` : 'MP3, WAV, OGG, M4A, or FLAC · up to 100 MB · optional'}</small></span><input type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.aiff" onChange={(event) => chooseAudio(event.target.files?.[0])} /></label>{uploadError && <p className="upload-error" role="alert">{uploadError}</p>}<p className="upload-fee-note">₹250 per song · charged at upload</p><button className="button button-dark" type="submit">Publish release <ArrowRight size={16} /></button></form>}
    <div className="dashboard-content"><div className="dashboard-list-header"><div><span className="form-kicker">YOUR CATALOG</span><h2>Sounds in the wild</h2></div><button className="filter-button"><SlidersHorizontal size={14} /> All sounds <ChevronDown size={14} /></button></div>{uploads.length ? <div className="creator-track-list">{uploads.map((track) => <div className="creator-track-row" key={track.id}><div className={`mini-art art-${track.color}`}><Music2 size={19} /></div><button className="row-play" onClick={() => togglePlay(track.id)} aria-label="Play sound">{playing === track.id ? 'Ⅱ' : <Play size={13} fill="currentColor" />}</button><div className="row-track-copy"><strong>{track.title}</strong><span>{track.category} · {track.bpm} BPM</span></div><span className="status-pill"><i /> LIVE</span><span className="row-plays">0 PLAYS</span><button className="more-button" aria-label="More options">···</button></div>)}</div> : <div className="creator-empty"><div className="empty-disc"><AudioLines size={24} /></div><div><h3>The first one is the best one.</h3><p>Your catalog’s looking a little quiet. Let’s change that.</p></div><button className="button button-outline" onClick={() => setShowUpload(true)}>Add your first sound <ArrowRight size={15} /></button></div>}</div>
    <div className="creator-tip"><Sparkles size={17} /><div><b>A little studio note</b><span>Good descriptions help your sounds find their people. Tell them what inspired you.</span></div><ArrowRight size={16} /></div>
  </main>;
}
function StatCard({ label, value, trend, icon }: { label: string; value: string; trend: string; icon: React.ReactNode }) { return <div className="stat-card"><div className="stat-top"><span>{label}</span><i>{icon}</i></div><strong>{value}</strong><small>{trend}</small></div>; }

export function AdminPage({ tracks }: { tracks: Track[] }) {
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

export default App;
