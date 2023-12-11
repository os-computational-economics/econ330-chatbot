import Chat, {Bubble, useMessages} from '@chatui/core';
import '@chatui/core/dist/index.css';
import { Button,ConfigProvider,Popconfirm,message } from 'antd';
import * as React from 'react';
import './chatui-theme.css';
import Markdown from "react-markdown";
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import {oneDark} from "react-syntax-highlighter/dist/esm/styles/prism";

type msgSide = "left" | "right" | "center" | "pop" | undefined;

export function FloatChat() {
    const { messages, appendMsg, setTyping } = useMessages([]);
    React.useEffect(() => {
        console.log('load chat history');
        loadChatHistory();
    }, []);
    const AI_CHAT_HISTORY_KEY: string = "ECON330_CHAT_HISTORY";
    const AI_CLIENT_KEY: string = "AI_CLIENT_ID";

    function handleSend(type: string, val: string) {
        // get login token
        const login_token = getCookie("cy_login_token");
        if (login_token === undefined) {
            message.error('Please login first.');
            return;
        }
        if (type === 'text' && val.trim()) {
            handleNewMsg(val, 'right')
            // send message to backend
            sendMsgToBackend(val);
        }
    }

    function sendMsgToBackend(msg: string) {
        setTyping(true);
        fetch('https://dev-api-v1.courseyai.com/chat/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'login_token': getCookie("cy_login_token"),
                'message': msg,
                'module_id': "ECON330",
                'course_id': "ECON330",
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    handleNewMsg('Sorry, I am not available right now. Please try again later.', 'left');
                }
            })
            .then(responseData => {
                for (let i = 0; i < responseData.messages.length; i++) {
                    const ans = responseData.messages[i];
                    handleNewMsg(ans, 'left');
                }
            })
            .catch(() => {
                const errorMessage = 'Sorry, I am not available right now. Please try again later.';
                handleNewMsg(errorMessage, 'left');
            });
    }

    function handleNewMsg(msg: string, side: msgSide) {
        appendMsg({
            type: 'text',
            content: { text: msg },
            position: side,
        });
        saveMessage(msg, side);
    }

    function saveMessage(msg: string, side: msgSide) {
        const chatHistory = JSON.parse(localStorage.getItem(AI_CHAT_HISTORY_KEY) || "{}");
        const clientID = localStorage.getItem(AI_CLIENT_KEY) || 0;
        if (!chatHistory[clientID]) {
            chatHistory[clientID] = [];
        }
        chatHistory[clientID].push({
            side: side,
            message: msg,
        });
        localStorage.setItem(AI_CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
    }

    function loadChatHistory() {
        const chatHistory = JSON.parse(localStorage.getItem(AI_CHAT_HISTORY_KEY) || "{}");
        const clientID = localStorage.getItem(AI_CLIENT_KEY) || 0;
        if (!chatHistory[clientID]) {
            chatHistory[clientID] = [];
        }
        const history = chatHistory[clientID];
        for (let i = 0; i < history.length; i++) {
            const msg = history[i];
            appendMsg({
                type: 'text',
                content: { text: msg.message },
                position: msg.side,
            });
        }
        // scroll to bottom
        const chatContent = document.getElementsByClassName('PullToRefresh')[0];
        setTimeout(() => {
            chatContent.scrollTop = chatContent.scrollHeight;
        }, 100);
    }

    function clearChatHistory() {
        const chatHistory = JSON.parse(localStorage.getItem(AI_CHAT_HISTORY_KEY) || "{}");
        const clientID = localStorage.getItem(AI_CLIENT_KEY) || 0;
        if (!chatHistory[clientID]) {
            chatHistory[clientID] = [];
        }
        chatHistory[clientID] = [];
        localStorage.setItem(AI_CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
        messages.splice(0, messages.length);
        const login_token = getCookie("cy_login_token");
        const url = 'https://dev-api-v1.courseyai.com/chat/clearChatHistory?login_token=' + login_token + '&course_id=ECON330';
        fetch(url, {
            method: 'GET',
        }).then(response => {
            if (response.ok) {
                return response.json();
            } else if (response.status === 401 || response.status === 400) {
                message.error('Please login first.');
            }
        }).then(responseData => {
            if (responseData.status === "success") {
                //reload page
                window.location.reload();
            } else {
                message.error('Chat history clear failed.');
            }
        });
    }

    function renderMessageContent(msg: any) {
        const { content } = msg;
        return <Bubble type={'text'}>
            <Markdown
                children={content.text}
                components={{
                    pre(props) {
                        return <pre {...props} style={{margin: 0}}/>
                    },
                    code(props) {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const {children, className, node, ...rest} = props
                        const match = /language-(\w+)/.exec(className || '')
                        return match ? (
                            // @ts-expect-error ts-migrate(2554)
                            <SyntaxHighlighter
                                customStyle={{margin: 0, fontSize: "0.9rem"}}
                                {...rest}
                                children={String(children).replace(/\n$/, '')}
                                style={oneDark}
                                language={match[1]}
                            />
                        ) : (
                            <code {...rest} className={className}>
                                {children}
                            </code>
                        )
                    }
                }}
            />
        </Bubble>;
    }

    function getCookie(name: string) {
        const cookies = document.cookie.split(';');
        const cookie = cookies.find((cookie) => cookie.trim().startsWith(name));
        if (cookie !== undefined) {
            return cookie.split('=')[1];
        }
        return undefined;
    }


    return (
        <>
            <Chat
                locale="en-US"
                navbar={{ title: 'ECON330 Final Essay Writing Mate' }}
                messages={messages}
                renderMessageContent={renderMessageContent}
                onSend={(type, content) => handleSend(type, content)}
                placeholder={'Ask me anything...'}
            />
            <ConfigProvider
                theme={{
                    "token": {
                        "colorPrimary": "#76c2ed",
                    }
                }}>
                <Popconfirm
                    title="Confirm"
                    description="Are you sure to clear all chat history?"
                    onConfirm={clearChatHistory}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button
                        style={{ position: 'absolute', top: '8px', left: '10px', zIndex: 10, borderRadius: '10px' }}
                        size="small"
                    >
                        Clear Chat
                    </Button>
                </Popconfirm>
            </ConfigProvider>
        </>
    );
}
