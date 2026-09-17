import { useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  ArrowDown,
  Camera,
  ChevronLeft,
  ChevronRight,
  Copy,
  Heart,
  Menu,
  Moon,
  Music2,
  Pause,
  Play,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type Photo = {
  id: string;
  title: string;
  place: string;
  category: 'all' | 'quiet' | 'wild' | 'ordinary';
  src: string;
};

const photos: Photo[] = [
  {
    id: 'morning-light',
    title: 'Morning light',
    place: 'Lisbon, 07:42',
    category: 'quiet',
    src: 'https://images.pexels.com/photos/1025469/pexels-photo-1025469.jpeg?auto=compress&cs=tinysrgb&w=1400',
  },
  {
    id: 'salt-air',
    title: 'Salt air',
    place: 'Cascais, August',
    category: 'wild',
    src: 'https://images.pexels.com/photos/3225531/pexels-photo-3225531.jpeg?auto=compress&cs=tinysrgb&w=1400',
  },
  {
    id: 'slow-sunday',
    title: 'Slow Sunday',
    place: 'At home',
    category: 'ordinary',
    src: 'https://images.pexels.com/photos/3768126/pexels-photo-3768126.jpeg?auto=compress&cs=tinysrgb&w=1400',
  },
  {
    id: 'golden-hour',
    title: 'The golden hour',
    place: 'Somewhere west',
    category: 'wild',
    src: 'https://images.pexels.com/photos/3014019/pexels-photo-3014019.jpeg?auto=compress&cs=tinysrgb&w=1400',
  },
  {
    id: 'two-coffees',
    title: 'Two coffees',
    place: 'Our kitchen, 09:16',
    category: 'ordinary',
    src: 'https://images.pexels.com/photos/1002740/pexels-photo-1002740.jpeg?auto=compress&cs=tinysrgb&w=1400',
  },
];

const timeline = [
  { date: '03 / 18 / 19', title: 'The first hello', copy: 'A crowded room, a borrowed pen, and the strange certainty that I wanted to hear the rest of your story.' },
  { date: '08 / 02 / 20', title: 'The long way home', copy: 'We missed the last train and walked until the city softened around us. I have loved detours ever since.' },
  { date: '11 / 27 / 21', title: 'A little apartment', copy: 'Two mugs, one window, a plant we nearly forgot to water. It felt like a beginning with the lights already on.' },
  { date: '06 / 14 / 23', title: 'The yes of it all', copy: 'Not one enormous moment. A thousand small yeses, quietly adding up to a life I would choose again.' },
];

const reasons = [
  ['01', 'You make the ordinary luminous', 'Even grocery lists feel like little maps to somewhere worth going.'],
  ['02', 'You listen with your whole face', 'The way you look at a story makes people brave enough to finish it.'],
  ['03', 'You are my favourite kind of brave', 'Soft where the world says hard. Honest where it would be easier to perform.'],
  ['04', 'You keep making room', 'For new songs, new people, new plans, and for me to become more myself.'],
];

function Home() {
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<Photo['category']>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(23);
  const [volume, setVolume] = useState(72);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const letterButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('love-story-theme');
    setIsDark(savedTheme === 'dark');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    window.localStorage.setItem('love-story-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('visible')),
      { threshold: 0.14 },
    );
    document.querySelectorAll('.reveal, .stagger').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setProgress(value => (value >= 100 ? 0 : value + 0.5));
    }, 900);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    if (!selectedPhoto) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedPhoto(null);
      if (event.key === 'ArrowRight') movePhoto(1);
      if (event.key === 'ArrowLeft') movePhoto(-1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const filteredPhotos = useMemo(
    () => activeFilter === 'all' ? photos : photos.filter(photo => photo.category === activeFilter),
    [activeFilter],
  );

  const movePhoto = (direction: number) => {
    if (!selectedPhoto) return;
    const currentIndex = photos.findIndex(photo => photo.id === selectedPhoto.id);
    const nextIndex = (currentIndex + direction + photos.length) % photos.length;
    setSelectedPhoto(photos[nextIndex]);
  };

  const scrollToStart = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMenuOpen(false);
  };

  const readLetter = () => {
    if (!('speechSynthesis' in window)) return;
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }
    const reading = new SpeechSynthesisUtterance(
      'You are my favourite place to arrive. I love the life we make in the spaces between big moments.',
    );
    reading.rate = 0.88;
    reading.onend = () => setIsReading(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(reading);
    setIsReading(true);
  };

  const copyLine = async () => {
    try {
      await navigator.clipboard.writeText('You are my favourite place to arrive.');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const navItems = [
    ['The beginning', '#beginning'],
    ['Our days', '#days'],
    ['A few frames', '#frames'],
    ['The letter', '#letter'],
  ];

  return (
    <main className="love-page noise" id="top">
      <header className={`site-header ${headerScrolled ? 'scrolled' : ''}`}>
        <a className="brand-mark" href="#top" onClick={scrollToStart} data-testid="link-home">
          <strong>A Love Story</strong>
          <span>volume one / forever</span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navItems.map(([label, href]) => (
            <a href={href} key={href} data-testid={`link-${href.slice(1)}`}>{label}</a>
          ))}
        </nav>
        <div className="header-tools">
          <button
            className="icon-button"
            type="button"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={() => setIsDark(value => !value)}
            data-testid="button-theme-toggle"
          >
            {isDark ? <Sun size={16} strokeWidth={1.7} /> : <Moon size={16} strokeWidth={1.7} />}
          </button>
          <button
            className="icon-button menu-button"
            type="button"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(value => !value)}
            data-testid="button-mobile-menu"
          >
            {menuOpen ? <X size={17} strokeWidth={1.7} /> : <Menu size={17} strokeWidth={1.7} />}
          </button>
        </div>
      </header>
      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map(([label, href]) => (
            <a href={href} key={href} onClick={() => setMenuOpen(false)} data-testid={`mobile-link-${href.slice(1)}`}>{label}</a>
          ))}
        </nav>
      )}

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-content reveal">
          <div className="eyebrow">An ongoing correspondence</div>
          <h1 id="hero-title">For the one<br />who makes <em>home</em><br />feel like a verb.</h1>
          <p className="hero-intro">This is a small archive of the big, beautiful thing we keep making — one ordinary day at a time.</p>
        </div>
        <div className="hero-stamp" aria-hidden="true">made<br />with<br />all my heart</div>
        <div className="hero-scroll" aria-hidden="true">scroll to wander</div>
      </section>

      <section className="section opening" id="beginning" aria-labelledby="beginning-title">
        <div className="section-inner opening-grid">
          <div className="opening-copy reveal">
            <div className="section-kicker">01 / The beginning</div>
            <h2 className="section-heading" id="beginning-title">It started<br /><em>quietly.</em></h2>
            <p className="body-copy">No grand entrance. No perfectly timed soundtrack. Just you, laughing at something no one else heard, and me realizing that I wanted to be near that sound for a very long time.</p>
          </div>
          <aside className="hand-note reveal" aria-label="A handwritten note">
            <p>“I knew it in the pauses — the comfortable ones, the ones where nothing needed fixing.”</p>
            <small>from the margins of us</small>
          </aside>
        </div>
      </section>

      <section className="section timeline" id="days" aria-labelledby="days-title">
        <div className="section-inner timeline-layout">
          <div className="timeline-intro reveal">
            <div className="section-kicker">02 / The shape of us</div>
            <h2 className="section-heading" id="days-title">A few<br /><em>coordinates.</em></h2>
            <p className="body-copy">The dates are only pins on a map. The real story is everything that happened between them.</p>
          </div>
          <div className="timeline-list stagger">
            {timeline.map(item => (
              <article className="timeline-item" key={item.date} data-testid={`timeline-item-${item.date.replaceAll(' ', '-')}`}>
                <div className="timeline-date">{item.date}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section gallery-section" id="frames" aria-labelledby="frames-title">
        <div className="section-inner">
          <div className="gallery-head reveal">
            <div>
              <div className="section-kicker">03 / Field notes</div>
              <h2 className="section-heading" id="frames-title">The beautiful<br /><em>in-between.</em></h2>
            </div>
            <Camera size={42} strokeWidth={1} color="hsl(var(--primary))" aria-hidden="true" />
          </div>
          <div className="filters" role="group" aria-label="Filter memories">
            {(['all', 'quiet', 'wild', 'ordinary'] as const).map(filter => (
              <button
                type="button"
                className={`filter-button ${activeFilter === filter ? 'active' : ''}`}
                key={filter}
                onClick={() => setActiveFilter(filter)}
                aria-pressed={activeFilter === filter}
                data-testid={`button-filter-${filter}`}
              >
                {filter === 'all' ? 'All frames' : filter}
              </button>
            ))}
          </div>
          <div className="gallery-grid reveal" style={{ marginTop: '1.2rem' }}>
            {filteredPhotos.map(photo => (
              <button
                className="gallery-item"
                type="button"
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                aria-label={`Open photo: ${photo.title}`}
                data-testid={`button-photo-${photo.id}`}
              >
                <img src={photo.src} alt={photo.title} loading="lazy" />
                <span className="gallery-caption">
                  <strong>{photo.title}</strong>
                  <span>{photo.place}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section quote-section" aria-label="A love note">
        <div className="section-inner quote-wrap reveal">
          <div className="section-kicker">04 / The thesis</div>
          <p className="quote-text">“I would find you in every <em>lifetime</em>, and I would still take the long way home.”</p>
          <div className="quote-meta">a promise, written in the margins</div>
        </div>
      </section>

      <section className="section reasons" aria-labelledby="reasons-title">
        <div className="section-inner reasons-layout">
          <div className="reveal">
            <div className="section-kicker">05 / Evidence</div>
            <h2 className="section-heading" id="reasons-title">Why you,<br /><em>always.</em></h2>
          </div>
          <div className="reasons-list stagger">
            {reasons.map(([index, title, copy]) => (
              <article className="reason" key={index}>
                <div className="reason-index">{index}</div>
                <div><h3>{title}</h3><p>{copy}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section letter-section" id="letter" aria-labelledby="letter-title">
        <div className="section-inner">
          <div className="letter reveal">
            <div className="letter-aside">
              <div>
                <div className="section-kicker">06 / In plain words</div>
                <h2 id="letter-title">A letter<br />for you.</h2>
              </div>
              <small>keep this somewhere close</small>
            </div>
            <div className="letter-body">
              <p>My love,</p>
              <p>I hope you know that I notice it all: the way you leave the last bite for me, the little dance you do when a song catches you off guard, the courage it takes to remain tender.</p>
              <p>Thank you for making a life that feels less like a destination and more like a conversation. I am still listening. I am still choosing you. I will keep choosing you.</p>
              <p className="letter-sign">Always yours,</p>
              <div className="letter-actions">
                <button className="text-button filled" type="button" onClick={readLetter} ref={letterButtonRef} data-testid="button-read-letter">
                  {isReading ? <Pause size={14} /> : <Play size={14} />}
                  {isReading ? 'Pause reading' : 'Read this aloud'}
                </button>
                <button className="text-button" type="button" onClick={copyLine} data-testid="button-copy-line">
                  <Copy size={14} /> {copied ? 'Copied' : 'Keep one line'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div>
          <div className="footer-wordmark">A Love Story</div>
          <div className="eyebrow" style={{ marginTop: '1.4rem' }}><Heart size={12} fill="currentColor" /> still unfolding</div>
        </div>
        <p className="footer-note">Made for one extraordinary person.<br />No ending planned.</p>
      </footer>

      <aside className="music-dock" aria-label="Music player">
        <button
          className="music-button"
          type="button"
          aria-label={isPlaying ? 'Pause soundtrack' : 'Play soundtrack'}
          onClick={() => setIsPlaying(value => !value)}
          data-testid="button-music-toggle"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <div className="music-info">
          <span className="music-label"><Music2 size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} /> soundtrack / side a</span>
          <span className="music-title">The way you look at me</span>
          <input className="music-progress" type="range" min="0" max="100" value={progress} onChange={event => setProgress(Number(event.target.value))} aria-label="Track progress" data-testid="input-music-progress" />
        </div>
        <label aria-label="Soundtrack volume">
          {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
          <input className="volume" type="range" min="0" max="100" value={volume} onChange={event => setVolume(Number(event.target.value))} aria-label="Volume" data-testid="input-music-volume" />
        </label>
      </aside>

      {selectedPhoto && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={selectedPhoto.title} onClick={() => setSelectedPhoto(null)}>
          <button className="icon-button lightbox-close" type="button" onClick={() => setSelectedPhoto(null)} aria-label="Close photo preview" data-testid="button-close-lightbox">
            <X size={19} />
          </button>
          <button className="icon-button" type="button" onClick={event => { event.stopPropagation(); movePhoto(-1); }} aria-label="Previous photo" style={{ position: 'absolute', left: '1.2rem', color: '#f8f0e5' }} data-testid="button-previous-photo">
            <ChevronLeft size={20} />
          </button>
          <figure className="lightbox-figure" onClick={event => event.stopPropagation()}>
            <img src={selectedPhoto.src} alt={selectedPhoto.title} />
            <figcaption>{selectedPhoto.title} / {selectedPhoto.place}</figcaption>
          </figure>
          <button className="icon-button" type="button" onClick={event => { event.stopPropagation(); movePhoto(1); }} aria-label="Next photo" style={{ position: 'absolute', right: '1.2rem', color: '#f8f0e5' }} data-testid="button-next-photo">
            <ChevronRight size={20} />
          </button>
        </div>
      )}
      <a className="sr-only" href="#top">Back to beginning <ArrowDown size={1} /></a>
    </main>
  );
}

function Router() {
  return (
    <ErrorBoundary resetKey={useLocation()[0]}>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;