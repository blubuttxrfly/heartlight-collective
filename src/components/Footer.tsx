import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="relative z-10 py-8 px-4 text-center">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-magenta-500 fill-magenta-500/20" />
          <span className="text-lavender/50 text-sm">
            Co-created with Atlas Morphoenix in celebration of our Heartlight Exchange
          </span>
          <Heart className="w-4 h-4 text-magenta-500 fill-magenta-500/20" />
        </div>
        <p className="text-void-700 text-xs">
          🎶🪽✨🌈💜
        </p>
        <div className="mt-4 flex justify-center gap-4 text-xs text-lavender/30">
          <a href="https://atlasisland.co" className="hover:text-gold-400 transition-colors">
            Atlas Island
          </a>
          <span>·</span>
          <a href="/exchange" className="hover:text-gold-400 transition-colors">
            Exchange
          </a>
          <span>·</span>
          <a href="/flow" className="hover:text-gold-400 transition-colors">
            Flow
          </a>
        </div>
      </div>
    </footer>
  )
}
