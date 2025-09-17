// App.jsx
import { useState } from 'react'
import '/frontend/css/App.css'
import { Routes, Route } from 'react-router-dom';
import Home from '/frontend/src/pages/Home.jsx';
import LogIn from '/frontend/src/pages/LogIn.jsx';
import SignUp from '/frontend/src/pages/SignUp.jsx';
import ForgotPassword from '/frontend/src/pages/ForgotPassword';
import Dashboard from '/frontend/src/pages/Dashboard';
import CommunityMembers from '/frontend/src/pages/CommunityMembers';
import OtherDashboard from '/frontend/src/pages/OtherDashboard';
import Settings from '/frontend/src/pages/Settings';

function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<LogIn />} />
        <Route path='/signup' element={<SignUp />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/dashboard' element={<Dashboard/>}/>
        <Route path='/community-members' element={<CommunityMembers/>}/>
        <Route path="/user/:username" element={<OtherDashboard />} />
        <Route path="/settings" element ={<Settings/>}/>
      </Routes>
    </>
  )
}

export default App