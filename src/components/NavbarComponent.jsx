import { useContext, useState } from "react";
import { Button, Container, Nav, NavItem, Navbar } from "react-bootstrap";
import { RoomContext } from "../contexts/RoomContext";
import { Link } from "react-router-dom";

export default function NavbarComponent() {

    const {
        userId,
        logout,
        toggleScreenSharing,
        toggleChat,
        toggleCam,
        toggleMic,
        isCamActive,
        isMicActive,
        recordVideo,
        recordScreen,
        toggleRecording,
        isRecording,
    } = useContext(RoomContext)

    const [displayRecordingModal, setDisplayRecordingModal] = useState("none")

    function toggleModal() {
        if (displayRecordingModal === "block") {
            setDisplayRecordingModal("none");
        } else {
            setDisplayRecordingModal("block");
        }
    }

    function toggleRecordingModal() {
        const result = toggleRecording();
        if (result) {
            toggleModal();
        }
    }

    function onRecordVideo() {
        toggleModal();
        recordVideo();
    }

    function onRecordScreen() {
        toggleModal();
        recordScreen();
    }



    return (
        <>
            <div
                style={{ display: displayRecordingModal }}
                className="custom-modal"
                id="recording-options-modal"
            >
                <div className="custom-modal-content">
                    <div className="row text-center">
                        <div onClick={() => onRecordVideo()} className="col-md-6 mb-2">
                            <span className="record-option" id="record-video">Record video</span>
                        </div>
                        <div onClick={() => onRecordScreen()} className="col-md-6 mb-2">
                            <span className="record-option" id="record-screen">Record screen</span>
                        </div>
                    </div>

                    <div className="row mt-3">
                        <div className="col-md-12 text-center">
                            <button
                                onClick={() => toggleRecordingModal()}
                                className="btn btn-outline-danger"
                                id="closeModal"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Navbar bg="primary" className="navbar-expand-lg">
                <Container fluid >
                    <Link className="navbar-brand text-white" to="/">Live.js</Link>

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
                                <Button onClick={() => toggleRecordingModal()}>
                                    <i className={`fa fa-dot-circle text-${isRecording?'danger':'white'} mr-3`}></i>
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