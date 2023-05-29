import { Alert, Button, Col, Container, Form, FormControl, InputGroup, Modal, Nav, Navbar, Row } from "react-bootstrap"
import './App.css'
import { Route, Routes } from "react-router-dom"
import NavbarComponent from "./components/NavbarComponent"
import FooterComponent from "./components/FooterComponent"
import WelcomePage from "./pages/WelcomePage"
import RoomContextProvider from "./contexts/RoomContext"
import RoomPage from "./pages/RoomPage"
import LogoutPage from "./pages/LogoutPage"

function App() {

  return (
    <RoomContextProvider>
      <div>
        <Modal>

        </Modal>

        <NavbarComponent></NavbarComponent>

        <Routes>
          <Route path="/" element={<WelcomePage></WelcomePage>}></Route>
          <Route path="/room/:id" element={<RoomPage></RoomPage>}></Route>
          <Route path="/logout" element={<LogoutPage></LogoutPage>}></Route>
        </Routes>



        <FooterComponent></FooterComponent>


      </div>
    </RoomContextProvider>

  )
}

export default App
