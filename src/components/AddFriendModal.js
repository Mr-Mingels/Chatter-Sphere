import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import '../styles/AddFriendModal.css'

const AddFriendModal = ({ closeModal, setFriendUserId, friendUserId, redAddFriendPlaceHolder, sendFriendRequest }) => {
    return (
        <div className="addFriendModalContent">
                <div className="addFriendModalHeaderWrapper">
                    <h3 className="addFriendModalHeader">Add a Friend</h3>
                </div>
                <div className="addFriendModalMainContentWrapper">
                    <div className="addFriendModalMainContent">
                        <label className="addFriendModalInputLabel">User ID:</label>
                        <input name="friendRequest" maxLength="50" className={`addFriendModalInput ${redAddFriendPlaceHolder ? 'field' : ''}`} 
                        value={friendUserId.value} onChange={(e) => setFriendUserId({ ...friendUserId, value: e.target.value })}
                        placeholder={friendUserId.placeholder} />   
                    </div>
                <div className="addFriendModalFooterWrapper">
                    <button className="addFriendModalBtn" onClick={() => closeModal()}>Close</button>
                    <button className="addFriendModalBtn" onClick={() => sendFriendRequest()}>Send</button>
                </div>
            </div>
        </div>
    )
}

export default AddFriendModal