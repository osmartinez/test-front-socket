import { useContext, useState } from "react";
import {  Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { RoomContext } from "../contexts/RoomContext";
import { Navigate } from "react-router-dom";

export default function LoginComponent() {

    const [username, setUsername] = useState('')
    const { login, userId, roomId } = useContext(RoomContext)

    function tryLogin() {
        login(username)
    }

    if (userId) {
        return <Navigate to={`/room/${roomId}`} replace></Navigate>
    }
    else {
        return (
            <>
                <Card className="text-center mx-auto mt-3">
                    <Form>
                        <Container fluid>
                            <Row className="justify-content-md-center">
                                <Col md="auto">
                                    <Form.Group>
                                        <Form.Control value={username} onChange={(e) => setUsername(e.target.value)} className="mt-5" placeholder="Tu nombre" type="text"></Form.Control>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col className="h2 mt-5 text-center">
                                    <Button disabled={!username} onClick={tryLogin}>Create room</Button>
                                </Col>
                            </Row>
                        </Container>
                    </Form>
                </Card>

            </>
        )
    }

}