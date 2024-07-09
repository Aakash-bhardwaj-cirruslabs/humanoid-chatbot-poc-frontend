import React, { useState } from 'react'
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
} from '@mui/material'
import Linkify from 'react-linkify'
import axios from 'axios'
import AdbIcon from '@mui/icons-material/Adb'
import PersonIcon from '@mui/icons-material/Person'
import Fab from '@mui/material/Fab'
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close'

function ChatBot() {
    const [loading, setLoading] = useState(false)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [showChat, setShowChat] = useState(false)

    const fetchResponseFronBot = async (prompt) => {
        setLoading(true)
        axios
            .post('http://localhost:8080/api/chatbot', { prompt: prompt })
            .then((res) => {
                console.log(res.data)
                setMessages((currentMessages) => [
                    ...currentMessages,
                    { text: res.data, sender: 'Bot', type: 'code' },
                ])
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
                                            width: '90%',
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

export default ChatBot
