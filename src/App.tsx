import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Exchange from './pages/Exchange'
import Flow from './pages/Flow'
import Charter from './pages/Charter'
import Codes from './pages/Codes'
import Privacy from './pages/Privacy'

function App() {
  return (
    <div className="min-h-screen bg-heartlight-gradient text-cream flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exchange" element={<Exchange />} />
          <Route path="/flow" element={<Flow />} />
          <Route path="/charter" element={<Charter />} />
          <Route path="/codes" element={<Codes />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
