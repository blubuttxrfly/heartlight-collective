import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Shield, ChevronDown, Heart, Globe, Infinity } from 'lucide-react';
import { useSession } from '../lib/session';
import SignInOverlay from './SignInOverlay';

const primaryNav = [
  { path: '/exchange', label: 'Exchange', icon: Heart, hue: 'gold' },
  { path: '/', label: 'Collective', icon: Globe, hue: 'magenta' },
  { path: '/flow', label: 'Flow', icon: Infinity, hue: 'lavender' },
];

const secondaryNav = [
  { path: '/charter', label: 'Charter' },
  { path: '/codes', label: 'Codes' },
  { path: '/privacy', label: 'Privacy' },
];

/** Detect if this browser has created a profile (any queue) */
function getLocalProfile(): any | null {
  try {
    const all = [
      ...(JSON.parse(localStorage.getItem('hlc_pending') || '[]')),
      ...(JSON.parse(localStorage.getItem('hlc_approved') || '[]')),
      ...(JSON.parse(localStorage.getItem('hlc_returned') || '[]')),
    ];
    return all.length > 0 ? all[0] : null;
  } catch {
    return null;
  }
}

export default function Header() {
  const location = useLocation();
  const { user, signedIn, signOut } = useSession();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const localProfile = getLocalProfile();
  const hasProfile = !!localProfile;
  const isSteward = signedIn && user?.ces === '111111111';
  const sessionEmoji = signedIn ? (localProfile?.emoji || '✦') : (localProfile?.emoji || '✦');

  return (
    <header className="relative z-50">
      {/* ── Upper Right: Profile / Join / Sign In ── */}
      <div className="absolute top-3 right-4 z-[60]">
        {signedIn ? (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-full border border-gold-400/20 bg-gold-400/5 hover:bg-gold-400/10 transition-all"
            >
              <span className="w-7 h-7 rounded-full bg-void-900 border border-lavender/10 flex items-center justify-center text-sm">
                {sessionEmoji}
              </span>
              <span className="text-xs text-lavender/80 hidden sm:inline max-w-[100px] truncate">{user?.name}</span>
              <ChevronDown className="w-3 h-3 text-lavender/40" />
              {isSteward && <Shield className="w-3 h-3 text-gold-400" />}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-lavender/10 bg-void-900 shadow-xl overflow-hidden"
                onMouseLeave={() => setShowDropdown(false)}
              >
                <div className="px-4 py-3 border-b border-lavender/5">
                  <p className="text-xs text-lavender/50">C.E.S.</p>
                  <p className="text-sm text-gold-300 font-mono">{user?.ces}</p>
                </div>
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-lavender/70 hover:text-cream hover:bg-white/5 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  My Profile
                </Link>
                <Link
                  to="/my-storefronts"
                  className="block px-4 py-2 text-sm text-lavender/70 hover:text-cream hover:bg-white/5 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  My Storefronts
                </Link>
                {isSteward && (
                  <Link
                    to="/steward"
                    className="block px-4 py-2 text-sm text-gold-400 hover:text-gold-300 hover:bg-gold-400/5 transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Shield className="w-3 h-3 inline mr-1" /> Steward Portal
                  </Link>
                )}
                <button
                  onClick={() => { signOut(); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-lavender/50 hover:text-lavender/80 hover:bg-white/5 transition-colors border-t border-lavender/5"
                >
                  <LogOut className="w-3 h-3 inline mr-1" /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : hasProfile ? (
          <button
            onClick={() => setShowSignIn(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-full border border-gold-400/20 bg-gold-400/5 hover:bg-gold-400/10 transition-all"
            title="Sign in to your profile"
          >
            <span className="w-7 h-7 rounded-full bg-void-900 border border-lavender/10 flex items-center justify-center text-sm">
              {localProfile?.emoji || '✦'}
            </span>
            <span className="text-xs text-lavender/60 hidden sm:inline">{localProfile?.name || 'Profile'}</span>
          </button>
        ) : (
          <Link
            to="/create-profile"
            className="flex items-center gap-2 px-3 py-2 rounded-full border border-gold-400/30 bg-gold-400/10 text-gold-300 hover:bg-gold-400/20 transition-all"
          >
            <span className="w-7 h-7 rounded-full bg-void-900 border border-gold-400/20 flex items-center justify-center text-sm">✦</span>
            <span className="text-xs hidden sm:inline">Join</span>
          </Link>
        )}
      </div>

      {/* ── Top bar with sigil + title ── */}
      <div className="pt-10 pb-4 px-4 text-center">
        <Link
          to="/"
          className="inline-block mb-4 group"
          aria-label="Heartlight Collective Home"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-32 h-32 mx-auto flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
            <img
              src={`${import.meta.env.BASE_URL}logo-transparent.png`}
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
          Co-creator community with mutual aid & aligned exchanges
        </p>
      </div>

      {/* ── Primary Nav: 3 pillars only ── */}
      <nav className="px-4 pb-2">
        <div className="max-w-2xl mx-auto flex justify-center gap-3">
          {primaryNav.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            const hueStyles = {
              gold: {
                active: 'border-gold-400/60 bg-gold-400/10 text-gold-300',
                inactive: 'border-gold-400/20 text-gold-400/80 hover:border-gold-400/40 hover:text-gold-300 hover:bg-gold-400/5',
              },
              magenta: {
                active: 'border-magenta-400/60 bg-magenta-400/10 text-magenta-300',
                inactive: 'border-magenta-400/20 text-magenta-400/80 hover:border-magenta-400/40 hover:text-magenta-300 hover:bg-magenta-400/5',
              },
              lavender: {
                active: 'border-lavender/60 bg-lavender/10 text-lavender',
                inactive: 'border-lavender/20 text-lavender/70 hover:border-lavender/40 hover:text-lavender hover:bg-lavender/5',
              },
            };
            const hue = hueStyles[item.hue as keyof typeof hueStyles];

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium tracking-wide
                  transition-all duration-300 border
                  ${isActive ? hue.active : hue.inactive}
                `}
              >
                {item.label}
                <Icon className="w-4 h-4" strokeWidth={2} />
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Secondary Nav ── */}
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
