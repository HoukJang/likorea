import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Signup from './components/Signup';
import Login from './components/Login';
import BoardList from './components/BoardList';
import BoardPostForm from './components/BoardPostForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/boards/:boardType" element={<BoardList />} />
        <Route path="/boards/:boardType/new" element={<BoardPostForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;