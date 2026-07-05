import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import ExchangeLayout from './pages/exchange/ExchangeLayout'
import ExchangeDiscovery from './pages/exchange/ExchangeDiscovery'
import PostWish from './pages/PostWish'
import WishWizard from './components/wish/WishWizard'
import Flow from './pages/Flow'
import Charter from './pages/Charter'
import Codes from './pages/Codes'
import Privacy from './pages/Privacy'
import Directory from './pages/Directory'
import CreateProfile from './pages/CreateProfile'
import StewardGate from './pages/StewardGate'
import VendorShopManagement from './pages/flow/VendorShopManagement'
import VendorShopBeingView from './pages/flow/VendorShopBeingView'
import SignIn from './pages/SignIn'
import EditProfile from './pages/EditProfile'
import Profile from './pages/Profile'
import ResourceFlow from './pages/ResourceFlow'
import AuthCallback from './pages/AuthCallback'
import Account from './pages/Account'

function StorefrontRedirect() {
  const { slug } = useParams<{ slug: string }>()
  return <Navigate to={`/flow/vendor-shop/${slug}`} replace />
}

function App() {
  return (
    <div className="min-h-screen bg-heartlight-gradient text-cream flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />

          {/* ─── Heartlight Exchange (nested) ─── */}
          <Route path="/exchange" element={<ExchangeLayout />}>
            <Route index element={<ExchangeDiscovery typeFilter="all" />} />
            <Route path="wishes" element={<ExchangeDiscovery typeFilter="wish" />} />
            <Route path="gifts" element={<ExchangeDiscovery typeFilter="offer" />} />
            <Route path="vendors" element={null} />
          </Route>
          <Route path="/exchange/wish/cast-wish" element={<WishWizard />} />
          <Route path="/exchange/gift/share-gift" element={<WishWizard />} />

          {/* Legacy Exchange aliases */}
          <Route path="/post-wish" element={<Navigate to="/exchange/wish/cast-wish" replace />} />
          <Route path="/cast-wish" element={<Navigate to="/exchange/wish/cast-wish" replace />} />
          <Route path="/share-gift" element={<Navigate to="/exchange/gift/share-gift" replace />} />

          {/* ─── Flow ─── */}
          <Route path="/flow" element={<Flow />} />
          <Route path="/flow/vendor-shop" element={<VendorShopManagement />} />
          <Route path="/flow/vendor-shop/:slug" element={<VendorShopBeingView />} />

          <Route path="/directory" element={<Directory />} />
          <Route path="/charter" element={<Charter />} />
          <Route path="/codes" element={<Codes />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/create-profile" element={<CreateProfile />} />
          <Route path="/steward" element={<StewardGate />} />
          <Route path="/my-storefronts" element={<Navigate to="/flow/vendor-shop" replace />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/account" element={<Account />} />
          <Route path="/profile/:ces" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />

          {/* Legacy storefront alias */}
          <Route path="/storefront/:slug" element={<StorefrontRedirect />} />

          <Route path="/resource-flow/:ces?" element={<ResourceFlow />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
