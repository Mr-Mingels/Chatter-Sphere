import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Outlet, Link } from "react-router-dom";
import axios from 'axios';
import '../styles/Main.css'
import Modal from './Modal'
import ParticleBackGround from "./ParticleBackGround";
import { io } from 'socket.io-client';

const socket = io('https://chatter-sphere-app-api.onrender.com/');

const Main = ({ setExtractedUserInfo, setExtractedChatsListInfo, getChatListInfoFunction, extractedRenderedChatMsgs, windowWidth }) => {
  const [sideBarOpen, setSideBarOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [userInfo, setUserInfo] = useState()
  const [modalConfig, setModalConfig] = useState(null)
  const [informModalTxt, setInformModalTxt] = useState('')
  const [informModalOpen, setInformModalOpen] = useState(false)
  const [informModalColor, setInformModalColor] = useState('')
  const [chatsListInfo, setChatsListInfo] = useState()
  const [searchedChatsListInfo, setsearchedChatsListInfo] = useState([])
  const [isLinkClicked, setIsLinkClicked] = useState(false);
  const [nightMode, setNightMode] = useState(false)


    const navigate = useNavigate();
    const location = useLocation()

    useEffect(() => {
      if (isLinkClicked && extractedRenderedChatMsgs) {
        setIsLinkClicked(false)
      }
    }, [extractedRenderedChatMsgs])

    const getUserInfo = async () => {
      try {
        const response = await fetch('https://chatter-sphere-app-api.onrender.com/', { credentials: 'include' });
        // check for user authentication
        if (response.status === 401) {
          navigate('/sign-up');
        } else {
          const userData = await response.json()
          setUserInfo(userData)
        }
      } catch (error) {
        console.log(error)
      }
    };

    const getChatListInfo = async () => {
      try {
          const response = await axios.get('https://chatter-sphere-app-api.onrender.com/users/chats', { withCredentials: true })
          const sortedChats = [...response.data].sort((a, b) => {
            if (a._id === "648eeb75f2371f976c3448cc") return -1;
            if (b._id === "648eeb75f2371f976c3448cc") return 1;
            return 0;
          });
          if (response.status === 200 && response.data) {
            setChatsListInfo(sortedChats)
            setsearchedChatsListInfo(sortedChats)
          } else {
              setChatsListInfo([])
              setsearchedChatsListInfo([])
          }
      } catch (err) {
          console.log(err)
      }
  }

  useEffect(() => {
    getChatListInfoFunction(getChatListInfo)
  },[])

    useEffect(() => {
      getUserInfo()
      getChatListInfo()
    }, [])

    useEffect(() => {
      setExtractedUserInfo(userInfo)
    },[userInfo])

    useEffect(() => {
      setExtractedChatsListInfo(chatsListInfo)
    },[chatsListInfo])

    const logOut = async () => {
      try {
        const response = await axios.get('https://chatter-sphere-app-api.onrender.com/log-out', { withCredentials: true });
        if (response.status === 200) {
          navigate('/log-in')
        }
      } catch (err) {
        console.log(err)
      }
    }

    const handleOpenSideBar = () => {
      setSideBarOpen(true)
  }

  const handleCloseSideBar = () => {
      setSideBarOpen(false)
  }

  const openModal = (config) => {
    setModalConfig(config)
    setSideBarOpen(false)
    setModalOpen(true)
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setInformModalOpen(false);
    }, 5000);
    return () => clearTimeout(timeoutId);
  },[informModalOpen, informModalTxt])

  const handleChatsListInfoSearch = (event) => {
    const value = event.target.value.toLowerCase();
  
    setsearchedChatsListInfo(chatsListInfo.filter(chat => {
        // For non-group chats, include if the search term matches the friend's username or the chat name
        return (chat.friend && chat.friend.username.toLowerCase().includes(value)) ||
          (chat.chatName && chat.chatName.toLowerCase().includes(value));
    }));
  };

  useEffect(() => {
    // Join the user's socket room
    if (userInfo) {
      socket.emit('joinUser', userInfo._id);

      socket.on('friendRequestAccepted', (friendUserId) => {
        // Handle the friend request acceptance, such as updating the friend-related lists
        // Perform any necessary actions here
        getChatListInfo();
      });

      socket.on('friendRemoved', (friendUserId, chat) => {
        getChatListInfo();
      })

      // Listen for the 'memberAdded' event
      socket.on('memberAdded', () => {
        // Handle the member addition, such as updating the UI or taking any necessary actions
        getChatListInfo();
        // Perform any necessary actions here
      });

      socket.on('chatDeleted', (deletedChatId) => {
        // Handle the chat deletion, such as updating the UI or taking any necessary actions
        getChatListInfo()
        // Perform any necessary actions here
      });

      socket.on('chatDeletedMembers', async (deletedChatId) => {
        getChatListInfo()
      })

      socket.on('groupPictureAdded', async () => {
        getChatListInfo()
      })

      socket.on('profilePictureAdded', async () => {
        getChatListInfo()
    })

      return () => {
        socket.off('friendRequestAccepted');
        socket.off('friendRemoved');
        socket.off('memberAdded');
        socket.off('chatDeleted');
        socket.off('chatDeletedMembers');
        socket.off('groupPictureAdded');
        socket.off('profilePictureAdded');
      };
    }
  }, [userInfo]);

  const setDarkMode = () => {
    document.querySelector("body").setAttribute("data-theme", "dark")
    localStorage.setItem("selectedTheme", "dark")
    setNightMode(true)
  }
  const setLightMode = () => {
    document.querySelector("body").setAttribute("data-theme", "light")
    localStorage.setItem("selectedTheme", "light")
    setNightMode(false)
  }

  useEffect(() => {
    const selectedTheme = localStorage.getItem("selectedTheme")

    if  (selectedTheme === "dark") {
      setDarkMode()
    } else {
      setLightMode()
    }
  },[])


  const toggleNightMode = () => {
    if (nightMode) setLightMode()
    if(!nightMode) setDarkMode()
  }

    if (!userInfo) {
      return <div className="loaderWrapper"><span class="loader"></span></div>
    }

    return (
      <div className='mainWrapper'>
        <div className={`informModalWrapper ${informModalColor === 'red' ? 'redColor' : 'greenColor'} ${informModalOpen ? 'open' : ''}`}>
            <h3 className='informModalTxt'>{informModalColor === 'red' ? 'Error: ' : ''}{informModalTxt}</h3>
        </div>
        <section className='chatsWrapper'>
        <div className={`fullPageWrapper ${sideBarOpen || modalOpen ? 'open' : ''}`} onClick={() => handleCloseSideBar()}>
        {modalOpen &&(
          <Modal modalConfig={modalConfig} userInfo={userInfo} setModalOpen={setModalOpen} getUserInfo={getUserInfo} 
          setInformModalTxt={setInformModalTxt} setInformModalOpen={setInformModalOpen} setInformModalColor={setInformModalColor}
          getChatListInfo={getChatListInfo}/>
        )}
                <div className={`sideBarWrapper ${sideBarOpen ? 'open' : ''}`} onClick={event => event.stopPropagation()}>
                    <div className="sideBarContent">
                      <div className="sideBarUserInfoWrapper">
                          {userInfo.profilePicture ? <img src={`${userInfo.profilePicture}`} 
                          className="sideBarProfileImg" onMouseDown={(e) => e.preventDefault()}/> : 
                          <div className="sideBarDefaultProfileImg">{userInfo.username.charAt(0)}</div>}
                          <h6 className="sideBarUserName">{userInfo.username}</h6>
                      </div>
                      <div className="sideBarOptionsWrapper">
                          <ul className="optionWrapper">
                            <li className="option" onClick={() => openModal('new group')}>
                              <div className="optionIconWrapper">
                                <svg xmlns="http://www.w3.org/2000/svg" className="optionIcon" viewBox="0 0 640 512">
                                  <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 
                                  304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 
                                  8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 
                                  17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 
                                  128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z"/>
                                </svg>
                              </div>
                              New Group
                            </li>
                            <li className="option" onClick={() => openModal('friends')}>
                              <div className="optionIconWrapper">
                                <svg xmlns="http://www.w3.org/2000/svg" className="optionIcon" viewBox="0 0 448 512">
                                  <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 
                                  13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"/></svg>
                              </div>Friends</li>
                            <li className="option" onClick={() => openModal('friend requests')}>
                              <div className="optionIconWrapper">
                                <svg xmlns="http://www.w3.org/2000/svg" className="optionIcon" viewBox="0 0 640 512"><path d="M96 128a128 128 0 1 1 
                                256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 
                                16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM504 312V248H440c-13.3 0-24-10.7-24-24s10.7-24 
                                24-24h64V136c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H552v64c0 13.3-10.7 
                                24-24 24s-24-10.7-24-24z"/></svg>
                              </div>Friend Requests</li>
                            <li className="option" onClick={() => openModal('add a profile picture')}>
                              <div className="optionIconWrapper">
                                <svg xmlns="http://www.w3.org/2000/svg" className="optionIcon" viewBox="0 0 448 512">
                                  <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 
                                  32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg>
                              </div>Add Profile Picture</li>
                            <li className="option" onClick={() => toggleNightMode()}>
                              <div className="optionIconWrapper">
                                {nightMode ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="optionIcon" viewBox="0 0 512 512">
                                  <path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 
                                  15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 
                                  9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 
                                  391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 
                                  11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 
                                  15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z"/></svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="optionIcon" viewBox="0 0 384 512">
                                  <path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 
                                  6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 
                                  36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"/></svg>
                                )}
                              </div>{nightMode ? 'Light Mode' : 'Night Mode'}</li>
                              <li className="option" onClick={() => openModal('userID')}>
                              <div className="optionIconWrapper">
                              <svg xmlns="http://www.w3.org/2000/svg" className="optionIcon" viewBox="0 0 384 512">
                                <path d="M256 48V64c0 17.7-14.3 32-32 32H160c-17.7 0-32-14.3-32-32V48H64c-8.8 0-16 7.2-16 
                                16V448c0 8.8 7.2 16 16 16H320c8.8 0 16-7.2 16-16V64c0-8.8-7.2-16-16-16H256zM0 64C0 28.7 28.7 
                                0 64 0H320c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zM160 320h64c44.2 
                                0 80 35.8 80 80c0 8.8-7.2 16-16 16H96c-8.8 0-16-7.2-16-16c0-44.2 35.8-80 80-80zm-32-96a64 
                                64 0 1 1 128 0 64 64 0 1 1 -128 0z"/></svg>
                              </div>User ID</li>
                          </ul>
                      </div>
                      <div className="sideBarFooterWrapper">
                        {windowWidth <= 500 && (
                          <button className="sideBarCloseBtn" onClick={() => handleCloseSideBar ()}>Close</button>
                        )}
                        <button className="sideBarLogOutBtn" onClick={() => logOut()}>Log Out</button>
                      </div>
                    </div>
                </div>
            </div>
            <div className='chatsContent'>
                <nav className='chatsNavBar'><svg xmlns="http://www.w3.org/2000/svg" className='hamburgerMenu' viewBox="0 0 448 512" 
                onClick={() => handleOpenSideBar()}>
                  <path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 
                  14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 
                  0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"/></svg>
                  <input className='navSearchInput' placeholder='Search Chats...' onChange={handleChatsListInfoSearch}/>
                </nav>
                <div className="friendAndGroupChatsWrapper">
                    <div className="friendAndGroupChatsContent">
                    {searchedChatsListInfo.map((chat, index) =>
                          <Link className={`chatWrapper ${location.pathname.split("/")[2] === chat._id ? 'inChat' : ''}`} 
                          key={index} to={`/chats/${chat._id}/messages`} onMouseDown={(e) => e.preventDefault()} onClick={(e) => {
                            if (location.pathname.split("/")[2] === chat._id) return
                            if (isLinkClicked) {
                              e.preventDefault()
                            } else {
                              setIsLinkClicked(true)
                            }
                          }}>
                          {chat.friend && (
                            <>
                              {chat.friend.profilePicture ? <img src={`${chat.friend.profilePicture}`} 
                              className="chatImg"/> : <div className="chatDefaultImgWrapper">
                              <h3 className="chatDefaultImg">{chat.friend.username.charAt(0)}</h3></div>}
                              <span className="chatName">
                                {chat.friend.username.charAt(0) + chat.friend.username.slice(1).toLowerCase()}
                              </span>
                            </>
                          )}
                          {chat.isGroupChat && (
                            <>
                              {chat.groupPicture ? <img src={`${chat.groupPicture}`} 
                              className="chatImg"/> : <div className="chatDefaultImgWrapper">
                              <h3 className="chatDefaultImg">{chat.chatName.charAt(0)}</h3></div>}
                              <span className="chatName">
                                {chat.chatName.charAt(0) + chat.chatName.slice(1).toLowerCase()}
                              </span>
                            </>
                          )}
                          </Link>
                        )}
                    </div>
                </div>
            </div>
        </section>
        <section className={`chatMessagesSectionWrapper ${location.pathname !== '/' ? 'open': ''}`}>
          <ParticleBackGround />
          <Outlet />
        </section>
      </div>
    )
}

export default Main