import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Exchange from './pages/Exchange'
import Flow from './pages/Flow'

function App() {
  return (
    <div className="min-h-screen bg-heartlight-gradient text-cream flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exchange" element={<Exchange />} />
          <Route path="/flow" element={<Flow />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
