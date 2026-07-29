import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ScrollText,
  Sparkles,
  Globe,
  Heart,
  HandHeart,
  Users,
  Gift,
  ArrowLeftRight,
  Banknote,
  Scale,
  Store,
  Video,
  MapPin,
  Landmark,
  Leaf,
  Lock,
  Gem,
  Shield,
  Plane,
  MousePointerClick,
  FileText,
  CheckCircle,
} from 'lucide-react'

/* Data */
const flowSteps = [
  {
    step: '1. Cast or Share',
    title: 'Cast a Wish, Share a Gift',
    body: 'Every being enters the Wish & Gift Exchange through a Core Energetic Signature. From there you may cast a wish, share a gift, or open a Vendor Shop of offerings. Each post carries the exchange forms it welcomes.',
    icon: Heart,
  },
  {
    step: '2. Discover & Resonate',
    title: 'Browse Wishes, Gifts, Offerings, and Vendors',
    body: 'Use tags, categories, roles, and location scope to discover what is alive in the field. Offerings include products, services, virtual sessions, and work-study exchanges. Virtual sessions may be hosted on Google Meet, Zoom, Jitsi, Teams, or another agreed platform.',
    icon: MousePointerClick,
  },
  {
    step: '3. Request with Booking',
    title: 'Request an Aligned Exchange',
    body: 'When resonance is mutual, a being requests the exchange. For scheduled offerings, a real calendar slot is proposed from the provider\'s availability. The request also names the exchange form: gift, barter, fixed price, negotiable, collective-funded, or peer payment.',
    icon: CheckCircle,
  },
  {
    step: '4. Agree & Dedicate',
    title: 'Enter an Exchange Agreement',
    body: 'The request becomes a living Exchange Agreement. Consent, privacy, scope, hybrid payment, and meeting details are confirmed. When a monetary component is present, 99% of profits auto-dedicates to the Heartlight Collective destinations for Earth, homes, and ALL the Living.',
    icon: FileText,
  },
  {
    step: '5. Fulfill & Complete',
    title: 'Meet, Fulfill, and Close the Cycle',
    body: 'The exchange is fulfilled — in person, in community, or through a virtual session link. Agreements may carry quests and present-moment reflection. Once complete, gratitude is recorded and the cycle returns energy to the collective field.',
    icon: Sparkles,
  },
]

const exchangeForms = [
  {
    icon: Gift,
    title: 'Gift Exchange',
    body: 'A being offers their gift freely from overflow, as an act of love and sacred service. Gifting is always clearly named, never assumed, and chosen with full sovereignty.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Barter, Trade, or Skill Swap',
    body: 'One offering in return for another. Both beings bring their gifts and agree on scope. Energy flows in both directions with joy, clarity, and equity.',
  },
  {
    icon: Banknote,
    title: 'Currency Fixed Price',
    body: 'A clear, agreed-upon offering in exchange for currency. Both beings know what is being exchanged before co-creation begins, held with transparency and care.',
  },
  {
    icon: Scale,
    title: 'Currency Sliding Scale',
    body: 'Coming soon. A range of exchange honoring that different beings hold different access to currency. The Co-Creator will set the range; the receiver will choose with honesty and resonance.',
  },
  {
    icon: HandHeart,
    title: 'Collective-Funded or Scholarship Exchange',
    body: 'Community-supported offerings that allow beings to receive who may not have access to other pathways. Scholarships and grants may be offered by Co-Creators or funded through collective generosity.',
  },
  {
    icon: Landmark,
    title: 'Grants & Seasonal Initiatives',
    body: 'Seasonal pools may support collective dreams, community land, creative works, and aligned projects. These cycles are internal to the Heartlight Collective and will unfold as the field grows.',
  },
]

const offeringTypes = [
  {
    icon: Store,
    title: 'Vendor Shops',
    body: 'A being or collective may open a Vendor Shop to list offerings. Each shop has a profile icon, links, exchange policies, and a collection of offerings available to the field.',
  },
  {
    icon: Video,
    title: 'Virtual Sessions',
    body: 'Offerings may be virtual meeting sessions with booking through real calendar availability. Supported platforms include Google Meet, Zoom, Jitsi, Microsoft Teams, or another platform the beings agree upon.',
  },
  {
    icon: MapPin,
    title: 'Community & Work-Study Exchanges',
    body: 'Some offerings happen in physical places — community gathering locations, work-study programs, and in-person co-creation. Locations carry real address, directions, and accessibility notes.',
  },
  {
    icon: Plane,
    title: 'Digital & Physical Offerings',
    body: 'Offerings may travel as digital gifts, handcrafted objects, mentorship, community circles, teachings, talismans, or any form a Co-Creator is called to share.',
  },
]

const dedications = [
  { emoji: '🌍', title: 'Earth Initiatives', body: 'Climate action, renewable energy, regeneration, and healing.' },
  { emoji: '🏠', title: 'Sovereign Homes', body: 'Community spaces, housing, mutual aid, and interdependence.' },
  { emoji: '♾️', title: 'ALL the Living', body: 'Biodiversity, ecosystems, collective flourishing, and thrival.' },
]

function SectionTitle({ icon: Icon, children }: { icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-xl text-gold-300 mb-4 flex items-center gap-2">
      {children}
      {Icon && <Icon className="w-5 h-5" />}
    </h2>
  )
}

function BodyText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-lavender/70 leading-relaxed font-sans">{children}</p>
}

export default function Charter() {
  return (
    <div className="px-4 pb-16 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8 mb-8">
        <h1 className="font-serif text-3xl md:text-4xl text-gold-300 mb-3 flex items-center justify-center gap-3">
          Heartlight Collective Charter
          <ScrollText className="w-8 h-8" />
        </h1>
        <p className="font-serif italic text-lg text-lavender/60 max-w-xl mx-auto">
          A living vow for the Heartlight Collective and our aligned exchanges
        </p>
      </motion.div>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-12">
        <SectionTitle icon={Sparkles}>How the Exchange Flows</SectionTitle>
        <BodyText>
          The Wish & Gift Exchange moves through a simple living rhythm: beings join through a Core Energetic Signature,
          cast and answer wishes, discover offerings, request aligned exchanges with real booking, and complete co-creations
          through resonance, agreement, and fulfillment.
        </BodyText>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {flowSteps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="rounded-2xl border border-gold-400/15 bg-void-800/40 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <s.icon className="w-5 h-5 text-gold-400" />
                <p className="text-xs uppercase tracking-widest text-gold-400 font-sans">{s.step}</p>
              </div>
              <h3 className="font-serif text-lg text-cream mb-2">{s.title}</h3>
              <p className="text-sm text-lavender/60 leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-gold-400/25 bg-gold-400/5 p-8 text-center mb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(250,209,68,0.07),transparent_65%)] pointer-events-none" />
        <p className="font-serif italic text-lg text-gold-300 leading-relaxed relative z-10 max-w-2xl mx-auto">
          Heartlight Exchanges exist to harmonize the Ray frequencies of ALL through intentional co-creation.
          Beings across Earth and beyond may share wishes, gifts, offerings, lessons, art, healing, and sacred skill
          crafted with care by sovereign members of the Heartlight Collective.
        </p>
      </motion.div>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-12">
        <SectionTitle icon={Globe}>The Heartlight Collective & Earth Dedication</SectionTitle>
        <div className="rounded-2xl border border-green-400/20 bg-green-400/5 p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(74,222,128,0.07),transparent_65%)] pointer-events-none" />
          <div className="relative z-10">
            <p className="font-serif italic text-lg text-green-300 leading-relaxed mb-6 max-w-2xl mx-auto text-center">
              The Heartlight Collective is a unanimous agreement dedication to directing{' '}
              <span className="text-green-400 font-medium">99% of all profits</span> back to our Earth, homes,
              sovereign interdependent communities, and ALL the Living.
            </p>
            <p className="text-sm text-lavender/70 leading-relaxed mb-6 max-w-2xl mx-auto text-center">
              Through the Wish & Gift Exchange, funds flow toward Earth-conscious initiatives, climate action projects,
              community resilience, regenerative systems, and aligned exchanges that serve our Greatest & Highest Good.
              This is not a donation — this is a sacred reallocation of energy back to the living systems that sustain us all.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
              {dedications.map((d) => (
                <div key={d.title} className="rounded-xl border border-green-400/10 bg-void-800/40 p-4 text-center">
                  <div className="text-3xl mb-2">{d.emoji}</div>
                  <div className="text-sm text-cream mb-1">{d.title}</div>
                  <div className="text-xs text-lavender/50">{d.body}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-lavender/40 text-center">
              1% covers operational costs. 99% returns to Earth and community. This is our living agreement, honored by every Co-Creator in the Heartlight Exchange.
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-12">
        <SectionTitle icon={Users}>Heartlight Co-Creators</SectionTitle>
        <BodyText>
          Heartlight Co-Creators are sovereign beings whose occupation is co-creating for ALL through reciprocity.
          Recipients may discover a Co-Creator through the Exchange, and Co-Creators respond through resonance and capacity.
          Vendor Shops allow individuals and collectives to offer their gifts in an organized, transparent, and reachable way.
        </BodyText>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-12">
        <SectionTitle icon={Store}>Offerings & Vendor Shops</SectionTitle>
        <BodyText>
          Vendor Shops are living storefronts within the Wish & Gift Exchange. Each shop may display a profile icon, links,
          exchange policies, and a gallery of offerings. Offerings may be products, services, virtual sessions, or work-study exchanges.
        </BodyText>
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {offeringTypes.map((o, i) => (
            <motion.div
              key={o.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.08 }}
              className="flex gap-4 items-start p-4 rounded-xl border border-gold-400/10 bg-void-800/30"
            >
              <o.icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-gold-400" />
              <div>
                <h3 className="font-serif text-base text-cream mb-1">{o.title}</h3>
                <p className="text-sm text-lavender/60 leading-relaxed">{o.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mb-12">
        <SectionTitle icon={HandHeart}>Exchange Pathways</SectionTitle>
        <BodyText>
          Every exchange is an act of sacred reciprocity. The Wish & Gift Exchange welcomes multiple exchange forms;
          choose the one that feels most resonant for each co-creation. Some pathways are live now, and others will arrive as the field grows.
        </BodyText>
        <div className="grid gap-3 mt-6">
          {exchangeForms.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + i * 0.08 }}
              className="flex gap-4 items-start p-4 rounded-xl border border-gold-400/10 bg-void-800/30"
            >
              <p.icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-gold-400" />
              <div>
                <h3 className="font-serif text-base text-cream mb-1">{p.title}</h3>
                <p className="text-sm text-lavender/60 leading-relaxed">{p.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="mb-12">
        <SectionTitle icon={Leaf}>Accessibility Promise</SectionTitle>
        <BodyText>
          Offerings may be created in multiple formats whenever it supports the receiver: text, audio, captioned video,
          sensory-friendly pacing, simplified steps, multiple time-zone windows, and clear accessibility notes for in-person locations.
        </BodyText>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="mb-12">
        <SectionTitle icon={Lock}>Privacy Assurance</SectionTitle>
        <BodyText>
          The Privacy Assurance is sacred to the thrival and harmony of every co-creator in the Heartlight Exchange.
          Letters, personal stories, and creative details stay held within the sacred container shared by the receiver and their chosen Co-Creator.
          Consent governs every moment of sharing before, during, and after the exchange.
        </BodyText>
        <div className="mt-4">
          <Link to="/privacy" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gold-400/30 text-gold-300 hover:bg-gold-400/10 transition-all text-sm">
            View Full Privacy Assurance <Lock className="w-4 h-4" />
          </Link>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="mb-12">
        <SectionTitle icon={Gem}>The 12 Codes of ALL</SectionTitle>
        <BodyText>
          The 12 Codes of ALL are the living values that the Heartlight Collective upholds. Each Code is held by a Ray frequency
          and carries its own mantra of practice.
        </BodyText>
        <div className="mt-4">
          <Link to="/codes" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gold-400/30 text-gold-300 hover:bg-gold-400/10 transition-all text-sm">
            View All 12 Codes of ALL <Gem className="w-4 h-4" />
          </Link>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="mb-12">
        <SectionTitle icon={Shield}>Stewardship</SectionTitle>
        <BodyText>
          A small circle of Stewards holds the directory, Codes, scholarships, seasonal announcements, and gentle conflict resolution
          through care and clarity.
        </BodyText>
      </motion.section>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="text-center py-8 max-w-xl mx-auto">
        <p className="font-serif italic text-lavender/50 mb-6 leading-relaxed">
          Join the Heartlight Collective to share your Core Energetic Signature. Let's make our dreams and wishes come true!
        </p>
        <Link to="/exchange" className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-gold-400/40 text-gold-300 hover:bg-gold-400/10 transition-all font-serif">
          Enter the Wish & Gift Exchange <Heart className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  )
}
