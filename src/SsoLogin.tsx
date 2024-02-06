import { Button, notification } from 'antd';
import React, { useState } from 'react';


export default function SsoLogin() {
    const [loginButtonText, setLoginButtonText] = useState('Login');
    const [loginButtonDisabled, setLoginButtonDisabled] = useState(false);

    React.useEffect(() => {
        checkTeacherMode();
        if (localStorage.getItem('AI_CLIENT_ID') === null) {
            localStorage.setItem('AI_CLIENT_ID', createUUID());
        }
    }, []);

    function createUUID() {
        // http://www.ietf.org/rfc/rfc4122.txt
        const s = [];
        const hexDigits = "0123456789abcdef";
        for (let i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
        // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = "-";

        return s.join("");
    }

    function addTeacherModeBorder() {
        // Create a new div element
        const bezel = document.createElement('div');
        // Set the style for the bezel
        bezel.style.position = 'fixed';
        bezel.style.top = '0';
        bezel.style.right = '0';
        bezel.style.bottom = '0';
        bezel.style.left = '0';
        bezel.style.border = '5px solid #B200ED'; // Customize the color and width as needed
        bezel.style.pointerEvents = 'none'; // Allows clicks to pass through
        bezel.style.boxSizing = 'border-box';
        bezel.style.zIndex = '9999'; // High z-index to ensure it's on top
        // Append the bezel div to the body
        document.body.appendChild(bezel);
        notification.warning({
            message: 'Teacher Mode On',
            description:
                'You are in teacher mode. Please use Load From Cloud to load your students\' code.',
            duration: 0,
        });
    }

    function checkTeacherMode() {
        let teacherMode = getCookie('cy_teacher_mode') || 'false';
        if (teacherMode === 'true') {
            addTeacherModeBorder()
            const clientID = getCookie('cy_login_token');
            checkLogin(clientID);
        }else {
            teacherMode = getURLParameter('teacherMode') || 'false';
            if (teacherMode === 'true') {
                const token = getURLParameter('token');
                const case_id = getURLParameter('caseId');
                if (token !== 'fail' && token !== null && case_id !== null) {
                    setCookie('cy_login_token', token, 1);
                    setCookie('cy_case_id', case_id, 1);
                    setCookie('cy_teacher_mode', 'true', 1)
                    setLoginButtonText(case_id);
                    setLoginButtonDisabled(true);
                    const currentUrlWithoutQueryString = window.location.href.split('?')[0];
                    window.history.pushState({}, '', currentUrlWithoutQueryString);
                    addTeacherModeBorder()
                    checkLogin(token);
                }
            } else {
                checkLogin();
            }
        }
    }

    function checkLogin(client_id: string = localStorage.getItem('AI_CLIENT_ID') || '') {
        const login_token = getCookie('cy_login_token');
        const case_id = getCookie('cy_case_id');
        if (login_token !== undefined && case_id !== undefined) {
            fetch(
                'https://api-v1.courseyai.com/teacher/loginStatus?' +
                new URLSearchParams({
                    login_token: login_token,
                    case_id: case_id,
                    client_id: client_id,
                }),
                {
                    method: 'GET',
                },
            )
                .then((response) => {
                    if (response.ok) {
                        return response.json();
                    }
                })
                .then((responseData) => {
                    if (responseData.loginStatus === true) {
                        setLoginButtonText(case_id || '');
                        setLoginButtonDisabled(true);
                    } else if (responseData.loginStatus === false) {
                        setCookie('cy_login_token', '', -1);
                        setCookie('cy_case_id', '', -1);
                    }
                });
        } else {
            const token = getURLParameter('token');
            const case_id = getURLParameter('caseId');
            if (token !== 'fail' && token !== null && case_id !== null) {
                setCookie('cy_login_token', token, 3);
                setCookie('cy_case_id', case_id, 3);
                setLoginButtonText(case_id);
                setLoginButtonDisabled(true);
                const currentUrlWithoutQueryString = window.location.href.split('?')[0];
                window.history.pushState({}, '', currentUrlWithoutQueryString);
            }
        }
    }

    function setCookie(name: string, value: string, days: number) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + (value || '') + expires + '; path=/';
    }

    function getCookie(name: string) {
        const cookies = document.cookie.split(';');
        const cookie = cookies.find((cookie) => cookie.trim().startsWith(name));
        if (cookie !== undefined) {
            return cookie.split('=')[1];
        }
        return undefined;
    }

    function getURLParameter(name: string) {
        const queryStr = window.location.search;
        const urlParams = new URLSearchParams(queryStr);
        return urlParams.get(name);
    }

    function startLogin() {
        // get cookie
        const clientID = localStorage.getItem('AI_CLIENT_ID');
        if (clientID !== null) {
            // get current url
            let currentUrl = window.location.href;
            currentUrl = currentUrl.split('?')[0];
            const CWRU_SSO_URL =
                'https://login.case.edu/cas/login?service=https://api-v1.courseyai.com/teacher/authSso/' +
                clientID;
            window.location.href = CWRU_SSO_URL + '?came_from=' + currentUrl;
        }
    }

    return (
        <Button
            style={{
                left: '2vw',
                bottom: '2vw',
                position: 'fixed',
                opacity: 0.92,
                borderRadius: '10px',
            }}
            shape="round"
            size="large"
            disabled={loginButtonDisabled}
            onClick={startLogin}
        >
            {loginButtonText}
        </Button>
    );
}
