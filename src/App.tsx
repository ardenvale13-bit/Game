import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/HomeNew';
import CreateRoom from './pages/CreateRoomNew';
import JoinRoom from './pages/JoinRoomNew';
import Lobby from './pages/LobbyNew';
import GameRouter from './pages/GameRouter';
import './index.css';
import './games/cah/cah.css';
import './games/hangman/hangman.css';
import './games/wavelength/wavelength.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateRoom />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/join/:roomCode" element={<JoinRoom />} />
        <Route path="/lobby/:roomCode" element={<Lobby />} />
        <Route path="/play/:game/:roomCode" element={<GameRouter />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
