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

  const RedirectToHome = () => {
    const navigate = useNavigate();
    React.useEffect(() => {
      navigate('/');
    }, [navigate]);
  }

  const getChatListInfoFunction = (chatListInfoFunction) => {
    setChatListInfoFunction(() => chatListInfoFunction)
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Suspense fallback={<div className="loaderWrapper"><span className="loader"></span></div>}>
            <Routes>
              <Route path="/sign-up" element={<Authenticate />} />
              <Route path="/log-in" element={<Authenticate />} />
              <Route path="/" element={<Main setExtractedUserInfo={setExtractedUserInfo} 
              setExtractedChatsListInfo={setExtractedChatsListInfo} getChatListInfoFunction={getChatListInfoFunction}/>}>
                <Route path="chats/:chatId/messages" element={<Messages extractedUserInfo={extractedUserInfo}
                extractedChatsListInfo={extractedChatsListInfo} chatListInfoFunction={chatListInfoFunction}/>}/>
              </Route>
              <Route path='*' element={<RedirectToHome />}/>
            </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  );
}

export default App;
