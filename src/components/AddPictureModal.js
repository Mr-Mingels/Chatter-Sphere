import React, { useState, useEffect } from "react";
import '../styles/AddPictureModal.css'

const AddPictureModal = ({ selectedProfileImgFile, handleProfileImgFileChange, closeModal, addProfileImg, closeAddPictureModal, 
    selectedGroupImgFile, addGroupImg, handleGroupImgFileChange, groupImgModalOption, loader, modalLoader}) => {
        const [selectedImgFile, setSelectedImgFile] = useState(null)

        useEffect(() => {
            if(selectedGroupImgFile) {
                setSelectedImgFile(selectedGroupImgFile)
                return
            } else if (selectedProfileImgFile) {
                setSelectedImgFile(selectedProfileImgFile)
                return
            } else {
                setSelectedImgFile(null)
            }
        },[selectedGroupImgFile, selectedProfileImgFile])
    return (
        <div className="profilePicModalMainContentWrapper">
            <div className="profilePicModalHeaderWrapper">
                    <h3 className="profilePicModalHeader">{groupImgModalOption ? 'Add a Group Picture' : 'Add a Profile Picture'}</h3>
                </div>
            <div className="profilePicModalMainContent">
                {selectedImgFile ? <img src={URL.createObjectURL(selectedImgFile)} className="profilePicModalImg" 
                onClick={() => document.getElementById('hiddenFileInput').click()}/> : 
                <div className="defaultProfilePicModalImg" onClick={() => document.getElementById('hiddenFileInput').click()}>
                <svg xmlns="http://www.w3.org/2000/svg" className="profileDefaultPicModalImg" viewBox="0 0 512 512">
                <path d="M149.1 64.8L138.7 96H64C28.7 96 0 124.7 0 160V416c0 35.3 28.7 
                64 64 64H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H373.3L362.9 64.8C356.4 45.2 338.1 32 
                317.4 32H194.6c-20.7 0-39 13.2-45.5 32.8zM256 192a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"/></svg></div>}
                <p className="profilePicTxt">Click the above icon to add an image{groupImgModalOption ? ' to your group' : ''}</p>
                <input id='hiddenFileInput' type='file' onChange={groupImgModalOption ? handleGroupImgFileChange : handleProfileImgFileChange} 
                style={{display: 'none'}} />
            </div>
            <div className="profilePicModalFooterWrapper">
                 <button className="profilePicModalBtn" onClick={groupImgModalOption ? () => closeAddPictureModal() : 
                    () => closeModal()}>Cancel</button>
                 {loader || modalLoader ? (
                        <button className="profilePicModalBtn"><span class="modalLoader"></span></button>
                 ) : (
                    <button className="profilePicModalBtn" onClick={groupImgModalOption ? () => addGroupImg() : () => addProfileImg()}>Add</button>
                 )}
            </div>
        </div>
    )
}

export default AddPictureModal