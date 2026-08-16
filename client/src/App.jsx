import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Pipeline from './pages/Pipeline.jsx';
import Report from './pages/Report.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/scenario/:id" element={<Pipeline />} />
      <Route path="/scenario/:id/rapport" element={<Report />} />
    </Routes>
  );
}
