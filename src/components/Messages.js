import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import FriendsListModal from "./FriendsListModal";
import RemoveFriendModal from "./RemoveFriendModal";
import AddPictureModal from "./AddPictureModal";
import '../styles/Messages.css'
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const Messages = ({ extractedUserInfo, extractedChatsListInfo, chatListInfoFunction, setExtractedRenderedChatMsgs }) => {
    const [messageTxt, setMessageTxt] = useState('')
    const [chatMessages, setChatMessages] = useState([])
    const [loader, setLoader] = useState(true)
    const [currentChatInfo, setCurrentChatInfo] = useState()
    const [groupOptionsModal, setGroupOptionsModal] = useState(false)
    const [friendsListModal, setFriendsListModal] = useState(false)
    const [addGroupPictureModal, setAddGroupPictureModal]= useState(false)
    const [addGroupPictureModalTransition, setAddGroupPictureModalTransition] = useState(false)
    const [groupImgModalOption, setGroupImgModalOption] = useState(false)
    const [searchedFriends, setSearchedFriends] = useState([]);
    const [friendsList, setFriendsList] = useState();
    const [addMemberOption, setAddMemberOption] = useState(false)
    const [informModalTxt, setInformModalTxt] = useState('')
    const [informModalOpen, setInformModalOpen] = useState(false)
    const [informModalColor, setInformModalColor] = useState('')
    const [severingModal, setSeveringModal] = useState(false)
    const [severingModalOption, setSeveringModalOption] = useState('')
    const [addedFriendId, setAddedFriendId] = useState()
    const [addedFriendUserName, setAddedFriendUserName] = useState()
    const [renderedChatMessages, setRenderedChatMessages] = useState(false)
    const [selectedGroupImgFile, setSelectedGroupImgFile] = useState(null);

    const messagesEndRef = useRef(null)
    const location = useLocation()
    const navigate = useNavigate()

    const chatId = location.pathname.split("/")[2]

    useEffect(() => {
        const timeoutId = setTimeout(() => {
          setInformModalOpen(false);
        }, 5000);
        return () => clearTimeout(timeoutId);
      },[informModalOpen, informModalTxt])

    const getChatMessages =  async () => {
        try {
            const response = await axios.get(`http://localhost:5000/chats/${chatId}/messages`, { withCredentials: true })
            console.log(response)
            if (response.status === 200) {
                setChatMessages(response.data)
                console.log(response.data)
                setRenderedChatMessages(true)
            }
        } catch (err) {
            console.log(err)
            if (err.response.status === 400) {
                setRenderedChatMessages(true)
                navigate('/')
            }
        }
    }

    useEffect(() => {
        setExtractedRenderedChatMsgs(renderedChatMessages)
    },[renderedChatMessages])

    useEffect(() => {
        setRenderedChatMessages(false)
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
        if (extractedUserInfo && chatId) {
            socket.emit('joinChat', chatId);
            socket.emit('joinUser', extractedUserInfo._id);
          
            // Receive a message
            socket.on('messageReceived', (message) => {
              // Update the chatMessages state with the received message
              console.log(message.sender)
              console.log(message.sender._id)
                setChatMessages((prevChatMessages) => [...prevChatMessages, message]);
            });
    
            // Listen for the 'memberAdded' event
            socket.on('memberAdded', () => {
                // Handle the member addition, such as updating the UI or taking any necessary actions
                chatListInfoFunction();
                // Perform any necessary actions here
            });
    
            // Listen for the 'chatDeleted' event
            socket.on('chatDeleted', async (deletedChatId) => {
                // Handle the chat deletion, such as updating the UI or taking any necessary actions
                await chatListInfoFunction()
                if (deletedChatId === chatId) {
                    closeSeveringModal()
                    navigate('/')
                }
                // Perform any necessary actions here
              });
    
            socket.on('chatDeletedMembers', async (deletedChatId) => {
                await chatListInfoFunction()
                if (deletedChatId === chatId) {
                    closeSeveringModal()
                    navigate('/')
                }
            })

            socket.on('groupPictureAdded', async () => {
                chatListInfoFunction()
            })

            socket.on('profilePictureAdded', async () => {
                chatListInfoFunction()
            })
          
            // Clean up the event listener when the component unmounts
            return () => {
              socket.off('messageReceived');
              socket.off('memberAdded');
              socket.off('chatDeleted');
              socket.off('chatDeletedMembers');
              socket.off('groupPictureAdded');
              socket.off('profilePictureAdded');
            };
        }
      }, [chatId, extractedUserInfo]);

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

    const deleteGroup = async (currentChatId, currentChatMembers) => {
        try {
            const response = await axios.delete('http://localhost:5000/delete-group', { data: { currentChatId, currentChatMembers } }, { withCredentials: true })
            console.log(response)
        } catch (err) {
            console.log(err)
        }
    }

    const leaveGroup = async (currentChatId) => {
        try {
            const response = await axios.put('http://localhost:5000/leave-group', { currentChatId }, { withCredentials: true }) 
            console.log(response)
            if (response.status === 200) {
                await chatListInfoFunction()
                navigate('/')
            }
        } catch (err) {
            console.log(err)
        }
    }

    const addMemberToGroup = async (addedMemberIds, currentChatInfoId) => {
        try {
            const response = await axios.put('http://localhost:5000/add-member-to-group', { addedMemberIds, currentChatInfoId }, 
            { withCredentials: true })
            if (response.status === 200) {
                setInformModalTxt('Added member(s) to Group!')
                setInformModalColor('green')
                setInformModalOpen(true)
                closeFriendListModal()
                chatListInfoFunction()
            }
        } catch (err) {
            console.log(err)
            setInformModalTxt('Server Error')
                setInformModalColor('red')
                setInformModalOpen(true)
        }
    }

    const getFriendsList = async () => {
        try {
            const response = await axios.get('http://localhost:5000/friends-list', { withCredentials: true })
            console.log(response.data)
            if (response.status === 200 && response.data) {
                setFriendsList(response.data)
                setSearchedFriends(response.data)
            } else {
                setFriendsList([])
                setSearchedFriends([])
            }
        } catch (err) {
            console.log(err)
        }
    }

    const handleFriendsListSearch = (event) => {
        const value = event.target.value.toLowerCase();
        setSearchedFriends(friendsList.filter(friend => friend.username.toLowerCase().includes(value)));
    };

    const openFriendsListModal = () => {
        getFriendsList()
        setGroupOptionsModal(false);
        setAddMemberOption(true)
        setFriendsListModal(true)
    }

    const closeFriendListModal = () => {
        setFriendsListModal(false)
        setAddMemberOption(false)
        setFriendsList(false)
    }

    const openSeveringModal = (friendId, friendUserName, option) => {
        setAddedFriendId(friendId)
        setAddedFriendUserName(friendUserName)
        setSeveringModal(true)
        setSeveringModalOption(option)
        setGroupOptionsModal(false)
    }

    const closeSeveringModal = () => {
        setSeveringModal(false)
        setSeveringModalOption('')
    }

    const openAddPictureModal = () => {
        setAddGroupPictureModal(true)
        setGroupOptionsModal(false)
        setGroupImgModalOption(true)
        setTimeout(() => {
            setAddGroupPictureModalTransition(true)
        }, 50);
    }

    const closeAddPictureModal = () => {
        setAddGroupPictureModal(false)
        setAddGroupPictureModalTransition(false)
        setGroupImgModalOption(false)
        setSelectedGroupImgFile(null)
    }

    const removeFriend = async () => {
        try {
            const response = await axios.put('http://localhost:5000/remove-friend', { addedFriendId }, { withCredentials: true })
            console.log(response)
            if (response.status === 200) {
                setInformModalTxt(`Removed ${addedFriendUserName.charAt(0) + addedFriendUserName.slice(1).toLowerCase()} from your friends list!`)
                setInformModalColor('green')
                setInformModalOpen(true)
                closeSeveringModal()
            }
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        // Join the user's socket room
        if (extractedUserInfo) {
          socket.emit('joinUser', extractedUserInfo._id);

          socket.on('friendRequestAccepted', (friendUserId) => {
            // Handle the friend request acceptance, such as updating the friend-related lists
            // Perform any necessary actions here
            getFriendsList()
            chatListInfoFunction();
          });

          socket.on('friendRemoved', async (friendUserId, chat) => {
            await getFriendsList()
            await chatListInfoFunction();
            if (chat._id === chatId) {
                navigate('/')
            }
          })
      
          // Clean up the event listener when the component unmounts
          return () => {
            socket.off('friendRemoved');
            socket.off('friendRequestAccepted');
          };
        }
      }, [extractedUserInfo]);

      const handleGroupImgFileChange = (event) => {
        setSelectedGroupImgFile(event.target.files[0]);
    };

    const addGroupImg = async () => {
        if (!selectedGroupImgFile) {
            setInformModalTxt('Select an Image!')
            setInformModalColor('red')
            setInformModalOpen(true)
            return;
        }
        if (selectedGroupImgFile.type !== 'image/jpeg' || selectedGroupImgFile.type === 'image/png') {
            setInformModalTxt('Invalid file type, only JPEG and PNG is allowed!')
            setInformModalColor('red')
            setInformModalOpen(true)
            return;
        }
        const formData = new FormData(); 
        formData.append('groupPicture', selectedGroupImgFile);
        formData.append('chatId', chatId);
        try {
            const response = await axios.put(`http://localhost:5000/add-group-picture`, formData, { 
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            console.log(response.message)
            if (response.status === 200) {
                setInformModalTxt('Group picture updated!')
                setInformModalColor('green')
                setInformModalOpen(true)
                closeAddPictureModal()
            }
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <div className="messagesWrapper">
            <div className={`messagesInformModalWrapper ${informModalColor === 'red' ? 'redColor' : 'greenColor'} 
            ${informModalOpen ? 'open' : ''}`}>
                <h3 className='messagesInformModalTxt'>{informModalColor === 'red' ? 'Error: ' : ''}{informModalTxt}</h3>
            </div>
            {(friendsListModal && searchedFriends) &&(
                <div className={`messagesFullPageWrapper ${(friendsListModal ? friendsList : true) && friendsListModal ? 'open' : ''}`}>
                    {(friendsListModal && searchedFriends) &&(
                    <div className={`messagesModalContent ${(friendsListModal ? friendsList : true) && friendsListModal ? 'open' : ''}`}>
                        <FriendsListModal searchedFriends={searchedFriends} handleFriendsListSearch={handleFriendsListSearch}
                        closeFriendListModal={closeFriendListModal} addMemberOption={addMemberOption} addMemberToGroup={addMemberToGroup}
                        currentChatInfo={currentChatInfo} chatListInfoFunction={chatListInfoFunction}/>
                    </div>
                    )}
                </div>  
            )}
            {severingModal &&(
                <div className={`messagesFullPageWrapper ${severingModal ? 'open' : ''}`}>
                    <RemoveFriendModal removeFriend={removeFriend} closeSeveringModal={closeSeveringModal} 
                    severingModalOption={severingModalOption} currentChatInfo={currentChatInfo} deleteGroup={deleteGroup}
                    leaveGroup={leaveGroup}/>
                </div>
            )}
            {addGroupPictureModal && (
                <div className={`messagesFullPageWrapper ${addGroupPictureModalTransition ? 'open' : ''}`}>
                    <div className={`messagesModalContent ${addGroupPictureModalTransition ? 'open' : ''}`}>
                        <AddPictureModal selectedGroupImgFile={selectedGroupImgFile} handleGroupImgFileChange={handleGroupImgFileChange}
                        closeAddPictureModal={closeAddPictureModal} addGroupImg={addGroupImg} groupImgModalOption={groupImgModalOption}/>
                    </div>
                </div>
            )}
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
                                <button className="messageHeaderRemoveBtn" onClick={() => openSeveringModal(currentChatInfo.friend._id, 
                                    currentChatInfo.friend.username, 'removeFriend')}>Remove</button>
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
                                        <button className="groupOptionsModalBtn" onClick={() => openFriendsListModal()}>Add Member</button>
                                        {currentChatInfo.isOwner === extractedUserInfo._id && (
                                            <>
                                                <button className="groupOptionsModalBtn" onClick={() => openAddPictureModal()}>Add Picture
                                                </button>
                                                <button className="groupOptionsModalBtn red" 
                                                onClick={() => openSeveringModal(null, null, 'deleteGroup')}>
                                                    Delete Group</button>
                                            </>
                                        )}
                                        {currentChatInfo.isOwner !== extractedUserInfo._id && (
                                            <>
                                                <button className="groupOptionsModalBtn red" 
                                                onClick={() => openSeveringModal(null, null, 'leaveGroup')}>Leave Group</button>
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
                {chatMessages.map((message, index) => {
                    const messageDate = new Date(message.timestamp);
                    const currentDate = new Date();
                    const isSameDay =
                        messageDate.getDate() === currentDate.getDate() &&
                        messageDate.getMonth() === currentDate.getMonth() &&
                        messageDate.getFullYear() === currentDate.getFullYear();
                    let formattedDate;
                    
                    if (isSameDay) {
                        formattedDate = messageDate.toLocaleTimeString([], { timeStyle: 'short' });
                    } else {
                        formattedDate = `${messageDate.toLocaleDateString([], { dateStyle: 'short' })} \u2022 ${messageDate.toLocaleTimeString([], { timeStyle: 'short' })}`;
                    }
                    console.log(message)
                    return (
                        <div className={`chatMessageWrapper ${message.sender._id === extractedUserInfo._id ? 'usersMsg' : ''} 
                        ${(message.message === `${message.sender.username.charAt(0) + message.sender.username.slice(1).toLowerCase()} has left the group.` ||
                        message.message === `${message.sender.username.charAt(0) + message.sender.username.slice(1).toLowerCase()} has joined the group.`) 
                        ? 'userEvent' : ''}`} key={index}>
                        {
                        (message.message === `${message.sender.username.charAt(0) + message.sender.username.slice(1).toLowerCase()} has left the group.` ||
                            message.message === `${message.sender.username.charAt(0) + message.sender.username.slice(1).toLowerCase()} has joined the group.`) ? (
                            null
                        ) : (
                            message.sender.profilePicture ? (
                            <img src={`${message.sender.profilePicture}`} className="messageSenderImg" onMouseDown={(e) => e.preventDefault()} />
                            ) : (
                            <div className="messageSenderDefaultImgWrapper">
                                <h3 className="messageSenderDefaultImg">{message.sender.username.charAt(0)}</h3>
                            </div>
                            )
                        )
                        }
                        <p className="messageTxt">{message.message}</p>
                        <div className="messageInfoWrapper">
                            <span className="messageSenderUserName">{message.sender.username.charAt(0) + message.sender.username.slice(1).toLowerCase()}</span>
                            <span className="messageBullet"> &bull; </span>
                            <span className="messageDate">{formattedDate}</span>
                        </div>
                        </div>
                    );
                })}
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