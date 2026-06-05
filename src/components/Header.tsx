import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, LogIn, LogOut } from 'lucide-react';
import { useSession } from '../lib/session';
import SignInOverlay from './SignInOverlay';

const primaryNav = [
  { path: '/exchange', label: 'Exchange', emoji: '💱' },
  { path: '/', label: 'Collective', emoji: '🌐' },
  { path: '/flow', label: 'Flow', emoji: '♾️' },
];

const secondaryNav = [
  { path: '/charter', label: 'Charter' },
  { path: '/codes', label: 'Codes' },
  { path: '/privacy', label: 'Privacy' },
];

export default function Header() {
  const location = useLocation();
  const { user, signedIn, signOut } = useSession();
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <header className="relative z-50">
      <{/* Session bar — profile corner */}
      <div className="absolute top-3 right-4 flex items-center gap-2 z-[60]">
        {signedIn ? (
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold-400/20 bg-gold-400/5 hover:bg-gold-400/10 transition-all"
            >
              <span className="text-sm text-gold-300">{user?.emoji || '✦'}</span>
              <span className="text-xs text-lavender/80 hidden sm:inline">{user?.name}</span>
            </Link>
            <button
              onClick={signOut}
              className="p-1.5 rounded-full border border-lavender/10 text-lavender/40 hover:text-lavender/70 hover:border-lavender/20 transition-all"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSignIn(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-lavender/10 text-lavender/60 hover:text-lavender hover:border-lavender/30 transition-all text-sm"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>

      {/* Top bar with sigil + title */}
      <div className="pt-8 pb-4 px-4 text-center">
        <Link
          to="/"
          className="inline-block mb-4 group"
          aria-label="Heartlight Collective Home"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-32 h-32 mx-auto flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
            <img
              src="/logo-transparent.png"
              alt="Heartlight Collective"
              className="w-28 h-28 object-contain breathing-glow"
            />
          </div>
        </Link>

        <Link
          to="/"
          className="block"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <h1 className="font-serif text-3xl md:text-4xl text-gold-shimmer tracking-wide">
            Heartlight Collective
          </h1>
        </Link>

        <p className="mt-2 text-lavender/80 text-sm md:text-base italic font-serif">
          Where resonant beings co-create across the Heartlines
        </p>
      </div>

      {/* Primary Nav: Exchange / Collective / Flow */}
      <nav className="px-4 pb-2">
        <div className="max-w-2xl mx-auto flex justify-center gap-3">
          {primaryNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  px-5 py-2.5 rounded-full text-sm font-medium tracking-wide
                  transition-all duration-300 border
                  ${
                    isActive
                      ? 'border-gold-400/60 bg-gold-400/10 text-gold-300'
                      : 'border-magenta-500/20 text-lavender/70 hover:border-magenta-500/40 hover:text-lavender hover:bg-magenta-500/5'
                  }
                `}
              >
                {item.label} {item.emoji}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Secondary Nav: Charter / Codes / Privacy */}
      <nav className="px-4 pb-4">
        <div className="max-w-2xl mx-auto flex justify-center gap-2">
          {secondaryNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  px-3 py-1.5 rounded-full text-xs tracking-wide
                  transition-all duration-300 border
                  ${
                    isActive
                      ? 'border-gold-400/40 bg-gold-400/10 text-gold-300'
                      : 'border-white/8 text-lavender/40 hover:border-white/15 hover:text-lavender/60 hover:bg-white/3'
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <SignInOverlay open={showSignIn} onClose={() => setShowSignIn(false)} />
    </header>
  );
}
