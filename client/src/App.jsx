import React from 'react'
import Navbar from './components/Navbar'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Search from "./pages/Search";
import MusicPage from './pages/Music'
import TheaterAndArtPage from './pages/TheaterAndArt';
import SportPage from './pages/Sport';
import OtherPage from './pages/Other';

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path="/search" element={<Search />} />
        <Route path='/music' element={<MusicPage />} />
        <Route path='/theatersandart' element={<TheaterAndArtPage />} />
        <Route path='/sport' element={<SportPage />} />
        <Route path='/other' element={<OtherPage />} />
      </Routes>
    </>
  )
}

export default App