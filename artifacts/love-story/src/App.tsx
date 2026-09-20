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
  Plus,
  Pencil,
  Save,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const storyApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const storyApiUrl = `${storyApiBaseUrl}/api/story`;

type Photo = {
  id: string;
  title: string;
  place: string;
  category: 'moments' | 'memories' | 'forever';
  src: string;
  description: string;
};

const initialPhotos: Photo[] = [
  {
    id: 'lotus-flower',
    title: 'A quiet bloom',
    place: 'A moment worth keeping',
    category: 'moments',
    src: '/lotus-flower.jpg',
    description: 'A little stillness, held in one frame.',
  },
];

type TimelineItem = { date: string; title: string; copy: string };
type StoryPayload = { photos: Photo[]; coordinates: TimelineItem[] };

const initialTimeline: TimelineItem[] = [
  { date: '03 / 18 / 19', title: 'The first hello', copy: 'A crowded room, a borrowed pen, and the strange certainty that I wanted to hear the rest of your story.' },
];

const reasons = [
  ['01', 'You make distance feel smaller', 'No matter how busy the day gets, a few words from you always make me feel closer.'],
  ['02', 'You listen with your whole face', 'The way you look at a story makes people brave enough to finish it.'],
  ['03', 'You are my favourite kind of brave', 'Soft where the world says hard. Honest where it would be easier to perform.'],
  ['04', 'You keep making room', 'For new songs, new people, new plans, and for me to become more myself.'],
  ['05', 'You make me smile without trying', 'A photo, a sticker, or even a short text from you can brighten my whole day.'],

];

const archiveVersion = 'single-static-record-v1';

function readStored<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) as T : fallback;
  } catch {
    return fallback;
  }
}

async function saveStory(payload: StoryPayload): Promise<void> {
  const response = await fetch(storyApiUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Story save failed: ${response.status}`);
}

function readInitialArchive<T>(key: string, fallback: T): T {
  if (window.localStorage.getItem('love-story-archive-version') !== archiveVersion) {
    window.localStorage.removeItem('love-story-photos');
    window.localStorage.removeItem('love-story-timeline');
    window.localStorage.setItem('love-story-archive-version', archiveVersion);
    return fallback;
  }
  return readStored(key, fallback);
}

function Home() {
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | Photo['category']>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(23);
  const [volume, setVolume] = useState(72);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isStoryLoading, setIsStoryLoading] = useState(true);
  const [photos, setPhotos] = useState<Photo[]>(() => readInitialArchive('love-story-photos', initialPhotos));
  const [timeline, setTimeline] = useState<TimelineItem[]>(() => readInitialArchive('love-story-timeline', initialTimeline));
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [isAddingFeeling, setIsAddingFeeling] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [actionDate, setActionDate] = useState<string | null>(null);
  const [showMusic, setShowMusic] = useState(true);
  const [photoForm, setPhotoForm] = useState({ title: '', place: '', description: '', category: 'moments' as Photo['category'], src: '' });
  const [feelingForm, setFeelingForm] = useState({ date: '', title: '', copy: '' });
  const photoInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const letterButtonRef = useRef<HTMLButtonElement>(null);
  const hasLoadedFromApi = useRef(false);

  useEffect(() => { window.localStorage.setItem('love-story-photos', JSON.stringify(photos)); }, [photos]);
  useEffect(() => { window.localStorage.setItem('love-story-timeline', JSON.stringify(timeline)); }, [timeline]);

  useEffect(() => {
    let cancelled = false;
    const loadStory = async () => {
      try {
        const response = await fetch(storyApiUrl, { signal: AbortSignal.timeout(1200) });
        if (!response.ok) throw new Error(`Story request failed: ${response.status}`);
        const stored = await response.json() as StoryPayload;
        if (cancelled) return;
        if (stored.photos.length || stored.coordinates.length) {
          setPhotos(stored.photos);
          setTimeline(stored.coordinates);
        } else {
          await saveStory({ photos, coordinates: timeline }).catch(() => undefined);
        }
      } catch {
        // Local storage remains the offline fallback when the API is unavailable.
      } finally {
        if (!cancelled) {
          hasLoadedFromApi.current = true;
          setIsStoryLoading(false);
        }
      }
    };
    void loadStory();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!hasLoadedFromApi.current) return;
    void saveStory({ photos, coordinates: timeline }).catch(() => undefined);
  }, [photos, timeline]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      void audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

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
    [activeFilter, photos],
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

  const openPhotoForm = () => { setPhotoForm({ title: '', place: '', description: '', category: 'moments', src: '' }); setIsAddingPhoto(true); };
  const handlePhotoFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoForm(form => ({ ...form, src: String(reader.result) }));
    reader.readAsDataURL(file);
  };
  const addPhoto = (event: React.FormEvent) => {
    event.preventDefault();
    if (!photoForm.src || !photoForm.title.trim()) return;
    const photo: Photo = { ...photoForm, id: `local-${Date.now()}`, title: photoForm.title.trim(), place: photoForm.place.trim() || 'From our archive', description: photoForm.description.trim() || 'A moment worth keeping.' };
    setPhotos(current => [...current, photo]);
    setIsAddingPhoto(false);
  };
  const addFeeling = (event: React.FormEvent) => {
    event.preventDefault();
    if (!feelingForm.date.trim() || !feelingForm.title.trim() || !feelingForm.copy.trim()) return;
    setTimeline(current => [...current, { date: feelingForm.date.trim(), title: feelingForm.title.trim(), copy: feelingForm.copy.trim() }]);
    setFeelingForm({ date: '', title: '', copy: '' });
    setIsAddingFeeling(false);
  };
  const updateTimeline = (oldDate: string, event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setTimeline(current => current.map(item => item.date === oldDate ? { date: String(form.get('date')), title: String(form.get('title')), copy: String(form.get('copy')) } : item));
    setEditingDate(null);
    setActionDate(null);
  };
  const deleteTimeline = (date: string) => {
    setTimeline(current => current.filter(item => item.date !== date));
    setActionDate(null);
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
          <h1 id="hero-title">Before U<br />They were just days <em>With you</em><br />they became memories.</h1>
          <p className="hero-intro">This is our story — written through messages, laughter, waiting, and all the moments in between.</p>
        </div>
        <div className="hero-stamp" aria-hidden="true">made<br />with<br />all my heart</div>
        <div className="hero-scroll" aria-hidden="true">scroll to wander</div>
      </section>

      <section className="section opening" id="beginning" aria-labelledby="beginning-title">
        <div className="section-inner opening-grid">
          <div className="opening-copy reveal">
            <div className="section-kicker">01 / The beginning</div>
            <h2 className="section-heading" id="beginning-title">It started<br /><em>quietly.</em></h2>
            <p className="body-copy">Who knew a simple "Hi" could become thousands of messages, countless smiles, and one of the best parts of my life?</p>
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
          <div className={`timeline-list stagger ${isStoryLoading ? 'loading-list' : ''}`}>
            {isStoryLoading ? <div className="story-skeleton-list" aria-label="Loading coordinates"><div className="story-skeleton timeline-skeleton" /><div className="story-skeleton timeline-skeleton" /></div> : timeline.map(item => (
              <article className="timeline-item" key={item.date} data-testid={`timeline-item-${item.date.replaceAll(' ', '-')}`}>
                {editingDate === item.date ? <form className="inline-edit" onSubmit={event => updateTimeline(item.date, event)}><input name="date" defaultValue={item.date} aria-label="Feeling date" /><input name="title" defaultValue={item.title} aria-label="Feeling title" /><textarea name="copy" defaultValue={item.copy} aria-label="Feeling description" rows={3} /><button className="text-button filled" type="submit"><Save size={14} /> Save</button></form> : <><div className="timeline-date">{item.date}</div><div><div className="timeline-title-row"><h3>{item.title}</h3><button className="edit-row-button" type="button" onClick={() => setActionDate(actionDate === item.date ? null : item.date)} aria-expanded={actionDate === item.date}>Edit</button>{actionDate === item.date && <span className="row-actions"><button className="mini-button" type="button" onClick={() => setEditingDate(item.date)} aria-label={`Edit ${item.title}`}><Pencil size={14} /></button><button className="mini-button danger" type="button" onClick={() => deleteTimeline(item.date)} aria-label={`Delete ${item.title}`}><Trash2 size={14} /></button></span>}</div><p>{item.copy}</p></div></>}
              </article>
            ))}
            <button className="add-entry-button" type="button" onClick={() => setIsAddingFeeling(true)}><Plus size={16} /> Add a feeling</button>
            {isAddingFeeling && <form className="entry-form" onSubmit={addFeeling}><div className="form-heading">Add a feeling</div><input value={feelingForm.date} onChange={event => setFeelingForm({ ...feelingForm, date: event.target.value })} placeholder="Date, e.g. 09 / 20 / 26" aria-label="New feeling date" /><input value={feelingForm.title} onChange={event => setFeelingForm({ ...feelingForm, title: event.target.value })} placeholder="A small title" aria-label="New feeling title" /><textarea value={feelingForm.copy} onChange={event => setFeelingForm({ ...feelingForm, copy: event.target.value })} placeholder="What do you want to remember?" aria-label="New feeling description" rows={3} /><div className="form-actions"><button className="text-button filled" type="submit"><Save size={14} /> Add feeling</button><button className="text-button" type="button" onClick={() => setIsAddingFeeling(false)}>Cancel</button></div></form>}
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
            <button className="add-photo-button" type="button" onClick={openPhotoForm} aria-label="Add a photo"><Camera size={32} strokeWidth={1} /><Plus size={15} /></button>
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoFile} hidden />
          {isAddingPhoto && <form className="photo-form" onSubmit={addPhoto}><div className="form-heading">Add a frame</div><button className="upload-dropzone" type="button" onClick={() => photoInputRef.current?.click()}>{photoForm.src ? <img src={photoForm.src} alt="Selected preview" /> : <><Plus size={20} /><span>Choose a photo</span></>}</button><input value={photoForm.title} onChange={event => setPhotoForm({ ...photoForm, title: event.target.value })} placeholder="Photo title" aria-label="Photo title" /><input value={photoForm.place} onChange={event => setPhotoForm({ ...photoForm, place: event.target.value })} placeholder="Place or little detail" aria-label="Photo place" /><textarea value={photoForm.description} onChange={event => setPhotoForm({ ...photoForm, description: event.target.value })} placeholder="What should this photo remember?" aria-label="Photo description" rows={3} /><select value={photoForm.category} onChange={event => setPhotoForm({ ...photoForm, category: event.target.value as Photo['category'] })} aria-label="Photo collection"><option value="moments">Moments</option><option value="memories">Memories</option><option value="forever">Forever</option></select><div className="form-actions"><button className="text-button filled" type="submit"><Save size={14} /> Add photo</button><button className="text-button" type="button" onClick={() => setIsAddingPhoto(false)}>Cancel</button></div></form>}
          <div className="filters" role="group" aria-label="Filter memories">
            {(['all', 'moments', 'memories', 'forever'] as const).map(filter => (
              <button
                type="button"
                className={`filter-button ${activeFilter === filter ? 'active' : ''}`}
                key={filter}
                onClick={() => setActiveFilter(filter)}
                aria-pressed={activeFilter === filter}
                data-testid={`button-filter-${filter}`}
              >
                {filter === 'all' ? 'All' : filter[0].toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
          <div className="gallery-grid reveal" style={{ marginTop: '1.2rem' }}>
            {isStoryLoading ? <div className="story-skeleton-grid" aria-label="Loading photos"><div className="story-skeleton photo-skeleton" /></div> : filteredPhotos.map(photo => (
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
          <p className="quote-text">“Even in a crowded world of <em>billions</em>, my heart would still recognize yours.”</p>
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
              <p>I still remember your message on Facebook. It was just a simple conversation, but somehow it stayed in my mind. Then one day, without me even asking, you shared your phone number. After that, you disappeared from Facebook within a couple of days.</p>
              <p>Sometimes you got angry over a few words, and sometimes I did too. But somehow, after every misunderstanding, one of us would text first and the conversation would continue. Some days you messaged me first, some days I messaged you first, but neither of us let the silence stay for too long.</p>
              <p>Looking back now, I realize it was never just about the messages. It was about having someone whose notification could change my mood, someone whose words I looked for throughout the day, and someone who slowly became an important part of my life.
</p>
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

      <audio ref={audioRef} src="/love-story-soundtrack.mp3" loop preload="metadata" onEnded={() => setIsPlaying(false)} />
      {showMusic && <aside className="music-dock" aria-label="Music player">
        <button className="music-close" type="button" onClick={() => { setIsPlaying(false); setShowMusic(false); }} aria-label="Close music player"><X size={14} /></button>
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
      </aside>}

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
            <figcaption>{selectedPhoto.title} / {selectedPhoto.place}<span className="lightbox-description">{selectedPhoto.description}</span></figcaption>
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