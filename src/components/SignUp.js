import React, { useState, useEffect, useRef } from "react";
import '../styles/SignUp.css'
import logo from '../assets/logo.png'
import signUpImg from '../assets/signUpImg.jpg'

const SignUp = () => {
    return (
        <section className="signUpWrapper">
            <div className="signUpLeftSideWrapper">
                <div className="logo-txt-wrapper">
                    <div className="signUpPageLogoWrapper">
                        <img className="signUpPageLogo" src={logo}/>
                    </div>
                    <h2>Chatter Sphere</h2>
                </div>
                <div className="signUpContentWrapper">
                    <h3>Create your account</h3>
                    <div className="signUpFormWrapper">
                        <form className="signUpForm">
                            <label>Email</label>
                            <input name="email" placeholder="Enter your email" />
                            <label>UserName</label>
                            <input name="username" placeholder="Enter your username" />
                            <label>Password</label>
                            <input name="password" placeholder="Enter your password" />
                            <button>Sign Up</button>
                        </form>
                        <small>Already have an account? <span>Log in</span></small>
                    </div>
                </div>
            </div>
            <div className="signUpRightSideWrapper">
                <img src={signUpImg}/>
                <div className="authImgTxtWrapper">
                    <h1>Creating Connections, One Chat at a Time.</h1>
                    <p>Chatter Sphere is a real-time chat platform designed to bring people closer, allowing users to share thoughts, 
                        exchange ideas, and foster connections across the globe.</p>
                    <div className="authImgIconWrapper">
                        <span>Free to use!</span>
                        <span>Able to use on any device!</span>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default SignUp

/* Your Gateway to Global Conversations. */