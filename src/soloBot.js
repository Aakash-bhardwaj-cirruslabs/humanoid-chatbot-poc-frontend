import React, { useEffect, useRef, useState } from 'react'
import {
    Box,
    TextField,
    List,
    ListItem,
    ListItemText,
    Container,
    Link,
    Paper,
    createTheme,
    ThemeProvider,
    Button,
} from '@mui/material'
import Linkify from 'react-linkify'
import axios from 'axios'
import AdbIcon from '@mui/icons-material/Adb'
import PersonIcon from '@mui/icons-material/Person'
import Fab from '@mui/material/Fab'
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close'
import SpeechRecognition, {
    useSpeechRecognition,
} from 'react-speech-recognition'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
function SoloBot() {
    const [videoMode, setVideoMode] = useState(true)
    const [loading, setLoading] = useState(false)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [showChat, setShowChat] = useState(true)
    const [isRecording, setIsRecording] = useState(false)
    const [mediaRecorder, setMediaRecorder] = useState(null)
    const [audioChunks, setAudioChunks] = useState([])
    const [audioBlob, setAudioBlob] = useState(null)
    const [recording, setRecording] = useState(false)
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
    } = useSpeechRecognition()
    const [shouldPlay, setShouldPlay] = useState(false)

    // Reference to the video element
    const videoRef = useRef(null)
    const fetchResponseFronBot = async (prompt) => {
        setLoading(true)
        axios
            .post('http://localhost:8080/api/chatbot', { prompt: prompt })
            .then((res) => {
                setMessages((currentMessages) => [
                    ...currentMessages,
                    { text: res.data, sender: 'Bot', type: 'code' },
                ])
                if (videoRef.current) {
                    setShouldPlay(true)
                    videoRef.current.play()
                    videoRef.current.loop = true
                }
                speakText(res.data)
            })
            .catch((err) => {
                if (videoRef.current) {
                    setShouldPlay(true)
                    videoRef.current.play()
                    videoRef.current.loop = true
                }
                speakText(
                    `can not give you answer as i m facing ${err.message}, i'll be able to help you once ${err.message} is resolved..  Thanks :)`
                )
            })
            .finally(() => setLoading(false))
    }
    const sendMessage = (e, messageType = 'text') => {
        e.preventDefault()
        if (input.trim()) {
            setMessages([
                ...messages,
                { text: input, sender: 'user', type: messageType },
            ])
            fetchResponseFronBot(input.trim())
            setInput('')
            // Logic for bot responses goes here
        }
    }
    const speakText = (text) => {
        if (!text) return
        // Check if speech synthesis is supported
        if (!window.speechSynthesis) {
            alert('Your browser does not support speech synthesis.')
            return
        }

        // Create a new speech synthesis utterance
        const utterance = new SpeechSynthesisUtterance(text)

        // Optionally, set properties on the utterance
        utterance.rate = 1 // Speed of speech
        utterance.pitch = 1 // Pitch of speech
        utterance.volume = 1 // Volume
        utterance.voice = speechSynthesis.getVoices()[1]
        utterance.onstart = () => {
            SpeechRecognition.stopListening() // Stop listening to avoid feedback loop
        }

        // When the speech ends, pause and reset the video
        utterance.onend = () => {
            setShouldPlay(false) // You might not need this anymore if you control the video directly
            if (videoRef.current) {
                videoRef.current.loop = false
                videoRef.current.pause()
                videoRef.current.currentTime = 0 // Reset the video to the start
                setShouldPlay(false)
            }
        }

        window.speechSynthesis.speak(utterance)
    }

    const renderMessageContent = (message) => {
        let content
        switch (message.type) {
            case 'code':
                content = (
                    <Paper
                        style={{
                            padding: '10px',
                            backgroundColor: '#f5f5f5',
                            fontFamily: 'monospace',
                            width: '250px',
                            wordBreak: 'break-word',
                        }}
                    >
                        <Linkify>{message.text}</Linkify>
                    </Paper>
                )
                break
            case 'link':
                content = (
                    <Link
                        href={message.text}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Linkify>{message.text}</Linkify>
                    </Link>
                )
                break
            default:
                content = (
                    <span>
                        <Linkify>{message.text}</Linkify>
                    </span>
                )
        }

        // If the message is from the bot, prepend the ADB icon
        if (message.sender === 'Bot') {
            return (
                <Box display="flex" alignItems="center" gap={1}>
                    <AdbIcon color="success" /> {content}
                </Box>
            )
        }
        let icon
        if (message.sender === 'Bot') {
            icon = <AdbIcon />
        } else {
            // Default to PersonIcon for user messages
            icon = <PersonIcon />
        }

        return (
            <Box display="flex" alignItems="center" gap={1}>
                {icon} {content}
            </Box>
        )
    }
    const theme = createTheme({
        palette: {
            primary: {
                main: '#1976d2', // Your primary main color
                light: 'rgb(51 115 87 / 7%)', // A lighter shade of your primary color
                dark: '#1976d2', // A darker shade of your primary color
                contrastText: '#ffffff', // Text color that contrasts with the primary color
            },
            secondary: {
                main: '#ffffff', // Your secondary main color
                light: '#ffcccb', // A lighter shade of your secondary color
                dark: '#1976d2', // A darker shade of your secondary color
                contrastText: '#000000', // Text color that contrasts with the secondary color
            },
        },
    })
    const startRecording = () => {
        setIsRecording(true)
        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
                const recorder = new MediaRecorder(stream)
                recorder.ondataavailable = (event) => {
                    setAudioBlob(event.data)
                }
                recorder.start()
                setMediaRecorder(recorder)
                setRecording(true)
            })
            .catch(console.error)
    }

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop()
            setRecording(false)
            sendAudioToServer()
            setIsRecording(false)
        }
    }
    const sendAudioToServer = () => {
        if (audioBlob) {
            const formData = new FormData()
            formData.append(
                'audio',
                new File([audioBlob], 'recording.webm', {
                    type: 'audio/webm',
                })
            )

            fetch('http://localhost:8080/audio', {
                method: 'POST',
                body: formData,
            })
                .then((response) => response.json())
                .then((res) => {
                    setMessages((currentMessages) => [
                        ...currentMessages,
                        { text: res, sender: 'Bot', type: 'code' },
                    ])
                })
                .catch(console.error)
        }
    }
    // const sendAudio = () => {
    //     const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
    //     const formData = new FormData()
    //     formData.append('audio', audioBlob)
    //     axios
    //         .post('http://localhost:8080/audio', formData, {
    //             headers: {
    //                 'Content-Type': 'multipart/form-data',
    //             },
    //         })
    //         .then((response) => {
    //             // Handle the transcription result here
    //             // Assuming the server returns the transcribed text in response.data.transcription
    //             console.log(response.data)
    //             setMessages((currentMessages) => [
    //                 ...currentMessages,
    //                 {
    //                     text: response.data.transcription,
    //                     sender: 'Bot',
    //                     type: 'text',
    //                 },
    //             ])
    //         })
    //         .catch((error) => {
    //             console.error('Error sending audio:', error)
    //         })
    //         .finally(() => {
    //             setAudioChunks([]) // Reset audio chunks
    //         })
    // }
    useEffect(() => {
        if (transcript && transcript.length > 0 && !listening) {
            console.log(listening)
            fetchResponseFronBot(transcript)
            setMessages([
                ...messages,
                { text: transcript, sender: 'user', type: 'text' },
            ])
        }
    }, [transcript, listening])
    // useEffect(() => {
    //     if (shouldPlay && videoRef.current) {
    //         videoRef.current.play()
    //     } else if (videoRef.current) {
    //         videoRef.current.pause()
    //     }
    // }, [shouldPlay]) // Depend on `shouldPlay` to react to its changes

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
            }}
        >
            {/* <NavBar /> */}
            <ThemeProvider theme={theme}>
                {showChat ? (
                    <div
                        style={{
                            width: '450px',
                            height: 'fit-content',
                            backgroundColor: '#FFFF',
                            border: '1px solid #f0f0f0',
                            borderRadius: '15px',
                            zIndex: 1,
                        }}
                    >
                        <>
                            <div
                                style={{
                                    backgroundColor: theme.palette.primary.main,
                                    width: '100%',
                                    borderRadius: '15px',
                                    borderBottomRightRadius: '0px',
                                    borderBottomLeftRadius: '0px',
                                }}
                            >
                                <CloseIcon
                                    color="secondary"
                                    style={{
                                        margin: '10px',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => {
                                        window.parent.postMessage(
                                            {
                                                type: 'resizeIframe',
                                                state: 'closed',
                                            },
                                            '*'
                                        ) // Adjust domain accordingly

                                        setShowChat(false)
                                    }}
                                />
                            </div>
                            <List>
                                <video
                                    ref={videoRef}
                                    src="Jason.mp4"
                                    width="100%"
                                    height="250px"
                                    // autoPlay={shouldPlay}
                                    // loop={shouldPlay}
                                    // You might want to initially mute the video or provide controls for volume
                                    muted={true}
                                />

                                {loading && (
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={1}
                                        sx={{
                                            margin: '10px 10px 118px 223px',
                                            position: 'absolute',
                                            bottom: '70px',
                                        }}
                                    >
                                        <div class="typing-video">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </Box>
                                )}
                            </List>

                            <form
                                onSubmit={sendMessage}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: '100%',
                                }}
                            >
                                <TextField
                                    style={{
                                        width: '90%',

                                        backgroundColor: 'white',
                                    }}
                                    variant="outlined"
                                    label="Ask your questions..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <Box
                                    sx={{
                                        backgroundColor: 'white',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderRadius: '50%',
                                        height: '50px',
                                        width: '55px',

                                        border: listening
                                            ? '1px solid red'
                                            : '1px solid blue',
                                    }}
                                >
                                    {/* {isRecording ? (
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={stopRecording}
                                    >
                                        Stop Recording
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={startRecording}
                                    >
                                        Start Recording
                                    </Button>
                                )} */}

                                    {listening ? (
                                        <MicIcon
                                            style={{
                                                cursor: 'pointer',
                                                color: 'red',
                                            }}
                                            onClick={
                                                SpeechRecognition.stopListening
                                            }
                                        />
                                    ) : (
                                        <MicOffIcon
                                            style={{
                                                cursor: 'pointer',
                                            }}
                                            onClick={
                                                SpeechRecognition.startListening
                                            }
                                        />
                                    )}

                                    {/* <button
                                    onClick={
                                        SpeechRecognition.startListening
                                    }
                                >
                                    Start
                                </button>
                                <button
                                    onClick={
                                        SpeechRecognition.stopListening
                                    }
                                >
                                    Stop
                                </button>
                                <button onClick={resetTranscript}>
                                    Reset
                                </button> */}
                                    {/* <p>{transcript}</p> */}
                                </Box>

                                {/* <Button
                            variant="contained"
                            endIcon={<SendIcon />}
                            onClick={(e) => sendMessage(e)}
                            style={{ padding: '1rem' }}
                        >
                            Send
                        </Button> */}
                            </form>
                        </>
                    </div>
                ) : (
                    <div
                        style={{
                            width: 'fit-content',
                            backgroundColor: 'none',
                            position: 'fixed',
                            right: '20px',
                            bottom: '50px',
                        }}
                    >
                        <Fab
                            color="primary"
                            aria-label="add"
                            onClick={() => {
                                setShowChat(true)
                                window.parent.postMessage(
                                    { type: 'resizeIframe', state: 'open' },
                                    '*'
                                ) // Adjust domain accordingly
                            }}
                        >
                            <ChatIcon />
                        </Fab>
                    </div>
                )}
            </ThemeProvider>
        </div>
    )
}

export default SoloBot
