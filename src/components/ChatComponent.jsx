import { useContext, useState } from "react"
import { Form, Col, Container, FormGroup, Row, Button } from "react-bootstrap"
import { RoomContext } from "../contexts/RoomContext"


export default function ChatComponent() {

    const { roomId, userId, chatHistory, addChatMessage, socket } = useContext(RoomContext)
    const [chatMessage, setChatMessage] = useState("")


    function sendChatMessage() {
        setChatMessage(chatMessage.trim())

        const data = {
            room: roomId,
            msg: chatMessage,
            sender: userId,
        }

        socket.emit("chat", data)

        addChatMessage({ data, mode: 'local' })

        setTimeout(() => {
            setChatMessage("")
        }, 20)

    }

    return <>
        <Container >
            <Row className="mt-2">
                <Col>
                    <h5 className="text-center ">Chat box</h5>
                </Col>
            </Row>
            <Row className="mt-2">
                <Col >
                    <div id="chat-messages">
                        {
                            chatHistory.map((msg, idx) => {
                                return (
                                    <Row key={idx} className={`mx-1 mb-2 ${msg.mode === "remote" ? "justify-content-start" : "justify-content-end"}`}>
                                        <Col sm="10" className={`card chat-card msg ${msg.mode === "remote" ? "" : "bg-white"}`}>
                                            <div className="sender-info">{msg.mode === "local" ? "" : `${msg.data.sender}: `}
                                                {msg.data.msg}</div>
                                        </Col>
                                    </Row>
                                )
                            })
                        }
                    </div>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Form>
                        <FormGroup className="mb-3 input-group">
                            <textarea style={{ width: '70%' }} className="rounded-0" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} ></textarea>
                            <Button style={{ width: '30%' }} onClick={sendChatMessage}>send</Button>
                        </FormGroup>
                    </Form>
                </Col>
            </Row>
        </Container>
    </>
}