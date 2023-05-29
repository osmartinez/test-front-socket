import { useContext, useEffect,createRef } from "react"
import { RoomContext } from "../contexts/RoomContext"
import { Navigate, useParams } from "react-router-dom"
import { Col, Container, Row } from "react-bootstrap"
import ChatComponent from "../components/ChatComponent";

export default function RoomPage() {

    const { roomId, connectSocket,localVideo, isChatVisible } = useContext(RoomContext)
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
            <>
                <Container>
                    
                    <Row>
                        <Col className="bg-primary">
                            <video ref={localVideo} className="local-video mirror-mode" id='local' volume='0' autoPlay muted></video>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={isChatVisible?9:12} className="main" id="main-section">
                            <Row className="mt-2 mb-2" id="videos"></Row>
                        </Col>

                        <Col  md={3}  className={`chat-col d-print-none mb-2 bg-dark ${isChatVisible?'chat-opened':''}`} id="chat-pane" >
                            <ChatComponent></ChatComponent>
                        </Col>
                    </Row>

                </Container>
            </>
        )
    }



}