import "./App.css";
import LoginForm from "./Pages/LoginForm/LoginForm";
import BoardPage from "./Pages/Board/BoardPage";
import Profile from "./Pages/Profile/Profile";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route index element={<LoginForm />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
