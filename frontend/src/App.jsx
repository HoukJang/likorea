import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Banner from './components/Banner'; // Banner 컴포넌트 import
import Header from './components/Header'; // Header 컴포넌트 import
import Home from './pages/Home';
import Signup from './components/Signup';
import Login from './components/Login';
import BoardList from './components/BoardList';
import BoardPostForm from './components/BoardPostForm';
import BoardPostView from './components/BoardPostView';
import './styles/App.css';

function App() {
  return (
    <Router>
      <Banner />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/boards/:boardType" element={<BoardList />} />
        <Route path="/boards/:boardType/new" element={<BoardPostForm />} />
        <Route path="/boards/:boardType/:postId" element={<BoardPostView />} />
        <Route path="/boards/:boardType/:postId/edit" element={<BoardPostForm />} />
      </Routes>
    </Router>
  );
}

export default App;