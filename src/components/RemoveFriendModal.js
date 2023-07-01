import '../styles/RemoveFriendModal.css'

const RemoveFriendModal = ({ closeModal, removeFriend, closeSeveringModal, severingModalOption, currentChatInfo, deleteGroup, leaveGroup, 
    selectedMsg, deleteMsg, modalLoader, loader }) => {
    let modalText = '';
    if (severingModalOption === 'deleteGroup') {
        modalText = 'delete this group?';
    } else if (severingModalOption === 'leaveGroup') {
        modalText = 'leave this group?';
    } else if (selectedMsg) {
        modalText = 'delete this message?'
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
                    <button className="removeFriendModalBtn closeBtn" onClick={(severingModalOption || selectedMsg) ? () => closeSeveringModal() : 
                        () => closeModal()}>Close</button>
                    {modalLoader || loader ? (
                        <button className="removeFriendModalBtn removeFriendLoader"><span class="modalLoader"></span></button>
                    ) : (
                        <button className="removeFriendModalBtn red" onClick={severingModalOption === 'deleteGroup' ? 
                        () => deleteGroup(currentChatInfo._id.toString(), currentChatInfo.members) : 
                        (severingModalOption === 'leaveGroup' ? () => leaveGroup(currentChatInfo._id.toString()) : 
                        (selectedMsg ? () => deleteMsg() : () => removeFriend()))}>
                            {(severingModalOption === 'deleteGroup' || selectedMsg) ? 'Delete' : 
                        (severingModalOption === 'leaveGroup' ? 'Leave' : 'Remove')}</button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default RemoveFriendModal;
