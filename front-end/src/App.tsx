import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import './styles/global.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/signup" element={<Navigate to="/auth" replace />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
