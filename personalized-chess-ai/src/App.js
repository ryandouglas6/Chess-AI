import "./App.css";
import LoginForm from "./Components/LoginForm/LoginForm";
import BoardPage from "./Components/Board/BoardPage";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        {/* <Route index element={<LoginForm />} /> */}
        <Route index element={<BoardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
