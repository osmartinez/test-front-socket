import { useContext, useEffect, createRef } from "react"
import { RoomContext } from "../contexts/RoomContext"
import { Navigate, useParams } from "react-router-dom"
import { Col, Container, Row } from "react-bootstrap"
import ChatComponent from "../components/ChatComponent";
import VideoComponent from "../components/VideoComponent";

export default function RoomPage() {

    const { roomId, connectSocket, isChatVisible, peerStreams,myStream,myScreen } = useContext(RoomContext)
    const params = useParams()

    function expandStream(e){
        let elem = e.target.parentElement.previousElementSibling;
        elem.requestFullscreen() || elem.mozRequestFullScreen() || elem.webkitRequestFullscreen() || elem.msRequestFullscreen();
    }


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
                        <VideoComponent className={`local-video ${myScreen? '': 'mirror-mode'}`} volume="0" autoPlay={true} muted={true} id="local" srcObject={myScreen??myStream} ></VideoComponent>

                        </Col>
                    </Row>
                    <Row>
                        <Col md={isChatVisible ? 9 : 12} className="main" id="main-section">
                            <Row className="mt-2 mb-2" id="videos">
                                {
                                    peerStreams.map(ps => {
                                        return (
                                            <div style={{
                                                width: peerStreams.length <= 2 ? '50%' : (
                                                    peerStreams.length == 3 ? '33.33%' : (
                                                        peerStreams.length <= 8 ? '25%' : (
                                                            peerStreams.length <= 15 ? '20%' : (
                                                                peerStreams.length <= 18 ? '16%' : (
                                                                    peerStreams.length <= 23 ? '15%' : (
                                                                        peerStreams.length <= 32 ? '12%' : '10%'
                                                                    )
                                                                )
                                                            )
                                                        )
                                                    )
                                                )
                                            }} key={ps.partnerName} id={ps.partnerName} className="card card-sm">
                                                <VideoComponent srcObject={ps.stream} autoPlay={true} id={`${ps.partnerName}-video`}></VideoComponent>
                                                <div className="remote-video-controls">
                                                    <i className="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
            //                                      <i style={{cursor:'pointer'}} onClick={expandStream} className="fa fa-expand text-white expand-remote-video" title="Expand"></i>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </Row>
                        </Col>

                        <Col md={3} className={`chat-col d-print-none mb-2 bg-dark ${isChatVisible ? 'chat-opened' : ''}`} id="chat-pane" >
                            <ChatComponent></ChatComponent>
                        </Col>
                    </Row>

                </Container>
            </>
        )
    }



}