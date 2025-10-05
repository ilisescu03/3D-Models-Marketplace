// App.jsx
import { useState, useEffect } from 'react'
import '/frontend/css/App.css'
import { Routes, Route } from 'react-router-dom';
import Home from '/frontend/src/pages/Home.jsx';
import LogIn from '/frontend/src/pages/LogIn.jsx';
import SignUp from '/frontend/src/pages/SignUp.jsx';
import ForgotPassword from '/frontend/src/pages/ForgotPassword';
import Dashboard from '/frontend/src/pages/Dashboard';
import Heroes from '/frontend/src/pages/Heroes';
import OtherDashboard from '/frontend/src/pages/OtherDashboard';
import Settings from '/frontend/src/pages/Settings';
import PasswordReset from '/frontend/src/pages/PasswordReset'
import { CookieService } from '/backend/cookies.js';
import UploadModel  from '/frontend/src/pages/UploadModel.jsx';
import ModelDetails from '/frontend/src/pages/ModelDetails';
import Search from '/frontend/src/pages/Search';
import ModelsPage from '/frontend/src/pages/ModelsPage';
import CommunityMembers from '/frontend/src/pages/CommunityMembers';
function App() {
  const [hasInitialized, setHasInitialized] = useState(false);
  useEffect(() => {
    if (hasInitialized) return; // Prevents double execution
    setHasInitialized(true);
    // ANALYTICS - site visits and time spent
    let cleanupTracking = null;

    CookieService.initializeTracking();
   
    return () => {
      if (cleanupTracking) {
        cleanupTracking();
      }
    };

  }, [hasInitialized]);
  return (
    <>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<LogIn />} />
        <Route path='/signup' element={<SignUp />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/heroes' element={<Heroes />} />
        <Route path="/user/:username" element={<OtherDashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/upload" element={<UploadModel/>} />
        <Route path="/model/:modelId" element={<ModelDetails />} />
        <Route path="/search" element={<Search />} />
        <Route path="/3d-models" element={<ModelsPage />} />
        <Route path="/members" element={<CommunityMembers />} />
      </Routes>
    </>
  )
}

export default App