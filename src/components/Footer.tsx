import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="relative z-10 py-8 px-4 text-center">
      <div className="max-w-2xl mx-auto">
        {/* Atlas Island Logo */}
        <div className="mb-4">
          <img
            src="/logo-transparent.png"
            alt="Atlas Island"
            className="w-16 h-16 mx-auto object-contain opacity-60 hover:opacity-100 transition-opacity"
          />
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
