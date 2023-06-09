import './App.css'
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import React, { lazy, Suspense  } from "react";

const SignUp = lazy(() => import('./components/SignUp'));
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
            <Route path="/sign-up" element={<SignUp />} />
            <Route path='*' element={<RedirectToHome />}/>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  );
}

export default App;
