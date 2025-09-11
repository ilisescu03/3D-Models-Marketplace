import { useState } from 'react'

//css
import '/frontend/css/App.css'
//routes
import { Routes, Route } from 'react-router-dom';
import Home from '/frontend/src/Home.jsx';

function App() {
  

  return (
    <>
      <Routes>
        <Route path='/' element={<Home />} />
      </Routes>
    </>
  )
}

export default App
