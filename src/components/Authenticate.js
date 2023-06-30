import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from 'axios';
import '../styles/Auth.css'
import logo from '../assets/logo.png'
import logoWhite from '../assets/logoWhite.png'
import signUpImg from '../assets/signUpImg.jpg'
import signInImg from '../assets/signInImg.jpg'
import free from '../assets/free.png'
import laptop from '../assets/laptop.png'

const Authenticate = ({ windowWidth }) => {
    const [authConfig, setAuthConfig] = useState(null)
    const [imgLoaded, setImgLoaded] = useState(false)
    const [redUserNamePlaceHolder, setRedUserNamePlaceHolder] = useState(false)
    const [redEmailPlaceHolder, setRedEmailPlaceHolder] = useState(false)
    const [redPasswordPlaceholder, setRedPasswordPlaceholder] = useState(false)
    const [loader, setLoader] = useState(false)
    const [email, setEmail] = useState({
        value: '',
        placeholder: 'Enter your email'
      });
    const [userName, setUserName] = useState({
        value: '',
        placeholder: 'Enter your username'
      });
    const [password, setPassword] = useState({
        value: '',
        placeholder: 'Enter your password'
      });

    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        setImgLoaded(false)
        if (location.pathname === '/sign-up') {
            setAuthConfig(true)
        } else {
            setAuthConfig(false)
        }
    },[location])

    const handleFormSubmit = async (event) => {
        setLoader(true)
        event.preventDefault();
        if (userName.value === '') {
            setRedUserNamePlaceHolder(true)
            setUserName({ ...userName, placeholder: 'Please Fill Out This Field' })
        }
        if (email.value === '') {
            setRedEmailPlaceHolder(true)
            setEmail({ ...email, placeholder: 'Please Fill Out This Field' })
        }
        if (password.value === '') {
            setRedPasswordPlaceholder(true)
            setPassword({ ...password, placeholder: 'Please Fill Out This Field' })
        }
        if (password.value === '' || email.value === '' || userName.value === '') {
            setLoader(false)
            return;
        }

        const user = {
            email: email.value.toUpperCase(),
            username: userName.value.toUpperCase(),
            password: password.value
        }

        try {
            const path = authConfig ? 'sign-up-page' : 'log-in-page';

            const response = await axios.post(`/${path}`, user, { withCredentials: true });
            if (authConfig && response.status === 200) {
                navigate('/log-in')
                setEmail({ ...email, value: ''})
                setPassword({ ...password, value: ''})
                setUserName({ ...userName, value: ''})
            } else if (!authConfig && response.status === 200) {
                navigate('/')
            }
            setLoader(false)
        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error message: ', error.response.data.message);
                if (error.response.data.message === 'Email and Username are incorrect') {
                    setRedEmailPlaceHolder(true)
                    setEmail({ ...email, value: '', placeholder: 'Incorrect email' })
                    setRedUserNamePlaceHolder(true)
                    setUserName({ ...userName, value: '', placeholder: 'Incorrect username' })
                } else if (error.response.data.message === 'Email is incorrect') {
                    setRedEmailPlaceHolder(true)
                    setEmail({ ...email, value: '', placeholder: 'Incorrect email' })
                } else if (error.response.data.message === 'Username is incorrect' || 
                    error.response.data.message === "Email and username do not match the same user") {
                    setRedUserNamePlaceHolder(true)
                    setUserName({ ...userName, value: '', placeholder: 'Incorrect username' })
                } else if (error.response.data.message === 'Incorrect password') {
                    setRedPasswordPlaceholder(true)
                    setPassword({ ...password, value: '', placeholder: 'Incorrect password' })
                } else if (error.response.data.message === "Email has already been taken") {
                    setRedEmailPlaceHolder(true)
                    setEmail({ ...email, value: '', placeholder: 'Email has already been taken' })
                } else if (error.response.data.message === "Username has already been taken") {
                    setRedUserNamePlaceHolder(true)
                    setUserName({ ...userName, value: '', placeholder: 'Username has already been taken' })
                } else if (error.response.data.message === "Email and Username have already been taken") {
                    setRedEmailPlaceHolder(true)
                    setEmail({ ...email, value: '', placeholder: 'Email has already been taken' })
                    setRedUserNamePlaceHolder(true)
                    setUserName({ ...userName, value: '', placeholder: 'Username has already been taken' })
                }
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error', error.message);
            }
            setLoader(false)
        }
    }
    
      useEffect(() => {
        if(userName.value !== '') {
            setRedUserNamePlaceHolder(false)
            setUserName({ ...userName, placeholder: 'Enter your username' })
        }
      },[userName.value])
      
      useEffect(() => {
        if (email.value !== '') {
            setRedEmailPlaceHolder(false)
            setEmail({ ...email, placeholder: 'Enter your email' })
        }
      }, [email.value])
    
      useEffect(() => {
        if (password.value !== '') {
            setRedPasswordPlaceholder(false)
            setPassword({ ...password, placeholder: 'Enter your password' })
        }
      }, [password.value])

      const handleImageLoad = () => {
        setImgLoaded(true)
      }

    return (
        <section className="authWrapper">
            {!imgLoaded && (
                <div className="loaderWrapper">
                    <span class="loader"></span>
                </div>
            )}
            <div className="authContentWrapper">
                <div className="authLeftSideWrapper">
                    <div className="logo-txt-wrapper">
                        <div className="authPageLogoWrapper">
                            <img className="authPageLogo" src={windowWidth <= 800 ? logoWhite : logo} onMouseDown={(e) => e.preventDefault()}/>
                        </div>
                        <h3 className="authLogoTitle">Chatter Sphere</h3>
                    </div>
                    <div className="authLeftSideContentWrapper">
                        <h1 className="authCreateAccountTitle">{authConfig ? 'Create your account' : 'Log into your account'}</h1>
                        <div className="authFormWrapper">
                            <form method="POST" className="authForm" onSubmit={handleFormSubmit}>
                                <label className="authLabel">Email<span className="authRequireTag">*</span></label>
                                <input type="email" name="email" placeholder={email.placeholder} 
                                className={`authFormEmailInput ${redEmailPlaceHolder ? 'field' : ''}`} 
                                onChange={(e) => setEmail({ ...email, value: e.target.value })} value={email.value}/>
                                <label className="authLabel">UserName<span className="authRequireTag">*</span></label>
                                <input maxLength='16' name="username" placeholder={userName.placeholder} 
                                className={`authFormUserNameInput ${redUserNamePlaceHolder ? 'field' : ''}`}
                                onChange={(e) => setUserName({ ...userName, value: e.target.value })} value={userName.value}/>
                                <label className="authLabel">Password<span className="authRequireTag">*</span></label>
                                <input type="password" name="password" placeholder={password.placeholder} 
                                className={`authFormPassWordInput ${redPasswordPlaceholder ? 'field' : ''}`} 
                                onChange={(e) => setPassword({ ...password, value: e.target.value })} value={password.value}/>
                                {loader ? (
                                    <button className="authConfirmBtn authLoader"><span class="modalLoader"></span></button>
                                ) : (
                                    <button type="submit" className="authConfirmBtn">{authConfig ? 'Sign Up' : 'Log In'}</button>
                                )}  
                            </form>
                            <small className="authFormQuestion">{authConfig ? 'Already have an account?' : `Don't have an account?`} <Link 
                            className="authFormRedirectLink" to={authConfig ? '/log-in' : `/sign-up`} onMouseDown={(e) => e.preventDefault()}>
                            {authConfig ? 'Log in' : `Sign up`}</Link></small>
                        </div>
                    </div>
                </div>
                <div className="authRightSideWrapper">
                    <img alt="authentication page image" src={authConfig ? signUpImg : signInImg} className="authPageImg" 
                    onMouseDown={(e) => e.preventDefault()} onLoad={handleImageLoad}/>
                    <div className="authImgTxtWrapper">
                        <h1 className="authImgSlogan">{authConfig ? 'Creating Connections, One Chat at a Time.' : 
                        `Your Gateway to Global Conversations.`}</h1>
                        <p className="authImgParagraph">Chatter Sphere is a real-time chat platform designed to bring people closer, allowing users to share thoughts, 
                            exchange ideas, and foster connections across the globe.</p>
                        <div className="authImgIconWrapper">
                            <span className="authImgIcon"><img src={free} className="authIconImg" 
                            onMouseDown={(e) => e.preventDefault()}/>Free to use!</span>
                            <span className="authImgIcon"><img src={laptop} className="authIconImg" 
                            onMouseDown={(e) => e.preventDefault()}/>Device compatibility!</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Authenticate
