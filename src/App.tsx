import {FloatChat} from "./FloatChat.tsx";
import SsoLogin from "./SsoLogin.tsx";
import './App.css'

function App() {

  return (
    <>
        <div className="FloatChat">
        <FloatChat needHelpEvent="no"/>
            <SsoLogin />
        </div>
    </>
  )
}

export default App
