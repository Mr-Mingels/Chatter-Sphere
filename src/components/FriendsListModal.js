import React, { useState } from "react";
import '../styles/FriendsListModal.css'

const FriendsListModal = ({ openAddFriendModal, openRemoveFriendModal, closeModal, searchedFriends, handleFriendsListSearch, 
    closeFriendListModal, addMemberOption, addMemberToGroup, currentChatInfo }) => {

    const [addedMember, setAddedMember] = useState([])

    const addMember = (friendId) => {
        const checkIfMember = currentChatInfo.members.find(member => member._id === friendId)
        if (checkIfMember) return
        const index = addedMember.indexOf(friendId);
        if (index !== -1) {
            const newAddedMember = [...addedMember];
            newAddedMember.splice(index, 1);
            setAddedMember(newAddedMember);
        } else {
            setAddedMember([...addedMember, friendId]);
        }
    }
    return (
        <>
            <div className="friendModalHeaderWrapper">
                <h3 className="friendModalHeader">Friends List</h3>
                <div className="friendsModalSearchInputWrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" className="friendsModalSearchIcon" viewBox="0 0 512 512">
                    <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 
                    0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 
                    352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>
                    <input className="friendsModalSearchInput" placeholder="Search" onChange={handleFriendsListSearch}></input>
                </div>
            </div>
            <div className="friendModalMainContentWrapper">
                <div className="friendModalMainContent">
                    {searchedFriends && searchedFriends.map((user, index) => (
                        <div className={`friendModalSentUserContentWrapper ${addedMember.find(id => id === user._id.toString()) 
                            ? 'addedMember' : ''}`} key={index} onClick={addMemberOption ? () => addMember(user._id.toString()): null}>
                            {user.profilePicture ? <img src={`${user.profilePicture}`} 
                            className="friendModalProfileImg"/> : <div className="friendModalDefaultProfileImgWrapper">
                            <h3 className="friendModalDefaultProfileImg">{user.username.charAt(0)}</h3></div>}
                            <span className="friendModalUserName">
                                {user.username.charAt(0) + user.username.slice(1).toLowerCase()}
                            </span>
                            {!addMemberOption && (
                                <button className="friendModalRemoveBtn" 
                                onClick={() => openRemoveFriendModal(user._id.toString(), user.username)}>Remove</button>
                            )}
                        </div>
                    ))}
                </div>
                <div className="friendModalFooterWrapper">
                    <button className="friendModalBtn" onClick={addMemberOption ? () => closeFriendListModal() : () => closeModal()}>
                        Close</button>
                    <button className="friendModalBtn" onClick={addMemberOption ? () => addMemberToGroup(addedMember, currentChatInfo._id) : 
                        () => openAddFriendModal()}> {addMemberOption ? 'Add to Group' : 'Add a Friend'}</button>
                </div>
            </div>
        </>
    )
}

export default FriendsListModal