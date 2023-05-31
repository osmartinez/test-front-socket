import { useContext } from "react";
import { Button, Container, Nav, NavItem, Navbar } from "react-bootstrap";
import { RoomContext } from "../contexts/RoomContext";
import { Link } from "react-router-dom";

export default function NavbarComponent() {

    const {
        userId,
        roomId,
        logout,
        runLocalVideo,
        localVideo,
        toggleScreenSharing,
        toggleChat,
        toggleCam,
        toggleMic,
        isCamActive,
        isMicActive
    } = useContext(RoomContext)



    return (
        <>

            <Navbar bg="primary" className="navbar-expand-lg">
                <Container fluid >
                    <Link className="navbar-brand text-white" to="/">Chat live</Link>

                    {userId ? (<>
                        <Nav className="navbar-nav mx-auto mb-2 mb-lg-0">
                            <NavItem className="mr-3">
                                <Button onClick={toggleCam}>
                                    {
                                        isCamActive ?
                                            <i className="fa fa-video-slash text-white mr-3"></i>
                                            :
                                            <i className="fa fa-video text-white mr-3"></i>
                                    }
                                </Button>
                            </NavItem>
                            <NavItem>
                                <Button onClick={toggleMic}>
                                    {
                                        isMicActive ?
                                            <i className="fa fa-microphone-slash text-white mr-3"></i>
                                            :
                                            <i className="fa fa-microphone text-white mr-3"></i>
                                    }
                                </Button>
                            </NavItem>
                            <NavItem>
                                <Button onClick={toggleScreenSharing}>
                                    <i className="fa  fa-desktop text-white"></i>
                                </Button>
                            </NavItem>
                            <NavItem>
                                <Button>
                                    <i className="fa fa-dot-circle text-white mr-3"></i>
                                </Button>
                            </NavItem>
                            <NavItem>
                                <Button onClick={toggleChat}>
                                    <i className="fa fa-comment text-white mr-3"></i> <span className="badge badge-danger very-small font-weight-lighter" id='new-chat-notification' hidden>New</span>
                                </Button>
                            </NavItem>
                        </Nav>

                        <Button variant="danger" onClick={logout}>
                            <i className="fa fa-phone-slash text-white"></i>
                        </Button>
                    </>
                    ) : ""}
                </Container>
            </Navbar>
        </>
    )
}