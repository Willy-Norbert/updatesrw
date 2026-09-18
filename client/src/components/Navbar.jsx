import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Bookmark, Folder, Hash, Moon, PenLine, Search, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAuthModal } from '../context/AuthModalContext';
import api from '../services/api';
import Avatar from './Avatar';

function ThemeSwitch({ theme, onToggle }) {
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      <Sun className="theme-icon theme-icon-sun" size={12} />
      <Moon className="theme-icon theme-icon-moon" size={12} />
      <span className="theme-knob">{dark ? <Moon size={13} /> : <Sun size={13} />}</span>
    </button>
  );
}

export default function Navbar() {
  const { user, logout, isEditor, isAdmin } = useAuth();
  const { openAuth } = useAuthModal();
  const { toggleTheme, theme } = useTheme();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointer(event) {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  useEffect(() => {
    function onPointer(event) {
      if (!searchRef.current?.contains(event.target)) setPreviewOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setPreview(null);
      setPreviewLoading(false);
      return undefined;
    }

    let cancelled = false;
    setPreviewLoading(true);
    const timer = setTimeout(() => {
      api
        .get('/search', { params: { q: term } })
        .then(({ data }) => {
          if (cancelled) return;
          setPreview(data.data);
          setPreviewOpen(true);
        })
        .catch(() => {
          if (!cancelled) setPreview(null);
        })
        .finally(() => {
          if (!cancelled) setPreviewLoading(false);
        });
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q]);

  function goToSearch(term = q) {
    const value = term.trim();
    if (!value) return;
    setPreviewOpen(false);
    navigate(`/search?q=${encodeURIComponent(value)}`);
  }

  function onSearch(event) {
    event.preventDefault();
    goToSearch();
  }

  const posts = preview?.posts || [];
  const people = preview?.users || [];
  const hashtags = preview?.hashtags || [];
  const categories = preview?.categories || [];
  const hasMatches = posts.length || people.length || hashtags.length || categories.length;
  const showPreview = previewOpen && q.trim().length >= 2;

  return (
    <header className="masthead">
      <div className="masthead-inner">
        <Link to="/" className="masthead-logo">
          <img
            src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
            alt="Updaterw"
            className="logo-img logo-img-full"
          />
          <img
            src={theme === 'dark' ? '/logo-small-dark.png' : '/logo-small-light.png'}
            alt="Updaterw"
            className="logo-img logo-img-small"
          />
        </Link>

        <form onSubmit={onSearch} className="masthead-search" ref={searchRef}>
          <label className="search-box">
            <Search size={16} />
            <input
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                setPreviewOpen(true);
              }}
              onFocus={() => {
                if (q.trim().length >= 2) setPreviewOpen(true);
              }}
              placeholder="Search posts, people, tools"
              aria-label="Search posts, people, tools"
              aria-autocomplete="list"
              aria-expanded={showPreview}
            />
          </label>
          {showPreview ? (
            <div className="search-preview" role="listbox">
              {previewLoading && !preview ? (
                <div className="search-preview-empty">Searching…</div>
              ) : null}
              {!previewLoading && preview && !hasMatches ? (
                <div className="search-preview-empty">No matches for “{q.trim()}”</div>
              ) : null}
              {people.length ? (
                <div className="search-preview-group">
                  <div className="search-preview-label">People</div>
                  {people.slice(0, 4).map((person) => (
                    <Link
                      key={person.id}
                      to={`/u/${person.username}`}
                      className="search-preview-item"
                      onClick={() => setPreviewOpen(false)}
                    >
                      <Avatar user={person} size={28} />
                      <span>
                        <b>{person.fullName}</b>
                        <span className="search-preview-meta">@{person.username}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
              {posts.length ? (
                <div className="search-preview-group">
                  <div className="search-preview-label">Posts</div>
                  {posts.slice(0, 5).map((post) => (
                    <Link
                      key={post.id}
                      to={`/posts/${post.id}`}
                      className="search-preview-item"
                      onClick={() => setPreviewOpen(false)}
                    >
                      <span className="search-preview-icon">
                        <Search size={14} />
                      </span>
                      <span>
                        <b>{post.title}</b>
                        {post.excerpt ? <span className="search-preview-meta">{post.excerpt}</span> : null}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
              {hashtags.length ? (
                <div className="search-preview-group">
                  <div className="search-preview-label">Hashtags</div>
                  {hashtags.slice(0, 4).map((tag) => (
                    <Link
                      key={tag.id}
                      to={`/hashtag/${tag.name}`}
                      className="search-preview-item"
                      onClick={() => setPreviewOpen(false)}
                    >
                      <span className="search-preview-icon">
                        <Hash size={14} />
                      </span>
                      <span>
                        <b>#{tag.name}</b>
                        <span className="search-preview-meta">{tag._count?.posts ?? 0} posts</span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
              {categories.length ? (
                <div className="search-preview-group">
                  <div className="search-preview-label">Categories</div>
                  {categories.slice(0, 4).map((category) => (
                    <Link
                      key={category.id}
                      to={`/category/${category.slug}`}
                      className="search-preview-item"
                      onClick={() => setPreviewOpen(false)}
                    >
                      <span className="search-preview-icon">
                        <Folder size={14} />
                      </span>
                      <span>
                        <b>{category.name}</b>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
              <button type="button" className="search-preview-all" onClick={() => goToSearch()}>
                See all results for “{q.trim()}”
              </button>
            </div>
          ) : null}
        </form>

        <nav className="masthead-actions">
          <NavLink to="/explore" className={({ isActive }) => `masthead-link hide-sm${isActive ? ' is-active' : ''}`}>
            Explore
          </NavLink>
          {user ? (
            <>
              <Link to="/write" className="btn masthead-write">
                <PenLine size={15} />
                Write
              </Link>
              <Link to="/notifications" className="icon-btn" aria-label="Notifications">
                <Bell size={18} />
              </Link>
              <Link to="/bookmarks" className="icon-btn hide-sm" aria-label="Bookmarks">
                <Bookmark size={18} />
              </Link>
              <ThemeSwitch theme={theme} onToggle={toggleTheme} />
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  className="icon-btn icon-btn-avatar"
                  onClick={() => setOpen((v) => !v)}
                  aria-label="Account menu"
                  aria-expanded={open}
                >
                  <Avatar user={user} size={28} />
                </button>
                {open ? (
                  <div className="menu-panel absolute right-0 top-11 w-52 bg-[var(--surface)] border border-[var(--border)] p-2 z-50">
                    <Link className="block px-2 py-2" to={`/u/${user.username}`} onClick={() => setOpen(false)}>
                      Profile
                    </Link>
                    <Link className="block px-2 py-2" to="/settings" onClick={() => setOpen(false)}>
                      Settings
                    </Link>
                    {isAdmin ? (
                      <Link className="block px-2 py-2" to="/admin" onClick={() => setOpen(false)}>
                        Admin
                      </Link>
                    ) : null}
                    {isEditor && !isAdmin ? (
                      <Link className="block px-2 py-2" to="/editor" onClick={() => setOpen(false)}>
                        Editor desk
                      </Link>
                    ) : null}
                    {isAdmin ? (
                      <Link className="block px-2 py-2" to="/editor" onClick={() => setOpen(false)}>
                        Editor desk
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className="block w-full text-left px-2 py-2"
                      onClick={() => {
                        setOpen(false);
                        logout();
                        navigate('/');
                      }}
                    >
                      Log out
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <button type="button" className="btn masthead-write" onClick={() => openAuth({ view: 'welcome' })}>
                Get started
              </button>
              <ThemeSwitch theme={theme} onToggle={toggleTheme} />
            </>
          )}
        </nav>
      </div>
      <div className="rule-green" />
    </header>
  );
}
