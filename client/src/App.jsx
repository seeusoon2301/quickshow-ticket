import React from 'react'
import Navbar from './components/Navbar'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Search from "./pages/Search";
import CategoryPage from './pages/CategoryPage'
import EventDetail from './pages/EventDetail'
import Checkout from './pages/Checkout'
import Payment from './pages/Payment'
import Profile from './pages/Profile'
import MyTickets from './pages/MyTickets'
import OrderHistory from './pages/OrderHistory'
import Footer from './components/Footer'

const App = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <Routes>
          <Route path='/' element={<Home/>} />
          <Route path="/search" element={<Search />} />
          <Route path='/category/:slug' element={<CategoryPage />} />
          <Route path='/event/:id' element={<EventDetail />} />
          <Route path='/checkout' element={<Checkout />} />
          <Route path='/payment' element={<Payment />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/my-tickets' element={<MyTickets />} />
          <Route path='/orders' element={<OrderHistory />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App