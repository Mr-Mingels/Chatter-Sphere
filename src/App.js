import './App.css'
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import React, { lazy, Suspense, useEffect, useState  } from "react";

const Authenticate = lazy(() => import('./components/Authenticate'));
const Main = lazy(() => import('./components/Main'))
const Messages = lazy(() => import('./components/Messages'))

const App = () => {
  const [extractedUserInfo, setExtractedUserInfo] = useState()
  const [extractedChatsListInfo, setExtractedChatsListInfo] = useState()
  const [chatListInfoFunction, setChatListInfoFunction] = useState();
  const [extractedRenderedChatMsgs, setExtractedRenderedChatMsgs] = useState()
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const RedirectToHome = () => {
    const navigate = useNavigate();
    React.useEffect(() => {
      navigate('/');
    }, [navigate]);
  }

  const getChatListInfoFunction = (chatListInfoFunction) => {
    setChatListInfoFunction(() => chatListInfoFunction)
  }

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
  
    window.addEventListener('resize', handleResize);
  
    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Suspense fallback={<div className="loaderWrapper"><span className="loader"></span></div>}>
            <Routes>
              <Route path="/sign-up" element={<Authenticate windowWidth={windowWidth}/>} />
              <Route path="/log-in" element={<Authenticate windowWidth={windowWidth}/>} />
              <Route path="/" element={<Main setExtractedUserInfo={setExtractedUserInfo} 
              setExtractedChatsListInfo={setExtractedChatsListInfo} getChatListInfoFunction={getChatListInfoFunction}
              extractedRenderedChatMsgs={extractedRenderedChatMsgs} windowWidth={windowWidth}/>}>
                <Route path="chat/:chatId" element={<Messages extractedUserInfo={extractedUserInfo}
                extractedChatsListInfo={extractedChatsListInfo} chatListInfoFunction={chatListInfoFunction}
                setExtractedRenderedChatMsgs={setExtractedRenderedChatMsgs} windowWidth={windowWidth}/>}/>
              </Route>
              <Route path='*' element={<RedirectToHome />}/>
            </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  );
}

export default App;
