import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import '../styles/RemoveFriendModal.css'

const RemoveFriendModal = ({ closeModal, removeFriend, closeSeveringModal, severingModalOption, currentChatInfo, deleteGroup, leaveGroup}) => {
    console.log(severingModalOption)
    let modalText = '';
    if (severingModalOption === 'deleteGroup') {
        modalText = 'delete this group?';
    } else if (severingModalOption === 'leaveGroup') {
        modalText = 'leave this group?';
    } else {
        modalText = 'remove this friend?';
    }
    
    return (
        <div className="removeFriendModalContent">
            <div className="removeFriendModalMainContentWrapper">
                <div className="removeFriendModalMainContent">
                    <p className="removeFriendModalTxt">Are you sure you want to {modalText}</p>
                </div>
                <div className="removeFriendModalFooterWrapper">
                    <button className="removeFriendModalBtn" onClick={severingModalOption ? () => closeSeveringModal() : 
                        () => closeModal()}>Close</button>
                    <button className="removeFriendModalBtn red" onClick={severingModalOption === 'deleteGroup' ? 
                    () => deleteGroup(currentChatInfo._id.toString(), currentChatInfo.members) : 
                    (severingModalOption === 'leaveGroup' ? () => leaveGroup(currentChatInfo._id.toString()) : () => removeFriend())}>
                        {severingModalOption === 'deleteGroup' ? 'Delete' : 
                    (severingModalOption === 'leaveGroup' ? 'Leave' : 'Remove')}</button>
                </div>
            </div>
        </div>
    )
}

export default RemoveFriendModal;
