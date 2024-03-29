import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RemoveFriendModal from "./RemoveFriendModal";
import AddFriendModal from "./AddFriendModal";
import FriendsListModal from "./FriendsListModal";
import AddPictureModal from "./AddPictureModal";
import axios from "axios";
import "../styles/Modal.css";
import { io } from "socket.io-client";

const socket = io(window.location.origin);

const Modal = ({
  modalConfig,
  userInfo,
  setModalOpen,
  getUserInfo,
  setInformModalOpen,
  setInformModalTxt,
  setInformModalColor,
  getChatListInfo,
}) => {
  const [modalHeaderTxt, setModalHeaderTxt] = useState(null);
  const [newGroupModal, setNewGroupModal] = useState(false);
  const [friendsListModal, setFriendsListModal] = useState(false);
  const [friendsListModalLoader, setFriendsListModalLoader] = useState(false);
  const [friendRequestsModal, setFriendRequestsModal] = useState(false);
  const [friendRequestsModalLoader, setFriendRequestsModalLoader] =
    useState(false);
  const [addProfilePictureModal, setAddProfilePictureModal] = useState(false);
  const [userIdModal, setUserIdModal] = useState(false);
  const [userIdCopied, setUserIdCopied] = useState(false);
  const [recievedFriendRequests, setRecievedFriendRequests] = useState();
  const [sentFriendRequests, setSentFriendRequests] = useState();
  const [viewSentFriendRequests, setViewSentFriendRequests] = useState(false);
  const [viewRecievedFriendRequests, setViewRecievedFriendRequests] =
    useState(true);
  const [addFriendModal, setAddFriendModal] = useState(false);
  const [removeFriendModal, setRemoveFriendModal] = useState(false);
  const [redAddFriendPlaceHolder, setRedAddFriendPlaceHolder] = useState(false);
  const [searchedFriends, setSearchedFriends] = useState([]);
  const [selectedProfileImgFile, setSelectedProfileImgFile] = useState(null);
  const [selectedGroupImgFile, setSelectedGroupImgFile] = useState(null);
  const [addedFriendUserName, setAddedFriendUserName] = useState();
  const [addedFriendId, setAddedFriendId] = useState();
  const [friendsList, setFriendsList] = useState();
  const [redGroupNamePlaceHolder, setRedGroupNamePlaceHolder] = useState(false);
  const [loader, setLoader] = useState(false);
  const [acceptFriendRequestLoader, setAcceptFriendRequestLoader] =
    useState(false);
  const [acceptFriendRequestLoaderId, setAcceptFriendRequestLoaderId] =
    useState(null);
  const [declineFriendRequestLoader, setDeclineFriendRequestLoader] =
    useState(false);
  const [declineFriendRequestLoaderId, setDeclineFriendRequestLoaderId] =
    useState(null);
  const [unsendFriendRequestLoader, setUnsendFriendRequestLoader] =
    useState(false);
  const [unsendFriendRequestLoaderId, setUnsendFriendRequestLoaderId] =
    useState(null);
  const [newGroupName, setNewGroupName] = useState({
    value: "",
    placeholder: "Group name",
  });
  const [friendUserId, setFriendUserId] = useState({
    value: "",
    placeholder: "Type your friends User ID here...",
  });

  const allConfig = [
    newGroupModal,
    friendsListModal,
    friendRequestsModal,
    addProfilePictureModal,
    userIdModal,
  ];

  const userIdInputRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();

  const chatId = location.pathname.split("/")[2];

  useEffect(() => {
    if (friendUserId.value !== "") {
      setRedAddFriendPlaceHolder(false);
      setFriendUserId({
        ...friendUserId,
        placeholder: "Type your friends User ID here...",
      });
    }
  }, [friendUserId.value]);

  useEffect(() => {
    if (newGroupName.value !== "") {
      setRedGroupNamePlaceHolder(false);
      setNewGroupName({ ...newGroupName, placeholder: "Group name" });
    }
  }, [newGroupName.value]);

  useEffect(() => {
    if (modalConfig === "new group") {
      setModalHeaderTxt("New Group");
      setNewGroupModal(true);
    } else if (modalConfig === "friends") {
      getFriendsList();
      setModalHeaderTxt("Friends List");
      setFriendsListModal(true);
    } else if (modalConfig === "friend requests") {
      setFriendRequestsModalLoader(true);
      getRecievedRequestUserInfo();
      setModalHeaderTxt("Friend Requests");
      setFriendRequestsModal(true);
    } else if (modalConfig === "add a profile picture") {
      setModalHeaderTxt("Add Profile Picture");
      setAddProfilePictureModal(true);
    } else if (modalConfig === "userID") {
      setModalHeaderTxt("USER ID");
      setUserIdModal(true);
    }
  }, [modalConfig]);

  const copyUserId = async () => {
    await navigator.clipboard.writeText(userIdInputRef.current.value);
    setUserIdCopied(true);
    setTimeout(() => {
      setUserIdCopied(false);
    }, 2000);
  };

  const closeModal = () => {
    setAddedFriendId("");
    setAddedFriendUserName("");
    setModalOpen(false);
    setLoader(false);
  };

  const openAddFriendModal = () => {
    setFriendRequestsModal(false);
    setFriendsListModal(false);
    setAddFriendModal(true);
  };

  const openRemoveFriendModal = (friendId, friendUserName) => {
    setAddedFriendUserName(friendUserName);
    setAddedFriendId(friendId);
    setFriendRequestsModal(false);
    setFriendsListModal(false);
    setRemoveFriendModal(true);
  };

  const sendFriendRequest = async () => {
    setLoader(true);
    if (friendUserId.value === "") {
      setRedAddFriendPlaceHolder(true);
      setFriendUserId({
        ...friendUserId,
        value: "",
        placeholder: "Please Fill Out This Field",
      });
      setLoader(false);
      return;
    }
    const friendRequestObject = {
      friend: friendUserId.value,
    };
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_SERVER_URL}/send-friend-request`,
        friendRequestObject,
        { withCredentials: true }
      );
      if (response.status === 200) {
        if (
          response.data.message === "They've already sent a request. Added!"
        ) {
          setInformModalTxt(`They've already sent a request. Added!`);
          setInformModalColor("green");
          setInformModalOpen(true);
          closeModal();
        } else {
          setInformModalTxt(`Sent friend request!`);
          setInformModalColor("green");
          setInformModalOpen(true);
          closeModal();
        }
      }
      setLoader(false);
    } catch (err) {
      console.log(err);
      if (err.response.data.message === "They're already your friend") {
        setRedAddFriendPlaceHolder(true);
        setFriendUserId({
          ...friendUserId,
          value: "",
          placeholder: "User is already your friend",
        });
      } else if (
        err.response.data.message ===
        "You've already sent them a friend request"
      ) {
        setRedAddFriendPlaceHolder(true);
        setFriendUserId({
          ...friendUserId,
          value: "",
          placeholder: "You've already sent them a friend request",
        });
      } else if (err.response.data.message === "User not found") {
        setRedAddFriendPlaceHolder(true);
        setFriendUserId({
          ...friendUserId,
          value: "",
          placeholder: "User not found",
        });
      }
      setLoader(false);
    }
  };

  const openSentFriendRequests = () => {
    setViewSentFriendRequests(true);
    setViewRecievedFriendRequests(false);
  };

  const openRecievedFriendRequests = () => {
    setViewSentFriendRequests(false);
    setViewRecievedFriendRequests(true);
  };

  const getSentRequestUserInfo = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_URL}/sent-friend-requests`,
        { withCredentials: true }
      );
      if (response.status === 200 && response.data) {
        setSentFriendRequests(response.data);
      } else {
        setSentFriendRequests([]);
      }
      setFriendRequestsModalLoader(false);
    } catch (err) {
      console.log(err);
      setFriendRequestsModalLoader(false);
      setRecievedFriendRequests([]);
    }
  };

  const getRecievedRequestUserInfo = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_URL}/received-friend-requests`,
        { withCredentials: true }
      );
      if (response.status === 200 && response.data) {
        setRecievedFriendRequests(response.data);
      } else {
        setRecievedFriendRequests([]);
      }
      setFriendRequestsModalLoader(false);
    } catch (err) {
      console.log(err);
      setRecievedFriendRequests([]);
      setFriendRequestsModalLoader(false);
    }
  };

  const acceptFriendRequest = async (
    requestedFriendId,
    recievedFriendUserName
  ) => {
    if (declineFriendRequestLoader || acceptFriendRequestLoader) return;
    setAcceptFriendRequestLoader(true);
    setAcceptFriendRequestLoaderId(requestedFriendId);
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_SERVER_URL}/accept-friend-request`,
        { requestedFriendId },
        { withCredentials: true }
      );
      if (response.status === 200) {
        await getRecievedRequestUserInfo();
        setInformModalTxt(
          `Accepted ${
            recievedFriendUserName.charAt(0) +
            recievedFriendUserName.slice(1).toLowerCase()
          }'s friend request`
        );
        setInformModalColor("green");
        setInformModalOpen(true);
      }
      setAcceptFriendRequestLoader(false);
      setAcceptFriendRequestLoaderId(null);
    } catch (err) {
      console.log(err);
      setAcceptFriendRequestLoader(false);
      setAcceptFriendRequestLoaderId(null);
    }
  };

  const declineFriendRequest = async (
    requestedFriendId,
    requestedFriendUserName
  ) => {
    if (acceptFriendRequestLoader || declineFriendRequestLoader) return;
    setDeclineFriendRequestLoader(true);
    setDeclineFriendRequestLoaderId(requestedFriendId);
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_SERVER_URL}/decline-friend-request`,
        { requestedFriendId },
        { withCredentials: true }
      );
      if (response.status === 200) {
        await getRecievedRequestUserInfo();
        setInformModalTxt(`Declined ${
          requestedFriendUserName.charAt(0) +
          requestedFriendUserName.slice(1).toLowerCase()
        }'s 
                friend request`);
        setInformModalColor("green");
        setInformModalOpen(true);
      }
      setDeclineFriendRequestLoader(false);
      setDeclineFriendRequestLoaderId(null);
    } catch (err) {
      console.log(err);
      setDeclineFriendRequestLoader(false);
      setDeclineFriendRequestLoaderId(null);
    }
  };

  const unsendFriendRequest = async (requestedFriendId) => {
    if (unsendFriendRequestLoader) return;
    setUnsendFriendRequestLoader(true);
    setUnsendFriendRequestLoaderId(requestedFriendId);
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_SERVER_URL}/unsend-friend-request`,
        { requestedFriendId },
        { withCredentials: true }
      );
      if (response.status === 200) {
        await getSentRequestUserInfo();
        setInformModalTxt(`Unsent friend request!`);
        setInformModalColor("green");
        setInformModalOpen(true);
      }
      setUnsendFriendRequestLoader(false);
      setUnsendFriendRequestLoaderId(null);
    } catch (err) {
      console.log(err);
      setUnsendFriendRequestLoader(false);
      setUnsendFriendRequestLoaderId(null);
    }
  };

  const getFriendsList = async () => {
    try {
      setFriendsListModalLoader(true);
      const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/friends-list`, {
        withCredentials: true,
      });
      if (response.status === 200 && response.data) {
        setFriendsList(response.data);
        setSearchedFriends(response.data);
      } else {
        setFriendsList([]);
        setSearchedFriends([]);
      }
      setFriendsListModalLoader(false);
    } catch (err) {
      setFriendsListModalLoader(false);
      console.log(err);
    }
  };

  const removeFriend = async () => {
    setLoader(true);
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_SERVER_URL}/remove-friend`,
        { addedFriendId },
        { withCredentials: true }
      );
      if (response.status === 200) {
        setInformModalTxt(
          `Removed ${
            addedFriendUserName.charAt(0) +
            addedFriendUserName.slice(1).toLowerCase()
          } from your friends list!`
        );
        setInformModalColor("green");
        setInformModalOpen(true);
        closeModal();
      }
      setLoader(false);
    } catch (err) {
      console.log(err);
      setLoader(false);
    }
  };

  const handleFriendsListSearch = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchedFriends(
      friendsList.filter((friend) =>
        friend.username.toLowerCase().includes(value)
      )
    );
  };

  const handleProfileImgFileChange = (event) => {
    setSelectedProfileImgFile(event.target.files[0]);
  };

  const addProfileImg = async () => {
    setLoader(true);
    if (!selectedProfileImgFile) {
      setInformModalTxt("Select an Image!");
      setInformModalColor("red");
      setInformModalOpen(true);
      setLoader(false);
      return;
    }
    if (
      selectedProfileImgFile.type !== "image/jpeg" &&
      selectedProfileImgFile.type !== "image/png"
    ) {
      setInformModalTxt("Invalid file type, only JPEG and PNG is allowed!");
      setInformModalColor("red");
      setInformModalOpen(true);
      setLoader(false);
      return;
    }
    const formData = new FormData();
    formData.append("profilePicture", selectedProfileImgFile);
    formData.append("userId", userInfo._id);
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_SERVER_URL}/add-profile-picture`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 200) {
        setInformModalTxt("Profile picture updated!");
        setInformModalColor("green");
        setInformModalOpen(true);
        closeModal();
        getUserInfo();
      }
      setLoader(false);
    } catch (err) {
      console.log(err);
      setLoader(false);
    }
  };

  const handleGroupImgFileChange = (event) => {
    setSelectedGroupImgFile(event.target.files[0]);
  };

  const createGroup = async () => {
    setLoader(true);
    if (selectedGroupImgFile) {
      if (
        selectedGroupImgFile.type !== "image/jpeg" &&
        selectedGroupImgFile.type !== "image/png"
      ) {
        setInformModalTxt("Invalid file type, only JPEG and PNG is allowed!");
        setInformModalColor("red");
        setInformModalOpen(true);
        setLoader(false);
        return;
      }
    }
    if (newGroupName.value === "") {
      setRedGroupNamePlaceHolder(true);
      setNewGroupName({
        ...newGroupName,
        value: "",
        placeholder: "Please Fill Out This Field",
      });
      setLoader(false);
      return;
    }
    const formData = new FormData();
    formData.append("groupPicture", selectedGroupImgFile);
    formData.append("newGroupName", newGroupName.value);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/create-group`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 200) {
        setInformModalTxt("Created Group!");
        setInformModalColor("green");
        setInformModalOpen(true);
        getChatListInfo();
        closeModal();
      }
      setLoader(false);
    } catch (err) {
      console.log(err);
      setLoader(false);
    }
  };

  useEffect(() => {
    // Join the user's socket room
    if (userInfo) {
      socket.emit("joinUser", userInfo._id);

      // Listen for the 'friendRequestAccepted' event
      socket.on("friendRequestAccepted", (userId) => {
        // Handle the friend request acceptance, such as updating the friend-related lists
        // Perform any necessary actions here
        getSentRequestUserInfo();
        getFriendsList();
        getChatListInfo();
      });

      socket.on("friendRequestDeclined", (friendUserId) => {
        getSentRequestUserInfo();
      });

      socket.on("friendRequestUnsend", (friendUserId) => {
        getRecievedRequestUserInfo();
      });

      socket.on("friendRemoved", async (friendUserId, chat) => {
        await getFriendsList();
        await getChatListInfo();
        if (chat._id === chatId) {
          navigate("/");
        }
      });

      socket.on("friendRequestRecieved", () => {
        getRecievedRequestUserInfo();
      });

      // Clean up the event listener when the component unmounts
      return () => {
        socket.off("friendRequestAccepted");
        socket.off("friendRequestDeclined");
        socket.off("friendRequestUnsend");
        socket.off("friendRemoved");
        socket.off("friendRequestRecieved");
      };
    }
  }, [userInfo]);

  return (
    <section className="modalWrapper">
      {addFriendModal && (
        <AddFriendModal
          friendUserId={friendUserId}
          setFriendUserId={setFriendUserId}
          sendFriendRequest={sendFriendRequest}
          redAddFriendPlaceHolder={redAddFriendPlaceHolder}
          closeModal={closeModal}
          loader={loader}
        />
      )}
      {removeFriendModal && (
        <RemoveFriendModal
          closeModal={closeModal}
          removeFriend={removeFriend}
          loader={loader}
        />
      )}
      <div
        className={`modalContent ${
          allConfig.some((config) => config) ? "render" : ""
        } 
            ${addFriendModal || removeFriendModal ? "close" : ""}`}
      >
        {!friendsListModal && !addProfilePictureModal && (
          <div className="modalHeaderWrapper">
            <h3 className="modalHeader">{modalHeaderTxt}</h3>
          </div>
        )}
        {newGroupModal && (
          <div className="groupModalMainContentWrapper">
            <div className="groupModalMainContent">
              {selectedGroupImgFile ? (
                <img
                  className="groupModalImg"
                  src={URL.createObjectURL(selectedGroupImgFile)}
                  onClick={() =>
                    document.getElementById("hiddenFileInput").click()
                  }
                  alt="added group modal pic"
                />
              ) : (
                <div
                  className="defaultGroupModalImgWrapper"
                  onClick={() =>
                    document.getElementById("hiddenFileInput").click()
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="defaultGroupModalImg"
                    viewBox="0 0 512 512"
                  >
                    <path
                      d="M149.1 64.8L138.7 96H64C28.7 96 0 124.7 0 160V416c0 35.3 28.7 
                                64 64 64H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H373.3L362.9 64.8C356.4 45.2 338.1 32 
                                317.4 32H194.6c-20.7 0-39 13.2-45.5 32.8zM256 192a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"
                    />
                  </svg>
                </div>
              )}
              <input
                name="groupName"
                className={`groupModalInput ${
                  redGroupNamePlaceHolder ? "red" : ""
                }`}
                placeholder={newGroupName.placeholder}
                maxLength="20"
                value={newGroupName.value}
                onChange={(e) =>
                  setNewGroupName({ ...newGroupName, value: e.target.value })
                }
              />
              <input
                id="hiddenFileInput"
                type="file"
                onChange={handleGroupImgFileChange}
                style={{ display: "none" }}
              />
            </div>
            <div className="groupModalFooterWrapper">
              <button className="groupModalBtn" onClick={() => closeModal()}>
                Cancel
              </button>
              {loader ? (
                <button className="groupModalBtn groupLoader">
                  <span className="modalLoader"></span>
                </button>
              ) : (
                <button className="groupModalBtn" onClick={() => createGroup()}>
                  Create
                </button>
              )}
            </div>
          </div>
        )}
        {friendsListModal && (
          <FriendsListModal
            searchedFriends={searchedFriends}
            openRemoveFriendModal={openRemoveFriendModal}
            closeModal={closeModal}
            openAddFriendModal={openAddFriendModal}
            handleFriendsListSearch={handleFriendsListSearch}
            friendsListModalLoader={friendsListModalLoader}
          />
        )}
        {friendRequestsModal && (
          <div className="friendRequestsModalMainContentWrapper">
            <div className="friendRequestsModalSelectBtnWrapper">
              <button
                className={`friendRequestsModalSelectBtn ${
                  viewRecievedFriendRequests ? "viewRecieved" : ""
                }`}
                onClick={() => {
                  setFriendRequestsModalLoader(true);
                  getRecievedRequestUserInfo();
                  openRecievedFriendRequests();
                }}
              >
                Recieved
              </button>
              <button
                className={`friendRequestsModalSelectBtn ${
                  viewSentFriendRequests ? "viewSent" : ""
                }`}
                onClick={() => {
                  setFriendRequestsModalLoader(true);
                  getSentRequestUserInfo();
                  openSentFriendRequests();
                }}
              >
                Sent
              </button>
            </div>
            <div className="friendRequestsModalMainContent">
              {!friendRequestsModalLoader ? (
                <>
                  {sentFriendRequests &&
                    viewSentFriendRequests &&
                    sentFriendRequests.map((user, index) => (
                      <div
                        className="friendRequestsModalSentUserContentWrapper"
                        key={index}
                      >
                        {user.profilePicture ? (
                          <img
                            src={`${user.profilePicture}`}
                            className="friendRequestsModalProfileImg"
                            alt="sent friend requests profile pic"
                          />
                        ) : (
                          <div className="friendRequestModalDefaultProfileImgWrapper">
                            <h3 className="friendRequestsModalDefaultProfileImg">
                              {user.username.charAt(0)}
                            </h3>
                          </div>
                        )}
                        <span className="friendRequestsModalUserName">
                          {user.username.charAt(0) +
                            user.username.slice(1).toLowerCase()}
                        </span>
                        {unsendFriendRequestLoader &&
                        unsendFriendRequestLoaderId === user._id.toString() ? (
                          <button className="friendRequestsModalUnsendBtn unsendLoader">
                            <span className="modalLoader"></span>
                          </button>
                        ) : (
                          <button
                            className="friendRequestsModalUnsendBtn"
                            onClick={() =>
                              unsendFriendRequest(user._id.toString())
                            }
                          >
                            Unsend
                          </button>
                        )}
                      </div>
                    ))}
                  {recievedFriendRequests &&
                    viewRecievedFriendRequests &&
                    recievedFriendRequests.map((user, index) => (
                      <div
                        className="friendRequestsModalSentUserContentWrapper"
                        key={index}
                      >
                        {user.profilePicture ? (
                          <img
                            src={`${user.profilePicture}`}
                            className="friendRequestsModalProfileImg"
                            alt="recieved friend requests profile pic"
                          />
                        ) : (
                          <div className="friendRequestModalDefaultProfileImgWrapper">
                            <h3 className="friendRequestsModalDefaultProfileImg">
                              {user.username.charAt(0)}
                            </h3>
                          </div>
                        )}
                        <span className="friendRequestsModalUserName">
                          {user.username.charAt(0) +
                            user.username.slice(1).toLowerCase()}
                        </span>
                        <div className="friendRequestsModalBtnWrapper">
                          {acceptFriendRequestLoader &&
                          acceptFriendRequestLoaderId ===
                            user._id.toString() ? (
                            <button className="friendRequestsModalAcceptBtn acceptLoader">
                              <span className="modalLoader"></span>
                            </button>
                          ) : (
                            <button
                              className="friendRequestsModalAcceptBtn"
                              onClick={() =>
                                acceptFriendRequest(
                                  user._id.toString(),
                                  user.username
                                )
                              }
                            >
                              Accept
                            </button>
                          )}
                          {declineFriendRequestLoader &&
                          declineFriendRequestLoaderId ===
                            user._id.toString() ? (
                            <button className="friendRequestsModalDeclineBtn declineLoader">
                              <span className="modalLoader"></span>
                            </button>
                          ) : (
                            <button
                              className="friendRequestsModalDeclineBtn"
                              onClick={() =>
                                declineFriendRequest(
                                  user._id.toString(),
                                  user.username
                                )
                              }
                            >
                              Decline
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </>
              ) : (
                <div className="friendRequestsModalLoaderWrapper">
                  <span className="friendRequestsModalLoader"></span>
                </div>
              )}
            </div>
            <div className="friendRequestsModalFooterWrapper">
              <button
                className="friendRequestsModalBtn"
                onClick={() => closeModal()}
              >
                Close
              </button>
              <button
                className="friendRequestsModalBtn"
                onClick={() => openAddFriendModal()}
              >
                Add a Friend
              </button>
            </div>
          </div>
        )}
        {addProfilePictureModal && (
          <AddPictureModal
            selectedProfileImgFile={selectedProfileImgFile}
            handleProfileImgFileChange={handleProfileImgFileChange}
            closeModal={closeModal}
            addProfileImg={addProfileImg}
            loader={loader}
          />
        )}
        {userIdModal && (
          <div className="userIdModalMainContentWrapper">
            <div className="userIdModalMainContent">
              <label className="userIdModalInputLabel">Your User ID:</label>
              <div className="userIdModalInputWrapper">
                <input
                  className="userIdModalInput"
                  type="text"
                  ref={userIdInputRef}
                  value={userInfo._id}
                  readOnly
                />
                <div
                  className={`userIdModalIconImgWrapper ${
                    userIdCopied ? "copied" : ""
                  }`}
                  onClick={copyUserId}
                >
                  {userIdCopied ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="userIdModalIcon"
                      viewBox="0 0 448 512"
                    >
                      <path
                        d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 
                                                12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 
                                                393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="userIdModalIcon"
                      viewBox="0 0 512 512"
                    >
                      <path
                        d="M272 0H396.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 
                                                33.9V336c0 26.5-21.5 48-48 48H272c-26.5 0-48-21.5-48-48V48c0-26.5 21.5-48 48-48zM48 
                                                128H192v64H64V448H256V416h64v48c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V176c0-26.5 
                                                21.5-48 48-48z"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>
            <div className="userIdModalFooterWrapper">
              <button className="userIdModalBtn" onClick={() => closeModal()}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Modal;
