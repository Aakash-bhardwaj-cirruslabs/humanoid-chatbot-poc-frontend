import React, { useEffect, useState } from 'react'
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
function ChatBotAudio() {
    const [loading, setLoading] = useState(false)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [showChat, setShowChat] = useState(false)
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

    const fetchResponseFronBot = async (prompt) => {
        setLoading(true)
        axios
            .post('http://localhost:8080/api/chatbot', { prompt: prompt })
            .then((res) => {
                setMessages((currentMessages) => [
                    ...currentMessages,
                    { text: res.data, sender: 'Bot', type: 'code' },
                ])

                speakText(res.data)
            })
            .catch((err) => console.log(err))
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
        utterance.rate = 0.8 // Speed of speech
        utterance.pitch = 1 // Pitch of speech
        utterance.volume = 1 // Volume

        utterance.onstart = () => {
            SpeechRecognition.stopListening() // Stop the animation when speaking is done
        }
        // Speak the text
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
    return (
        <>
            {/* <NavBar /> */}
            <ThemeProvider theme={theme}>
                {showChat ? (
                    <Paper elevation={3}>
                        <div
                            maxWidth="xs"
                            style={{
                                width: '350px',
                                backgroundColor: '#EEEEEE',
                                border: '1px solid #f0f0f0',
                                position: 'fixed',
                                right: '20px',
                                bottom: '20px',
                                borderRadius: '15px',
                                zIndex: 1,
                            }}
                        >
                            <>
                                <div
                                    style={{
                                        backgroundColor:
                                            theme.palette.primary.main,
                                        width: '350px',
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
                                <Box
                                    sx={{
                                        width: '350px',
                                        height: '350px',
                                        display: 'flex',
                                        flexDirection: 'column-reverse',
                                        overflowY: 'scroll',
                                        mb: 1,
                                        mt: 1,
                                        borderRadius: '10px',
                                    }}
                                >
                                    <List>
                                        {messages.map((message, index) => (
                                            <ListItem key={index}>
                                                <ListItemText
                                                    primary={renderMessageContent(
                                                        message
                                                    )}
                                                    // secondary={
                                                    //     message.sender ===
                                                    //     'user'
                                                    //         ? 'You'
                                                    //         : 'Bot'
                                                    // }
                                                />
                                                {/* <Speech
                                                    stop={true}
                                                    pause={true}
                                                    resume={true}
                                                    text={message.text}
                                                    voice="Google UK English FeMale"
                                                /> */}
                                            </ListItem>
                                        ))}
                                        {loading && (
                                            <Box
                                                display="flex"
                                                alignItems="center"
                                                gap={1}
                                                sx={{
                                                    margin: '10px 10px 10px 20px',
                                                }}
                                            >
                                                <div class="typing">
                                                    <span></span>
                                                    <span></span>
                                                    <span></span>
                                                </div>
                                            </Box>
                                        )}
                                    </List>
                                </Box>

                                <form
                                    onSubmit={sendMessage}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <TextField
                                        style={{
                                            width: '80%',
                                            marginBottom: '1rem',
                                            backgroundColor: 'white',
                                        }}
                                        variant="outlined"
                                        label="Ask your questions..."
                                        value={input}
                                        onChange={(e) =>
                                            setInput(e.target.value)
                                        }
                                    />
                                    <Box
                                        sx={{
                                            backgroundColor: 'white',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            borderRadius: '50%',
                                            height: '60px',
                                            width: '60px',
                                            marginBottom: '1rem',
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
                    </Paper>
                ) : (
                    <div
                        style={{
                            width: 'fit-content',
                            backgroundColor: 'none',
                            position: 'fixed',
                            right: '10px',
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
        </>
    )
}

export default ChatBotAudio
