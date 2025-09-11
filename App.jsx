import { useState } from 'react'

//css
import '/frontend/css/App.css'
//routes
import { Routes, Route } from 'react-router-dom';
import Home from '/frontend/src/Home.jsx';
import LogIn from '/frontend/src/LogIn.jsx';
import SignUp from '/frontend/src/SignUp.jsx';
function App() {
  

  return (
    <>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<LogIn />} />
        <Route path='/signup' element={<SignUp />} />
      </Routes>
    </>
  )
}

export default App
