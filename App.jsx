// App.jsx
import { useState, useEffect, lazy, Suspense } from 'react';
import '/frontend/css/App.css';
import { Routes, Route } from 'react-router-dom';
import { CookieService } from '/backend/cookies.js';
import LoadingScreen from '/frontend/src/UI+UX/LoadingScreen';
// --- LAZY LOADING PAGES ---
// Importăm componentele folosind React.lazy
const Home = lazy(() => import('/frontend/src/pages/Home.jsx'));
const LogIn = lazy(() => import('/frontend/src/pages/LogIn.jsx'));
const SignUp = lazy(() => import('/frontend/src/pages/SignUp.jsx'));
const ForgotPassword = lazy(() => import('/frontend/src/pages/ForgotPassword'));
const Dashboard = lazy(() => import('/frontend/src/pages/Dashboard'));
const Heroes = lazy(() => import('/frontend/src/pages/Heroes'));
const OtherDashboard = lazy(() => import('/frontend/src/pages/OtherDashboard'));
const Settings = lazy(() => import('/frontend/src/pages/Settings'));
const PasswordReset = lazy(() => import('/frontend/src/pages/PasswordReset'));
const UploadModel = lazy(() => import('/frontend/src/pages/UploadModel.jsx'));
const ModelDetails = lazy(() => import('/frontend/src/pages/ModelDetails'));
const Search = lazy(() => import('/frontend/src/pages/Search'));
const ModelsPage = lazy(() => import('/frontend/src/pages/ModelsPage'));
const CommunityMembers = lazy(() => import('/frontend/src/pages/CommunityMembers'));
const CookiePolicy = lazy(() => import('/frontend/src/pages/CookiePolicy.jsx'));
const TermsAndConditions = lazy(() => import('/frontend/src/pages/TermsAndConditions.jsx'));
const Contact = lazy(() => import('/frontend/src/pages/Contact.jsx'));
const MyCart = lazy(() => import('/frontend/src/pages/MyCart.jsx'));
// O componentă simplă pentru starea de încărcare
function LoadingFallback() {
  return (
    <LoadingScreen />
  );
}

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
      {/* Învelim toate rutele în componenta Suspense */}
      <Suspense fallback={<LoadingFallback />}>
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
          <Route path="/upload" element={<UploadModel />} />
          <Route path="/model/:modelId" element={<ModelDetails />} />
          <Route path="/search" element={<Search />} />
          <Route path="/3d-models" element={<ModelsPage />} />
          <Route path="/members" element={<CommunityMembers />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/terms&conditions" element={<TermsAndConditions />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/my-cart" element={<MyCart />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;