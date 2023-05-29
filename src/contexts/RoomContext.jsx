import { createContext, useReducer, useState, createRef } from "react";
import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

const peers = {}

export const RoomContext = createContext()

export default function RoomContextProvider({ children }) {

    const iceServers = {
        iceTransportPolicy: "relay",

        iceServers: [
            {
                credential: 'password',
                username: 'username',
                url: 'turn:192.168.1.93:3478',
            }
        ]
    }
    let socketTemp = null
    const [socket, setSocket] = useState(null)
    const localVideo = createRef(null);
    const [screen, setScreen] = useState(null)
    const [myStream, setMyStream] = useState(null)


    const INITIALSTATE = {
        userId: null,
        roomId: null,
        chatHistory: [],
        chatVisible: true,
    }

    function reducer(state, action) {
        const statecopy = { ...state }

        switch (action.type) {
            case 'DO_LOGIN':
                statecopy.userId = action.payload
                break

            case 'OPEN_ROOM':
                statecopy.roomId = action.payload
                break

            case 'DO_LOGOUT':
                statecopy.userId = null
                statecopy.roomId = null
                break

            case 'ADD_CHAT_MESSAGE':
                statecopy.chatHistory = [...state.chatHistory, action.payload]
                break

            case 'TOGGLE_CHAT':
                statecopy.chatVisible = !statecopy.chatVisible
                break
        }

        return statecopy
    }

    const [state, dispatch] = useReducer(reducer, INITIALSTATE)

    function login(userName) {
        dispatch({ type: 'DO_LOGIN', payload: userName })
        dispatch({ type: 'OPEN_ROOM', payload: 'AAAAAA1' })
    }

    function logout() {
        dispatch({ type: 'DO_LOGOUT' })
    }

    function addChatMessage(message) {
        dispatch({ type: "ADD_CHAT_MESSAGE", payload: message })
    }

    /**
    1. cliente envia $suscribe con (room,socketId)
    2. servidor propaga a la sala $new user con (socketId)
    3. cliente escucha $new user con (socketId)
    4. cliente envia $newUserStart con (to: socketId, sender: state.userId)
    5. servidor propaga a data.to $newUserStart con (sender: data.sender)
    6. cliente escucha $newUserStart
    **/

    function connectSocket() {
        socketTemp = io("https://limitless-hollows-40808.herokuapp.com/")
        socketTemp.on('connect', () => {
            console.log('Conectado a socket.io')

            getAndSetUserStream()

            // i inform the server that i have been connected to a room and give my identifier (socketId)
            socketTemp.emit("subscribe", {
                room: state.roomId,
                socketId: state.userId,
            })

            // when a new client connects,
            socketTemp.on("new-user", (data) => {
                // i need to introduce myself so he recognizes me
                socketTemp.emit("introduce-myself", { to: data.socketId, sender: state.userId })
                // i add my own screen
                addPeer(true, data.socketId)
            })

            socketTemp.on("chat", (data) => {
                addChatMessage({ data, mode: 'remote' })
            })

            // when other client is introducing himself
            socketTemp.on("introduce-myself", (data) => {
                // i add his screen
                addPeer(false, data.sender)
            })

            socketTemp.on("ice candidates", async (data) => {
                data.candidate ? await peers[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate)) : ""
            })

            socketTemp.on("sdp", async (data) => {
                if (data.description.type === "offer") {
                    data.description ? await peers[data.sender].setRemoteDescription(new RTCSessionDescription(data.description)) : ""

                    getFullUserMedia()
                        .then(async (stream) => {
                            if (!localVideo.current) {
                                runLocalVideo()
                            }

                            setMyStream(stream)

                            stream.getTracks().forEach((track) => {
                                peers[data.sender].addTrack(track, stream)
                            })

                            const answer = await peers[data.sender].createAnswer()

                            await peers[data.sender].setLocalDescription(answer)

                            socketTemp.emit("sdp", { description: peers[data.sender].localDescription, to: data.sender, sender: state.userId })
                        })
                        .catch(err => console.log(err))
                } else if (data.description.type === 'answer') {
                    await peers[data.sender].setRemoteDescription(new RTCSessionDescription(data.description));
                }
            })
        })
        socketTemp.on('error', (err) => {
            alert(err)
            console.log(err)
        })
        setSocket(socketTemp)
    }

    function getFullUserMedia() {
        return navigator.mediaDevices.getUserMedia({
            video: true,
            audio: {
                echoCancellation: true,
                noiseSuppression: true
            }
        });
    }

    function runLocalVideo() {
        if (localVideo.current) {
            getFullUserMedia()
                .then((mediaStream) => {
                    localVideo.current.srcObject = mediaStream
                    localVideo.current.onloadedmetadata = (e) => {
                        localVideo.current.play()
                    }
                })
        }

    }

    function addPeer(createOffer, partnerName) {
        console.log(partnerName,' conectado')
        // i add to the peers object a new key of partner name and create a new rtcpeerconnection as value
        peers[partnerName] = new RTCPeerConnection(iceServers)

        if (screen && screen.getTracks().length) {
            screen.getTracks().forEach((track) => {
                peers[partnerName].addTrack(track, screen)
            })
        }
        else if (myStream) {
            myStream.getTracks().forEach((track) => {
                peers[partnerName].addTrack(track, myStream)
            })
        }
        else {
            getFullUserMedia()
                .then((stream) => {
                    setMyStream(stream)

                    stream.getTracks().forEach((track) => {
                        peers[partnerName].addTrack(track, stream)
                    })

                   setLocalStream(stream)
                })
        }

        if (createOffer) {
            peers[partnerName].onnegotiationneeded = async () => {
                const offer = await peers[partnerName].createOffer()
                await peers[partnerName].setLocalDescription(offer)
                socketTemp.emit("sdp", { description: peers[partnerName].localDescription, to: partnerName, sender: state.userId })
            }
        }

        peers[partnerName].onicecandidate = ({ candidate }) => {
            socketTemp.emit("ice candidates", { candidate: candidate, to: partnerName, sender: state.userId })
        }

        peers[partnerName].ontrack = (e) => {
            const str = e.streams[0]
            console.log()

            if (document.getElementById(`${partnerName}-video`)) {
                document.getElementById(`${partnerName}-video`).srcObject = str;
            }
            else {
                let newVid = document.createElement('video');

                newVid.id = `${partnerName}-video`;
                newVid.srcObject = str;
                newVid.autoplay = true;
                newVid.className = 'remote-video';

                //video controls elements
                let controlDiv = document.createElement('div');
                controlDiv.className = 'remote-video-controls';
                controlDiv.innerHTML = `<i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
                            <i class="fa fa-expand text-white expand-remote-video" title="Expand"></i>`;

                //create a new div for card
                let cardDiv = document.createElement('div');
                cardDiv.className = 'card card-sm';
                cardDiv.id = partnerName;
                cardDiv.appendChild(newVid);
                cardDiv.appendChild(controlDiv);

                //put div in main-section elem
                document.getElementById('videos').appendChild(cardDiv);
                adjustVideoElemSize()
            }


        }

        peers[partnerName].onconnectionstatechange = (d) => {
            switch (peers[partnerName].iceConnectionState) {
                case 'disconnected':
                case 'failed':
                    console.log(peers[partnerName])
                    console.log('peer connection failed: ', partnerName,d)
                    peers[partnerName].restartIce()
                    //closeVideo(partnerName);
                    break;

                case 'closed':
                    console.log('peer connection closed: ', partnerName)
                    closeVideo(partnerName);
                    break;
            }
        };

        peers[partnerName].onsignalingstatechange = (d) => {
            switch (peers[partnerName].signalingState) {
                case 'closed':
                    console.log("Signalling state is 'closed'");
                    closeVideo(partnerName);
                    break;
            }
        };


    }

    function closeVideo(partnerName) {
        if (document.getElementById(partnerName)) {
            document.getElementById(partnerName).remove();
            adjustVideoElemSize();
        }
    }


    function startScreenSharing() {
        navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: "always",
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100,
            }
        }).then((stream) => {
            setScreen(stream)

            broadcastNewTracks(stream, 'video', false)

            stream.getVideoTracks()[0].addEventListener('ended', () => {
                stopScreenSharing()
            })
        }).catch((error) => {
            console.log('shareScreen error', error)
        })
    }

    function stopScreenSharing() {
        return new Promise((res, rej) => {
            screen.getTracks().length ? screen.getTracks().forEach(track => track.stop()) : ""
            res()
        }).then(() => {
            setScreen(null)
            broadcastNewTracks(myStream, 'video')
        }).catch((error) => {
            console.log('stopShareScreen error', error)
        })
    }



    function setLocalStream(stream, mirrorMode = true) {
        const localVidElem = document.getElementById('local');

        localVidElem.srcObject = stream;
        mirrorMode ? localVidElem.classList.add('mirror-mode') : localVidElem.classList.remove('mirror-mode');
    }

    function replaceTrack(stream, recipientPeer) {
        const sender = recipientPeer.getSenders ? recipientPeer.getSenders().find(s => s.track && s.track.kind === stream.kind) : false
        sender ? sender.replaceTrack(stream) : ""
    }

    function broadcastNewTracks(stream, type, mirrorMode = true) {
        setLocalStream(stream, mirrorMode)

        const track = type === "audio" ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0]

        for (const key in peers) {
            if (peers[key]) {
                replaceTrack(track, peers[key])
            }
        }
    }

    function getAndSetUserStream() {
        getFullUserMedia()
            .then((stream) => {
                setMyStream(stream)
                setLocalStream(stream)
            })
            .catch((error) => {
                console.log('getAndSetUserStream error', error)
            })
    }

    function adjustVideoElemSize() {
        let elem = document.getElementsByClassName('card');
        let totalRemoteVideosDesktop = elem.length;
        let newWidth = totalRemoteVideosDesktop <= 2 ? '50%' : (
            totalRemoteVideosDesktop == 3 ? '33.33%' : (
                totalRemoteVideosDesktop <= 8 ? '25%' : (
                    totalRemoteVideosDesktop <= 15 ? '20%' : (
                        totalRemoteVideosDesktop <= 18 ? '16%' : (
                            totalRemoteVideosDesktop <= 23 ? '15%' : (
                                totalRemoteVideosDesktop <= 32 ? '12%' : '10%'
                            )
                        )
                    )
                )
            )
        );


        for (let i = 0; i < totalRemoteVideosDesktop; i++) {
            elem[i].style.width = newWidth;
        }
    }


    function toggleChat() {
        dispatch({ type: 'TOGGLE_CHAT' })
    }

    function toggleCam(){
        if(myStream && myStream.getVideoTracks()[0].enabled){
            myStream.getVideoTracks()[0].enabled =false
        }
        else{
            myStream.getVideoTracks()[0].enabled = true
        }

        broadcastNewTracks(myStream, "video")
    }

    function toggleMic(){
        if(myStream && myStream.getAudioTracks()[0].enabled){
            myStream.getVideoTracks()[0].enabled =false
        }
        else{
            myStream.getAudioTracks()[0].enabled = true
        }

        broadcastNewTracks(myStream, "audio")
    }

    
    function toggleScreenSharing() {
        if (screen && screen.getVideoTracks().length && screen.getVideoTracks()[0].readyState !== "ended") {
            stopScreenSharing()
        }
        else {
            startScreenSharing()
        }
    }

    return (
        <RoomContext.Provider value={
            {
                userId: state.userId,
                roomId: state.roomId,
                chatHistory: state.chatHistory,
                socket: socket,
                localVideo: localVideo,
                isChatVisible: state.chatVisible,
                login,
                logout,
                addChatMessage,
                connectSocket,
                runLocalVideo,
                toggleScreenSharing,
                toggleChat,
                toggleCam,
                toggleMic,
            }}>
            {children}
        </RoomContext.Provider>
    )
}