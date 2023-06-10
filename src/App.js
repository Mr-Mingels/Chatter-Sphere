import './App.css'
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import React, { lazy, Suspense, useEffect, useState  } from "react";

const Authenticate = lazy(() => import('./components/Authenticate'));
const Main = lazy(() => import('./components/Main'))

const App = () => {

  const RedirectToHome = () => {
    const navigate = useNavigate();
    React.useEffect(() => {
      navigate('/');
    }, [navigate]);
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Suspense fallback={<div className='loadingScreenWrapper'><div className='loadingScreen'></div></div>}>
          <Routes>
            <Route path='/' element={<Main />}/>
            <Route path="/sign-up" element={<Authenticate />} />
            <Route path="/log-in" element={<Authenticate />} />
            <Route path='*' element={<RedirectToHome />}/>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  );
}

export default App;
