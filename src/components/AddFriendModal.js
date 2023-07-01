import '../styles/AddFriendModal.css'

const AddFriendModal = ({ closeModal, setFriendUserId, friendUserId, redAddFriendPlaceHolder, sendFriendRequest, loader }) => {
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
                    <button className="addFriendModalBtn closeBtn" onClick={() => closeModal()}>Close</button>
                    {loader ? (
                        <button className="addFriendModalBtn addFriendLoader"><span class="modalLoader"></span></button>
                    ) : (
                        <button className="addFriendModalBtn" onClick={() => sendFriendRequest()}>Send</button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AddFriendModal