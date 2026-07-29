import { Outlet, NavLink, useLocation, Link } from 'react-router-dom'
import { Heart, Sparkles, Store, Search, HandHeart } from 'lucide-react'
import { PiShootingStar } from 'react-icons/pi'
import { useSession } from '../../lib/session'
import { useStorage } from '../../lib/storage'
import { StorefrontCard } from '../../components/StorefrontCard'

const tabs = [
  { path: '/exchange', label: 'Discover', icon: Search },
  { path: '/exchange/wishes', label: 'Wishes', icon: Heart },
  { path: '/exchange/gifts', label: 'Gifts', icon: HandHeart },
  { path: '/exchange/vendors', label: 'Vendors', icon: Store },
]

export default function ExchangeLayout() {
  const { pathname } = useLocation()
  const { user } = useSession()
  const { getVendors } = useStorage()

  const isVendors = pathname === '/exchange/vendors'

  return (
    <div className="px-4 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-gold-400" aria-label="Heartlight" />
          </div>
          <h1 className="font-serif text-3xl text-gold-400 mb-2">
            Wish & Gift Exchange
          </h1>
          <p className="text-lavender/50 max-w-lg mx-auto">
            Cast a Wish, Share a Gift, and Exchange with Fulfillment!
          </p>
        </div>
      </div>

      {/* Post CTAs */}
      <div className="flex flex-wrap gap-3 mb-8 justify-center">
        <Link
          to="/exchange/wish/cast-wish?type=wish"
          className="px-6 py-3 rounded-full bg-magenta-400/10 border border-magenta-400/30 text-magenta-300 hover:bg-magenta-400/20 transition-all inline-flex items-center gap-2"
        >
          Cast a Wish <PiShootingStar className="w-4 h-4" />
        </Link>
        <Link
          to="/exchange/gift/share-gift?type=gift"
          className="px-6 py-3 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all inline-flex items-center gap-2"
        >
          Share a Gift <HandHeart className="w-4 h-4" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <NavLink
              key={t.path}
              to={t.path}
              end={t.path === '/exchange'}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full border text-sm transition-all inline-flex items-center gap-2 ${
                  isActive
                    ? 'bg-gold-400/10 border-gold-400/30 text-gold-300'
                    : 'border-lavender/10 text-lavender/50 hover:border-lavender/20 hover:text-lavender/70'
                }`
              }
            >
              {t.label}
              {Icon && <Icon className="w-3.5 h-3.5" />}
            </NavLink>
          )
        })}
      </div>

      {/* Vendors-only discovery section */}
      {isVendors && (
        <div className="mb-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getVendors()
            .filter((v) => v.status === 'active')
            .map((vendor) => (
              <StorefrontCard key={vendor.id} vendor={vendor} />
            ))}
        </div>
      )}

      <Outlet />
    </div>
  )
}
