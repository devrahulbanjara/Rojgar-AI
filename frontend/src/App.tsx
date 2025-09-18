import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RecruiterDashboard from './pages/recruiter/Dashboard';
import CandidateDashboard from './pages/candidate/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
        <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;