import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/exchange', label: 'Exchange', emoji: '💱' },
  { path: '/', label: 'Collective', emoji: '🌐' },
  { path: '/flow', label: 'Flow', emoji: '♾️' },
]

export default function Header() {
  const location = useLocation()

  return (
    <header className="relative z-50">
      {/* Top bar with sigil + title */}
      <div className="pt-8 pb-4 px-4 text-center">
        {/* Heartlight Collective Logo → Home */}
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

        {/* Title → Home */}
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
      <nav className="px-4 pb-6">
        <div className="max-w-2xl mx-auto flex justify-center gap-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
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
            )
          })}
        </div>
      </nav>
    </header>
  )
}
