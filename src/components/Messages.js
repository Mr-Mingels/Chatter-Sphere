import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import '../styles/Messages.css'
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const Messages = ({ extractedUserInfo, extractedChatsListInfo, chatListInfoFunction }) => {
    const [messageTxt, setMessageTxt] = useState('')
    const [chatMessages, setChatMessages] = useState([])
    const [loader, setLoader] = useState(true)
    const [currentChatInfo, setCurrentChatInfo] = useState()
    const [groupOptionsModal, setGroupOptionsModal] = useState(false)

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

      useEffect(() => {
        // Listen for the 'chatDeleted' event
        socket.on('chatDeleted', async () => {
          // Handle the chat deletion, such as updating the UI or taking any necessary actions
          await chatListInfoFunction()
          navigate('/')
          // Perform any necessary actions here
        });
    
        // Clean up the event listener when the component unmounts
        return () => {
          socket.off('chatDeleted');
        };
      }, []);

      useEffect(() => {
        if (extractedChatsListInfo) {
            const result = extractedChatsListInfo.find(id => id._id === chatId)
            console.log(result)
            setCurrentChatInfo(result)
        }
      },[extractedChatsListInfo, navigate])

      const toggleGroupOptions = () => {
        if (!groupOptionsModal) {
            setGroupOptionsModal(true)
        } else {
            setGroupOptionsModal(false)
        }
      }

      const closeGroupOptions = e => {
        if (!e.target.closest('.groupOptionsModalWrapper') && !e.target.closest('.verticalEllipsisMenu')) {
          setGroupOptionsModal(false);
        }
      };

      useEffect(() => {
        if (groupOptionsModal) {
          document.addEventListener('mousedown', closeGroupOptions);
        } else {
          document.removeEventListener('mousedown', closeGroupOptions);
        }
        // Clean up the event listener when the component is unmounted
        return () => document.removeEventListener('mousedown', closeGroupOptions);
      }, [groupOptionsModal]);

    const deleteGroup = async (currentChatId) => {
        try {
            const response = axios.delete('http://localhost:5000/delete-group', { data: { currentChatId } }, { withCredentials: true })
            console.log(response)
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <div className="messagesWrapper">
            <div className="messagesHeaderWrapper">
                {currentChatInfo && (
                    <div className="messagesHeaderContent">
                        {currentChatInfo.friend && (
                            <>
                                {currentChatInfo.friend.profilePicture ? <img src={`${currentChatInfo.friend.profilePicture}`} 
                                className="messageHeaderChatImg" onMouseDown={(e) => e.preventDefault()}/> : 
                                <div className="messageHeaderDefaultChatImgWrapper">
                                <h3 className="messageHeaderDefaultChatImg">{currentChatInfo.friend.username.charAt(0)}</h3></div>}
                                <h5 className="messageHeaderChatName">{currentChatInfo.friend.username.charAt(0) + 
                                currentChatInfo.friend.username.slice(1).toLowerCase()}</h5>
                                <button className="messageHeaderRemoveBtn">Remove</button>
                            </>
                        )}
                        {currentChatInfo.isGroupChat && (
                            <>
                              {currentChatInfo.groupPicture ? <img src={`${currentChatInfo.groupPicture}`} 
                                className="messageHeaderChatImg" onMouseDown={(e) => e.preventDefault()}/> : 
                                <div className="messageHeaderDefaultChatImgWrapper">
                                <h3 className="messageHeaderDefaultChatImg">{currentChatInfo.chatName.charAt(0)}</h3></div>}
                                <h5 className="messageHeaderChatName">{currentChatInfo.chatName.charAt(0) + 
                                currentChatInfo.chatName.slice(1).toLowerCase()}</h5>
                                <svg xmlns="http://www.w3.org/2000/svg" className="verticalEllipsisMenu" onClick={() => toggleGroupOptions()} viewBox="0 0 128 512">
                                <path d="M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 
                                56 0 1 0 0-112zM120 96A56 56 0 1 0 8 96a56 56 0 1 0 112 0z"/></svg>
                                {groupOptionsModal &&(
                                    <div className="groupOptionsModalWrapper">
                                        <button className="groupOptionsModalBtn">Add Member</button>
                                        {currentChatInfo.isOwner === extractedUserInfo._id && (
                                            <>
                                                <button className="groupOptionsModalBtn">Add Picture</button>
                                                <button className="groupOptionsModalBtn red" onClick={() => deleteGroup(currentChatInfo._id.toString())}>Delete Group</button>
                                            </>
                                        )}
                                        {currentChatInfo.isOwner !== extractedUserInfo._id && (
                                            <>
                                                <button className="groupOptionsModalBtn red">Leave Group</button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                          )}
                    </div>
                )}
            </div>
            <div className="messagesContent">
                {loader &&(
                    <div className="messagesLoaderWrapper">
                        <div className="messagesLoader"></div>
                    </div>
                )}
                {chatMessages.map((message, index) =>
                    <div className={`chatMessageWrapper ${message.sender._id === extractedUserInfo._id ? 'usersMsg' : ''}`} key={index}>
                        {message.sender.profilePicture ? <img src={`${message.sender.profilePicture}`} 
                            className="messageSenderImg" onMouseDown={(e) => e.preventDefault()}/> : 
                            <div className="messageSenderDefaultImgWrapper">
                            <h3 className="messageSenderDefaultImg">{message.sender.username.charAt(0)}</h3></div>}
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