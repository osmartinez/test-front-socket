import { useContext, useEffect, createRef } from "react"
import { RoomContext } from "../contexts/RoomContext"
import { Navigate, useParams } from "react-router-dom"
import { Col, Container, Row } from "react-bootstrap"
import ChatComponent from "../components/ChatComponent";
import VideoComponent from "../components/VideoComponent";
import PeerVideosComponent from "../components/PeerVideosComponent";

export default function RoomPage() {

    const {
        roomId,
        connectSocket,
        isChatVisible,
        myStream,
        myScreen } = useContext(RoomContext)
    const params = useParams()

    useEffect(() => {
        connectSocket()

    }, [])

    if (roomId !== params.id) {
        return (
            <>
                <Navigate to="/" replace></Navigate>
            </>
        )
    }
    else {
        return (
                <Container>
                    <Row>
                        <Col className="bg-primary">
                            <VideoComponent className={`local-video ${myScreen ? '' : 'mirror-mode'}`} volume="0" autoPlay={true} muted={true} id="local" srcObject={myScreen ?? myStream} ></VideoComponent>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={isChatVisible ? 9 : 12} className="main" id="main-section">
                            <Row className="mt-2 mb-2" id="videos">
                                <PeerVideosComponent></PeerVideosComponent>
                            </Row>
                        </Col>

                        <Col md={3} className={`chat-col d-print-none mb-2 bg-dark ${isChatVisible ? 'chat-opened' : ''}`} id="chat-pane" >
                            <ChatComponent></ChatComponent>
                        </Col>
                    </Row>

                </Container>
        )
    }



}