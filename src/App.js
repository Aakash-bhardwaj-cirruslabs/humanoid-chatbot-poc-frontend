/* eslint-disable jsx-a11y/iframe-has-title */
import React, { useState } from 'react'

import ChatBot from './ChatBot'
import ChatBotAudio from './ChatBotAudio'
import Dictaphone from './SpeechBox'
import ChatBotVideo from './ChatBotVideo'
import SoloBot from './soloBot'
function App() {
    const [soloMode, setSoloMode] = useState(false)
    return (
        <>
            {soloMode ? (
                <div>
                    <SoloBot soloMode={soloMode} />
                </div>
            ) : (
                <div>
                    <iframe
                        src="https://www.cirruslabs.io/"
                        style={{
                            width: '100%', // or '100%' if you want it to be fully responsive
                            height: '100vh',
                            border: 'none',
                        }}
                    ></iframe>
                    <ChatBotVideo />
                </div>
            )}
        </>
    )
}

export default App
