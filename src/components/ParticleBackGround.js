import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, Routes, Route, Outlet, Link } from "react-router-dom";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

const ParticleBackGround = () => {

    const particlesInit = useCallback(engine => {
        console.log(engine);
        // you can initiate the tsParticles instance (engine) here, adding custom shapes or presets
        // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
        // starting from v2 you can add only the features you need reducing the bundle size
        loadFull(engine);
    }, []);
    
    const particlesLoaded = useCallback(container => {
        console.log(container);
    }, []);

    return (
        <Particles 
           id="tsparticles"
           init={particlesInit}
           loaded={particlesLoaded}
           style= {{
            position: 'absolute',
            height: '100%',
            width: '100%',
          }}
           options={{
            background: {
              color: "#000000",
            },
            fullScreen: {
                enable: false
            },
               fpsLimit: 120,
               interactivity: {
                   events: {
                       onClick: {
                           enable: false,
                           mode: "push",
                       },
                       onHover: {
                           enable: false,
                           mode: "repulse",
                       },
                       resize: true,
                   },
                   modes: {
                       push: {
                           quantity: 4,
                       },
                       repulse: {
                           distance: 200,
                           duration: 0.4,
                       },
                   },
               },
               particles: {
                   color: {
                       value: "#ffffff",
                   },
                   links: {
                       color: "#ffffff",
                       distance: 110,
                       enable: true,
                       opacity: 0.5,
                       width: 1,
                   },
                   collisions: {
                       enable: true,
                   },
                   move: {
                       direction: "none",
                       enable: true,
                       outModes: {
                           default: "bounce",
                       },
                       random: false,
                       speed: 1,
                       straight: false,
                   },
                   number: {
                       density: {
                           enable: true,
                           area: 800,
                       },
                       value: 80,
                   },
                   opacity: {
                       value: 0.5,
                   },
                   shape: {
                       type: "circle",
                   },
                   size: {
                       value: { min: 1, max: 3 },
                   },
               },
               detectRetina: true,
           }}
        />
    )
}

export default ParticleBackGround