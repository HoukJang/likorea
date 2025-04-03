import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Banner from './components/Banner'; // Banner 컴포넌트 import
import Header from './components/Header'; // Header 컴포넌트 import
import Home from './pages/Home';
import Signup from './components/Signup';
import Login from './components/Login';
import BoardList from './components/BoardList';
import BoardPostForm from './components/BoardPostForm';
import BoardEditForm from './components/BoardEditForm';
import './styles/App.css';

function App() {
  return (
    <BrowserRouter>
      <Banner />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/boards/:boardType" element={<BoardList />} />
        <Route path="/boards/:boardType/new" element={<BoardPostForm />} />
        <Route path="/boards/:boardType/:postId/edit" element={<BoardEditForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;