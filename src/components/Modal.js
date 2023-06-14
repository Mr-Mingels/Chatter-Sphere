import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import '../styles/Modal.css'

const Modal = ({ modalConfig, userInfo, setModalOpen, getUserInfo, setInformModalOpen, setInformModalTxt, setInformModalColor, 
    getChatListInfo}) => {
    const [modalHeaderTxt, setModalHeaderTxt] = useState(null)
    const [newGroupModal, setNewGroupModal] = useState(false)
    const [friendsListModal, setFriendsListModal] = useState(false)
    const [friendRequestsModal, setFriendRequestsModal] = useState(false)
    const [addProfilePictureModal, setAddProfilePictureModal] = useState(false)
    const [userIdModal, setUserIdModal] = useState(false)
    const [groupImg, setGroupImg] = useState()
    const [userIdCopied, setUserIdCopied] = useState(false)
    const [recievedFriendRequests, setRecievedFriendRequests] = useState()
    const [sentFriendRequests, setSentFriendRequests] = useState()
    const [viewSentFriendRequests, setViewSentFriendRequests] = useState(false)
    const [viewRecievedFriendRequests, setViewRecievedFriendRequests] = useState(true)
    const [addFriendModal, setAddFriendModal] = useState(false)
    const [redAddFriendPlaceHolder, setRedAddFriendPlaceHolder] = useState(false)
    const [searchedFriends, setSearchedFriends] = useState([]);
    const [selectedProfileImgFile, setSelectedProfileImgFile] = useState(null);
    const [selectedGroupImgFile, setSelectedGroupImgFile] = useState(null);
    const [friendsList, setFriendsList] = useState()
    const [friendUserId, setFriendUserId] = useState({
        value: '',
        placeholder: 'Type your friends User ID here...'
      });

    const allConfig = [newGroupModal, friendsListModal, friendRequestsModal, addProfilePictureModal, userIdModal]

    const userIdInputRef = useRef()

    useEffect(() => {
        if (friendUserId.value !== '') {
            setRedAddFriendPlaceHolder(false)
            setFriendUserId({ ...friendUserId, placeholder: 'Type your friends User ID here...' })
        }
      }, [friendUserId.value])

    useEffect(() => {
        if (modalConfig === 'new group') {
            setModalHeaderTxt('New Group')
            setNewGroupModal(true)
        } else if (modalConfig ==='friends') {
            getFriendsList()
            setModalHeaderTxt('Friends List')
            setFriendsListModal(true)
        } else if (modalConfig ==='friend requests') {
            getRecievedRequestUserInfo()
            setModalHeaderTxt('Friend Requests')
            setFriendRequestsModal(true)
        } else if (modalConfig ==='add a profile picture') {
            setModalHeaderTxt('Add Profile Picture')
            setAddProfilePictureModal(true)
        } else if (modalConfig ==='userID') {
            setModalHeaderTxt('USER ID')
            setUserIdModal(true)
        }
    },[modalConfig])

    const copyUserId = async () => {
        await navigator.clipboard.writeText(userIdInputRef.current.value);
        setUserIdCopied(true)
        setTimeout(() => {
            setUserIdCopied(false)
        }, 2000);
    }

    const closeModal = () => {
        setModalOpen(false)
    }

    const openAddFriendModal = () => {
        setFriendRequestsModal(false)
        setFriendsListModal(false)
        setAddFriendModal(true)
        console.log(friendUserId.placeholder)
    }

    const sendFriendRequest = async () => {
        const friendRequestObject = {
            friend: friendUserId.value
        }
        try {
            const response = await axios.put('http://localhost:5000/send-friend-request', friendRequestObject, { withCredentials: true });
            if (response.status === 200) {
                setInformModalTxt(`Sent friend request!`)
                setInformModalColor('green')
                setInformModalOpen(true)
                closeModal()
            }
          } catch (err) {
            console.log(err)
            if (err.response.data.message === "They're already your friend") {
                setRedAddFriendPlaceHolder(true)
                setFriendUserId({ ...friendUserId, value: '', placeholder: 'User is already your friend' })
            } else if (err.response.data.message === "You've already sent them a friend request") {
                setRedAddFriendPlaceHolder(true)
                setFriendUserId({ ...friendUserId, value: '', placeholder: "You've already sent them a friend request" })
            } else if (err.response.data.message === "User not found") {
                setRedAddFriendPlaceHolder(true)
                setFriendUserId({ ...friendUserId, value: '', placeholder: "User not found" })
            }
          }
    }

    const openSentFriendRequests = () => {
        setViewSentFriendRequests(true)
        setViewRecievedFriendRequests(false)
    }

    const openRecievedFriendRequests = () => {
        setViewSentFriendRequests(false)
        setViewRecievedFriendRequests(true)
    }

    const getSentRequestUserInfo = async () => {
        try {   
            const response = await axios.get('http://localhost:5000/sent-friend-requests', { withCredentials: true });
            console.log(response)
            console.log(response.data)
            if (response.status === 200 && response.data) {
                setSentFriendRequests(response.data)
                console.log(sentFriendRequests)
            }
            openSentFriendRequests()
        } catch (err) {
            console.log(err)
            openSentFriendRequests()
        }
    }

    const getRecievedRequestUserInfo = async () => {
        try {   
            const response = await axios.get('http://localhost:5000/received-friend-requests', { withCredentials: true });
            console.log(response)
            console.log(response.data)
            if (response.status === 200 && response.data) {
                setRecievedFriendRequests(response.data)
                console.log(recievedFriendRequests)
                console.log(friendRequestsModal)
            } else {
                setRecievedFriendRequests([])
            }
            openRecievedFriendRequests()
        } catch (err) {
            console.log(err)
            setRecievedFriendRequests([])
            openRecievedFriendRequests()
        }
    }

    const acceptFriendRequest = async (requestedFriendId, requestedFriendUserName) => {
        try {
            const response = await axios.put('http://localhost:5000/accept-friend-request', { requestedFriendId }, { withCredentials: true })
            if (response.status === 200) {
                setRecievedFriendRequests(prevRequests => prevRequests.filter(user => user._id.toString() !== requestedFriendId));
                setInformModalTxt(`Accepted ${requestedFriendUserName.charAt(0) + requestedFriendUserName.slice(1).toLowerCase()}'s 
                friend request!`)
                setInformModalColor('green')
                setInformModalOpen(true)
                getRecievedRequestUserInfo()
                getChatListInfo()
            }
        } catch (err) {
            console.log(err)
        }
    }

    const declineFriendRequest = async (requestedFriendId, requestedFriendUserName) => {
        try {
            const response = await axios.put('http://localhost:5000/decline-friend-request', { requestedFriendId }, { withCredentials: true })
            if (response.status === 200) {
                setRecievedFriendRequests(prevRequests => prevRequests.filter(user => user._id.toString() !== requestedFriendId));
                setInformModalTxt(`Declined ${requestedFriendUserName.charAt(0) + requestedFriendUserName.slice(1).toLowerCase()}'s 
                friend request!`)
                setInformModalColor('green')
                setInformModalOpen(true)
                getRecievedRequestUserInfo()
            }
        } catch (err) {
            console.log(err)
        }
    }

    const unsendFriendRequest = async (requestedFriendId) => {
        try {
            const response = await axios.put('http://localhost:5000/unsend-friend-request', { requestedFriendId }, { withCredentials: true })
            console.log('triggered')
            if (response.status === 200) {
                setSentFriendRequests(prevRequests => prevRequests.filter(user => user._id.toString() !== requestedFriendId));
                setInformModalTxt(`Unsent friend request!`)
                setInformModalColor('green')
                setInformModalOpen(true)
            }
        } catch (err) {
            console.log(err)
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

    const removeFriend = async (friendId, friendUserName) => {
        try {
            const response = await axios.put('http://localhost:5000/remove-friend', { friendId }, { withCredentials: true })
            console.log(response)
            if (response.status === 200) {
                setInformModalTxt(`Removed ${friendUserName.charAt(0) + friendUserName.slice(1).toLowerCase()} from your friends list!`)
                setInformModalColor('green')
                setInformModalOpen(true)
                setSearchedFriends(prevFriends => prevFriends.filter(user => user._id.toString() !== friendId));
                getChatListInfo()
            }
        } catch (err) {
            console.log(err)
        }
    }

    const handleFriendsListSearch = (event) => {
        const value = event.target.value.toLowerCase();
        setSearchedFriends(friendsList.filter(friend => friend.username.toLowerCase().includes(value)));
    };

    const handleProfileImgFileChange = (event) => {
        setSelectedProfileImgFile(event.target.files[0]);
    };

    useEffect(() => {
        console.log(selectedProfileImgFile)
    },[selectedProfileImgFile])
    
    const addProfileImg = async () => {
        if (selectedProfileImgFile.type !== 'image/jpeg' || selectedProfileImgFile.type === 'image/png') {
            setInformModalTxt('Invalid file type, only JPEG and PNG is allowed!')
            setInformModalColor('red')
            setInformModalOpen(true)
            return;
        }
        const formData = new FormData(); 
        formData.append('profilePicture', selectedProfileImgFile);
        formData.append('userId', userInfo._id);
        try {
            const response = await axios.put(`http://localhost:5000/add-profile-picture`, formData, { 
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            console.log(response.message)
            if (response.status === 200) {
                setInformModalTxt('Profile picture updated!')
                setInformModalColor('green')
                setInformModalOpen(true)
                closeModal()
                getUserInfo()
            } else if (response.status === 400) {

            }
        } catch (err) {
            console.log(err)
        }
    }
    


    return (
        <section className="modalWrapper">
            {addFriendModal &&(
                <div className="addFriendModalContent">
                    <div className="addFriendModalHeaderWrapper">
                        <h3 className="addFriendModalHeader">Add a Friend</h3>
                    </div>
                    <div className="addFriendModalMainContentWrapper">
                            <div className="addFriendModalMainContent">
                                <label className="addFriendModalInputLabel">User ID:</label>
                                <input name="friendRequest" className={`addFriendModalInput ${redAddFriendPlaceHolder ? 'field' : ''}`} 
                                value={friendUserId.value} onChange={(e) => setFriendUserId({ ...friendUserId, value: e.target.value })}
                                placeholder={friendUserId.placeholder} />   
                            </div>
                        <div className="addFriendModalFooterWrapper">
                            <button className="addFriendModalBtn" onClick={() => closeModal()}>Close</button>
                            <button className="addFriendModalBtn" onClick={() => sendFriendRequest()}>Send</button>
                        </div>
                    </div>
                </div>
            )}
            <div className={`modalContent ${(friendRequestsModal ? recievedFriendRequests : true) && (friendsListModal ? friendsList : true) &&
            allConfig.some(config => config) ? 'render' : ''} 
            ${addFriendModal ? 'close' : ''}`}>
                <div className="modalHeaderWrapper">
                    <h3 className="modalHeader">{modalHeaderTxt}</h3>
                    {friendsListModal &&(
                        <div className="friendsModalSearchInputWrapper">
                            <svg xmlns="http://www.w3.org/2000/svg" className="friendsModalSearchIcon" viewBox="0 0 512 512">
                                <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 
                                0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 
                                352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>
                                <input className="friendsModalSearchInput" placeholder="Search" onChange={handleFriendsListSearch}></input>
                        </div>
                    )}
                </div>
                    {newGroupModal && (
                        <div className="groupModalMainContentWrapper">
                            <div className="groupModalMainContent">
                                {groupImg ? <img/> : <div className="defaultGroupModalImg"><svg xmlns="http://www.w3.org/2000/svg" 
                                className="groupModalImg" viewBox="0 0 512 512"><path d="M149.1 64.8L138.7 96H64C28.7 96 0 124.7 0 160V416c0 35.3 28.7 
                                64 64 64H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H373.3L362.9 64.8C356.4 45.2 338.1 32 
                                317.4 32H194.6c-20.7 0-39 13.2-45.5 32.8zM256 192a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"/></svg></div>}
                                <input name="groupName" className="groupModalInput" placeholder="Group name"/>
                            </div>
                            <div className="groupModalFooterWrapper">
                                <button className="groupModalBtn" onClick={() => closeModal()}>Cancel</button>
                                <button className="groupModalBtn">Create</button>
                            </div>
                        </div>
                    )}
                    {friendsListModal && (
                        <div className="friendModalMainContentWrapper">
                            <div className="friendModalMainContent">
                            {searchedFriends && searchedFriends.map((user, index) => (
                                <div className="friendModalSentUserContentWrapper" key={index}>
                                    {user.profilePicture ? <img src={`${user.profilePicture}`} 
                                    className="friendModalProfileImg"/> : <div className="friendModalDefaultProfileImgWrapper">
                                    <h3 className="friendModalDefaultProfileImg">{user.username.charAt(0)}</h3></div>}
                                    <span className="friendModalUserName">
                                        {user.username.charAt(0) + user.username.slice(1).toLowerCase()}
                                    </span>
                                    <button className="friendModalRemoveBtn" 
                                    onClick={() => removeFriend(user._id.toString(), user.username)}>Remove</button>
                                </div>
                            ))}
                            </div>
                            <div className="friendModalFooterWrapper">
                                <button className="friendModalBtn" onClick={() => closeModal()}>Close</button>
                                <button className="friendModalBtn" onClick={() => openAddFriendModal()}>Add a Friend</button>
                            </div>
                        </div>
                    )}
                    {(friendRequestsModal && recievedFriendRequests) && (
                        <div className="friendRequestsModalMainContentWrapper">
                            <div className="friendRequestsModalSelectBtnWrapper">
                                <button className={`friendRequestsModalSelectBtn ${viewRecievedFriendRequests ? 'viewRecieved' : ''}`} 
                                onClick={() => getRecievedRequestUserInfo()}>Recieved</button>
                                <button className={`friendRequestsModalSelectBtn ${viewSentFriendRequests ? 'viewSent' : ''}`} 
                                onClick={() => getSentRequestUserInfo()}>Sent</button>
                            </div>
                            <div className="friendRequestsModalMainContent">
                            {(sentFriendRequests && viewSentFriendRequests) && sentFriendRequests.map((user, index) => (
                                <div className="friendRequestsModalSentUserContentWrapper" key={index}>
                                    {user.profilePicture ? <img src={`${user.profilePicture}`} 
                                    className="friendRequestsModalProfileImg"/> : <div className="friendRequestModalDefaultProfileImgWrapper">
                                    <h3 className="friendRequestsModalDefaultProfileImg">{user.username.charAt(0)}</h3></div>}
                                    <span className="friendRequestsModalUserName">
                                        {user.username.charAt(0) + user.username.slice(1).toLowerCase()}
                                    </span>
                                    <button className="friendRequestsModalUnsendBtn" 
                                    onClick={() => unsendFriendRequest(user._id.toString())}>Unsend</button>
                                </div>
                            ))}
                            {(recievedFriendRequests && viewRecievedFriendRequests) && recievedFriendRequests.map((user, index) => (
                                <div className="friendRequestsModalSentUserContentWrapper" key={index}>
                                    {user.profilePicture ? <img src={`${user.profilePicture}`} 
                                    className="friendRequestsModalProfileImg"/> : <div className="friendRequestModalDefaultProfileImgWrapper">
                                    <h3 className="friendRequestsModalDefaultProfileImg">{user.username.charAt(0)}</h3></div>}
                                    <span className="friendRequestsModalUserName">
                                        {user.username.charAt(0) + user.username.slice(1).toLowerCase()}
                                    </span>
                                    <div className="friendRequestsModalBtnWrapper">
                                        <button className="friendRequestsModalAcceptBtn" 
                                        onClick={() => acceptFriendRequest(user._id.toString(), user.username)}>Accept</button>
                                        <button className="friendRequestsModalDeclineBtn" 
                                        onClick={() => declineFriendRequest(user._id.toString(), user.username)}>Decline</button>
                                    </div>
                                </div>
                            ))}
                            </div>
                            <div className="friendRequestsModalFooterWrapper">
                                <button className="friendRequestsModalBtn" onClick={() => closeModal()}>Close</button>
                                <button className="friendRequestsModalBtn" onClick={() => openAddFriendModal()}>Add a Friend</button>
                            </div>
                        </div>
                    )}
                    {addProfilePictureModal && (    
                        <div className="profilePicModalMainContentWrapper">
                            <div className="profilePicModalMainContent">
                                {selectedProfileImgFile ? <img src={URL.createObjectURL(selectedProfileImgFile)} className="profilePicModalImg" 
                                onClick={() => document.getElementById('hiddenFileInput').click()}/> : 
                                <div className="defaultProfilePicModalImg" onClick={() => document.getElementById('hiddenFileInput').click()}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="profileDefaultPicModalImg" viewBox="0 0 512 512">
                                <path d="M149.1 64.8L138.7 96H64C28.7 96 0 124.7 0 160V416c0 35.3 28.7 
                                64 64 64H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H373.3L362.9 64.8C356.4 45.2 338.1 32 
                                317.4 32H194.6c-20.7 0-39 13.2-45.5 32.8zM256 192a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"/></svg></div>}
                                <p className="profilePicTxt">Click the above icon to add an image</p>
                                <input id='hiddenFileInput' type='file' onChange={handleProfileImgFileChange} style={{display: 'none'}} />
                            </div>
                            <div className="profilePicModalFooterWrapper">
                                <button className="profilePicModalBtn" onClick={() => closeModal()}>Cancel</button>
                                <button className="profilePicModalBtn" onClick={() => addProfileImg()}>Add</button>
                            </div>
                        </div>
                    )}
                    {userIdModal && (
                        <div className="userIdModalMainContentWrapper">
                            <div className="userIdModalMainContent">
                                <label className="userIdModalInputLabel">Your User ID:</label>
                                <div className="userIdModalInputWrapper">
                                    <input className="userIdModalInput" type="text" ref={userIdInputRef} value={userInfo._id} 
                                    readOnly />
                                    <div className={`userIdModalIconImgWrapper ${userIdCopied ? 'copied' : ''}`} onClick={copyUserId}>
                                        {userIdCopied ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="userIdModalIcon" viewBox="0 0 448 512">
                                                <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 
                                                12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 
                                                393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="userIdModalIcon" viewBox="0 0 512 512">
                                                <path d="M272 0H396.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 
                                                33.9V336c0 26.5-21.5 48-48 48H272c-26.5 0-48-21.5-48-48V48c0-26.5 21.5-48 48-48zM48 
                                                128H192v64H64V448H256V416h64v48c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V176c0-26.5 
                                                21.5-48 48-48z"/>
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="userIdModalFooterWrapper">
                                <button className="userIdModalBtn" onClick={() => closeModal()}>Close</button>
                            </div>
                        </div>
                    )}
            </div>
        </section>
    )
}

export default Modal;