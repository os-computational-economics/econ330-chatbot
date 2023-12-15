import { HashRouter as Router, Route, Routes } from 'react-router-dom';  // HashRouter is for GitHub Pages
import {FloatChat} from "./FloatChat.tsx";
import SsoLogin from "./SsoLogin.tsx";
import './App.css'
import StuHist from "./StuHist.tsx";

function App() {
    return (
        <>
            <div className="FloatChat">
                <FloatChat />
                <SsoLogin />
            </div>
        </>
    )
}

function CheckStuHist() {
    return (
        <>
            <div className="StuHist">
                <StuHist />
            </div>
        </>
    )
}

function AppRouter() {
    return (
        <Router>
            <Routes >
                <Route path="/" element={<App />} />
                <Route path="/check-stu-hist" element={<CheckStuHist />} />
            </Routes>
        </Router>
    );
}

export default AppRouter;
