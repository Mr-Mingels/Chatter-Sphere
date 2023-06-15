import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import '../styles/RemoveFriendModal.css'

const RemoveFriendModal = ({ closeModal, removeFriend }) => {
    return (
        <div className="removeFriendModalContent">
            <div className="removeFriendModalMainContentWrapper">
                <div className="removeFriendModalMainContent">
                    <p className="removeFriendModalTxt">Are you sure you want to remove this friend?</p>
                </div>
                <div className="removeFriendModalFooterWrapper">
                    <button className="removeFriendModalBtn" onClick={() => closeModal()}>Close</button>
                    <button className="removeFriendModalBtn red" onClick={() => removeFriend()}>Remove</button>
                </div>
            </div>
        </div>
    )
}

export default RemoveFriendModal