import "./App.css";
import LoginForm from "./Components/LoginForm/LoginForm";
import BoardPage from "./Components/Board/BoardPage";
import Profile from "./Components/Profile/Profile";
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
