import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';

const Main = () => {

    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
              const response = await fetch(`http://localhost:5000/`);
              if (response.status === 401) {
                navigate('/sign-up');
              }
            } catch (error) {
              console.log(error)
            }
          };
          checkAuth()
    }, [navigate]);

    return (
        <section>
            This is the main Page
        </section>
    )
}

export default Main