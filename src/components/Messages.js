import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import '../styles/Messages.css'
import { io } from 'socket.io-client';


const Messages = () => {
    const [messageTxt, setMessageTxt] = useState('')
    const [chatMessages, setChatMessages] = useState([])
    const [loader, setLoader] = useState(true)
    const socket = io('http://localhost:5000');

    const messagesEndRef = useRef(null)
    const location = useLocation()
    const navigate = useNavigate()

    const chatId = location.pathname.split("/")[2]

    const getChatMessages =  async () => {
        try {
            const response = await axios.get(`http://localhost:5000/chats/${chatId}/messages`, { withCredentials: true })
            if (response.status === 200) {
                setChatMessages(response.data)
                console.log(response.data)
            }
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        setLoader(true)
        getChatMessages()
    },[navigate])

    const createMessage = async () => {
        try {
          const idInfo = {
            chatId: chatId,
            message: messageTxt,
          };
          const response = await axios.post(`http://localhost:5000/messages`, { idInfo }, { withCredentials: true });
          setMessageTxt('');
        } catch (err) {
          console.log(err);
          setMessageTxt('');
        }
      };
      

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView()
        setLoader(false)
    }

    useEffect(() => {
        scrollToBottom()
    }, [chatMessages])

    useEffect(() => {
        // Join the chat room on the client side
        socket.emit('joinChat', chatId);
      
        // Receive a message
        socket.on('messageReceived', (message) => {
          // Update the chatMessages state with the received message
          setChatMessages((prevChatMessages) => [...prevChatMessages, message]);
        });
      
        // Clean up the event listener when the component unmounts
        return () => {
          socket.off('messageReceived');
        };
      }, [chatId]);

    return (
        <div className="messagesWrapper">
            <div className="messagesContent">
                {loader &&(
                    <div className="messagesLoaderWrapper">
                        <div className="messagesLoader"></div>
                    </div>
                )}
                {chatMessages.map((message, index) =>
                    <div className="chatMessageWrapper" key={index}>
                        {message.sender.profilePicture ? <img src={`${message.sender.profilePicture}`} 
                            className="messageSenderImg"/> : <div className="messageSenderDefaultImgWrapper">
                            <h3 className="messageSenderDefaultImg">{message.sender.username}</h3></div>}
                            <p className="messageTxt">{message.message}</p>
                            <div className="messageInfoWrapper">
                                <span className="messageSenderUserName">{message.sender.username.charAt(0) +  
                                message.sender.username.slice(1).toLowerCase()}</span>
                                <span className="messageBullet"> &bull; </span>
                                <span className="messageDate">{new Date(message.timestamp).toLocaleTimeString([], 
                                    { timeStyle: 'short' })}</span>
                            </div>
                    </div>
                )}
                <div ref={messagesEndRef}></div>
            </div>
            <div className="messagesFooterWrapper">
                <div className="messagesFooterContent">
                    <form className="messagesFooterForm" onSubmit={(event) => {event.preventDefault(); createMessage(location.pathname.split("/")[2]);}}>
                        <input className="messagesFooterInput" placeholder="Write a message..." 
                        onChange={(e) => setMessageTxt(e.target.value)} value={messageTxt}/>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Messages