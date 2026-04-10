import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function App(): JSX.Element {
  return (
    <Router>
      <div className='app'>
        <header>
          <h1>Norma 3100 Compliance Management System</h1>
          <p>Health Provider Compliance & Certification Platform</p>
        </header>

        <main>
          <Routes>
            <Route path='/' element={<Home />} />
          </Routes>
        </main>

        <footer>
          <p>&copy; 2026 Norma 3100. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

function Home(): JSX.Element {
  return (
    <div className='home'>
      <h2>Welcome to Norma 3100</h2>
      <p>A compliance management platform for Colombian health service providers.</p>
      <p>Application is loading...</p>
    </div>
  );
}

export default App;
