import { useContext } from "react";
import { Button, Navbar } from "react-bootstrap";
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
    } = useContext(RoomContext)

    return (
        <>
            <Navbar bg="info" >
                <div className="text-white">
                    Chat.js live
                </div>
                <div className="pull-right room-comm" >
                    <span className="text-white mr-5">
                        Unique Identifier: <span id='randomNumber'></span>
                    </span>

                    {/* <button className="btn btn-sm rounded-0 btn-no-effect" id='toggle-video' title="Hide Video"> */}
                    <Button onClick={toggleCam} size="sm" className="rounded-0 ">
                        <i className="fa fa-video text-white"></i>
                    </Button>

                    {/* <button className="btn btn-sm rounded-0 btn-no-effect" id='toggle-mute' title="Mute"> */}
                    <Button onClick={toggleMic} size="sm" className="rounded-0 ">
                        <i className="fa fa-microphone-alt text-white"></i>
                    </Button>

                    {/* <button className="btn btn-sm rounded-0 btn-no-effect" id='share-screen' title="Share screen"> */}
                    <Button onClick={toggleScreenSharing} size="sm" className="rounded-0 ">
                        <i className="fa fa-desktop text-white"></i>
                    </Button>

                    {/* <button className="btn btn-sm rounded-0 btn-no-effect" id='record' title="Record"> */}
                    <Button size="sm" className="rounded-0 ">
                        <i className="fa fa-dot-circle text-white"></i>
                    </Button>

                    {/* <button className="btn btn-sm text-white pull-right btn-no-effect" id='toggle-chat-pane'> */}
                    <Button onClick={toggleChat} size="sm" className="rounded-0 ">
                        <i className="fa fa-comment"></i> <span className="badge badge-danger very-small font-weight-lighter" id='new-chat-notification' hidden>New</span>
                    </Button>


                    {roomId ? <Link to="/logout" className="btn btn-no-effect btn-sm rounded-0 ">
                        <i className="fa fa-sign-out-alt text-white" title="Leave"></i>
                    </Link> : ""}

                </div>
            </Navbar>
        </>
    )
}