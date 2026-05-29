import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';
import { Navbar } from './components/Navbar';
import { OfflineBanner } from './components/OfflineBanner';
import { InstallPrompt } from './components/InstallPrompt';

// Views
import { Home } from './pages/Home';
import { TutorProfile } from './pages/TutorProfile';
import { Sessions } from './pages/Sessions';
import { TutorDashboard } from './pages/TutorDashboard';
import { StudentConsole } from './pages/StudentConsole';
import { Login } from './pages/Login';

function App() {
  return (
    <OfflineProvider>
      <AuthProvider>
        <Router>
          {/* Shell banner warning when device goes offline (RNF-12) */}
          <OfflineBanner />
          
          {/* Dual Desktop top-nav / Mobile bottom-nav shell (RNF-23) */}
          <Navbar />
          
          {/* Main App Container */}
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tutor/:username" element={<TutorProfile />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/dashboard" element={<TutorDashboard />} />
              <Route path="/student" element={<StudentConsole />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>

          {/* Floating PWA Install Prompt for Android Chrome / iOS Safari (RNF-02, RNF-03) */}
          <InstallPrompt />
        </Router>
      </AuthProvider>
    </OfflineProvider>
  );
}

export default App;
