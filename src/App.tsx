import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Exchange from './pages/Exchange'
import PostWish from './pages/PostWish'
import Flow from './pages/Flow'
import Charter from './pages/Charter'
import Codes from './pages/Codes'
import Privacy from './pages/Privacy'
import Directory from './pages/Directory'
import CreateProfile from './pages/CreateProfile'
import StewardGate from './pages/StewardGate'
import MyStorefronts from './pages/MyStorefronts'
import SignIn from './pages/SignIn'
import EditProfile from './pages/EditProfile'
import Profile from './pages/Profile'

function App() {
  return (
    <div className="min-h-screen bg-heartlight-gradient text-cream flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exchange" element={<Exchange />} />
          <Route path="/post-wish" element={<PostWish />} />
          <Route path="/flow" element={<Flow />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/charter" element={<Charter />} />
          <Route path="/codes" element={<Codes />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/create-profile" element={<CreateProfile />} />
          <Route path="/steward" element={<StewardGate />} />
          <Route path="/my-storefronts" element={<MyStorefronts />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/profile/:ces" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
