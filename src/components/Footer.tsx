import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="relative z-10 py-8 px-4 text-center">
      <div className="max-w-2xl mx-auto">
        {/* Atlas Island Logo → AtlasIsland.co */}
        <div className="mb-4">
          <a
            href="https://atlasisland.co"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Atlas Island"
          >
            <img
              src={`${import.meta.env.BASE_URL}logo-atlas-island.png`}
              alt="Atlas Island"
              className="w-16 h-16 mx-auto object-contain opacity-60 hover:opacity-100 transition-opacity"
            />
          </a>
        </div>

        {/* Page Links */}
        <div className="flex justify-center gap-4 text-xs text-lavender/30">
          <a href="https://atlasisland.co" className="hover:text-gold-400 transition-colors">
            Atlas Island
          </a>
          <span>·</span>
          <Link to="/exchange" className="hover:text-gold-400 transition-colors">
            Exchange
          </Link>
          <span>·</span>
          <Link to="/" className="hover:text-gold-400 transition-colors">
            Collective
          </Link>
          <span>·</span>
          <Link to="/flow" className="hover:text-gold-400 transition-colors">
            Flow
          </Link>
        </div>
      </div>
    </footer>
  )
}
