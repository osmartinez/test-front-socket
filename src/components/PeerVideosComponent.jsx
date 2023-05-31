import { useContext } from "react"
import { RoomContext } from "../contexts/RoomContext"
import VideoComponent from "./VideoComponent"

export default function PeerVideosComponent() {
    const { peerStreams, mutePeer } = useContext(RoomContext)

    function expandStream(e) {
        let elem = e.target.parentElement.previousElementSibling;
        elem.requestFullscreen() || elem.mozRequestFullScreen() || elem.webkitRequestFullscreen() || elem.msRequestFullscreen();
    }


    return (

        peerStreams.map(ps => {
            return (
                <div style={{
                    width:
                        peerStreams.length === 1 ? '90%' : (
                            peerStreams.length <= 2 ? '50%' : (
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
                        )
                }} key={ps.partnerName} id={ps.partnerName} className="card card-sm">
                    <VideoComponent srcObject={ps.stream} autoPlay={true} id={`${ps.partnerName}-video`} muted={ps.muted}></VideoComponent>
                    <div className="remote-video-controls">
                        <i style={{ cursor: 'pointer' }} onClick={() => mutePeer(ps.partnerName)} className={`fa ${ps.muted ? 'fa-microphone' : 'fa-microphone-slash'} text-white pr-3 mute-remote-mic" title="Mute"`}></i>
                        <i style={{ cursor: 'pointer' }} onClick={expandStream} className="fa fa-expand text-white expand-remote-video" title="Expand"></i>
                    </div>
                </div>
            )
        })

    )
}