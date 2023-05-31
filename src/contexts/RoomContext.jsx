import { createContext, useReducer, useState, createRef } from "react";
import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

const peers = {}

export const RoomContext = createContext()

export default function RoomContextProvider({ children }) {

    const iceServers = {
        iceServers: [
            {
                // credential: 'key2',
                // username: 'username2',
                url: 'stun:stun.terapialo.com:5349',
            }
        ]
    }
    let socketTemp = null
    const [socket, setSocket] = useState(null)


    const INITIALSTATE = {
        userId: null,
        roomId: null,
        chatHistory: [],
        peerStreams: [],
        myStream: null,
        myScreen: null,
        isCamActive: true,
        isMicActive: true,
        isChatVisible: true,
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
                try{
                    if(statecopy.myStream){
                        if( statecopy.myStream.getVideoTracks().length){
                            statecopy.myStream.getVideoTracks().forEach(vt=>{
                                vt.stop()
                                vt.enabled = false
                                vt = null
                            })
                        }
                        if(statecopy.myStream.getAudioTracks().length){
                            statecopy.myStream.getAudioTracks().forEach(at=>{
                                at.stop()
                                at.enabled = false
                                at = null
                            })
                        }
                    }

                    if(socket){
                        socket.close()
                    }

                    statecopy.peerStreams = []
                    statecopy.myStream = null
                    statecopy.myScreen = null
                    Object.keys(peers).forEach(key=>{
                        delete peers[key]
                    })
                }catch(error){
                    console.log(error)
                }    
                break

            case 'ADD_CHAT_MESSAGE':
                statecopy.chatHistory = [...state.chatHistory, action.payload]
                break

            case 'TOGGLE_CHAT':
                statecopy.chatVisible = !statecopy.chatVisible
                break

            case 'UPSERT_PEER_STREAM':
                if (statecopy.peerStreams.find(x => x.partnerName === action.payload.partnerName)) {
                    statecopy.peerStreams = (statecopy.peerStreams.map(x => {
                        if (x.partnerName === action.payload.partnerName) {
                            return action.payload
                        }
                        else {
                            return x
                        }
                    }))
                }
                else {
                    statecopy.peerStreams.push(action.payload)
                }
                break

            case 'REMOVE_PEER_STREAM':
                statecopy.peerStreams = statecopy.peerStreams.filter(x => x.partnerName !== action.payload)
                break

            case 'SET_MY_STREAM':
                statecopy.myStream = action.payload
            break

            case 'SET_MY_SCREEN':
                statecopy.myScreen = action.payload
            break

            case 'TOGGLE_CAM':
                if (statecopy.myStream) {
                    if (statecopy.myStream.getVideoTracks()[0].enabled) {
                        statecopy.myStream.getVideoTracks()[0].enabled = false
                        statecopy.isCamActive = false
        
                    } else {
                        statecopy.myStream.getVideoTracks()[0].enabled = true
                        statecopy.isCamActive = true

                    }
                }
            break

            case 'TOGGLE_MIC':
                if(statecopy.myStream){
                    if (statecopy.myStream.getAudioTracks()[0].enabled) {
                        statecopy.myStream.getAudioTracks()[0].enabled = false
                        statecopy.isMicActive = false
                    }
                    else {
                        statecopy.myStream.getAudioTracks()[0].enabled = true
                        statecopy.isMicActive = true
                    }
                }
                
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
    2. servidor propaga a la sala $new-user con (socketId)
    3. cliente escucha $new-user con (socketId)
    4. cliente envia $introduce-myself con (to: socketId, sender: state.userId)
    5. servidor propaga a data.to $introduce-myself con (sender: data.sender)
    6. cliente escucha $introduce-myself
    **/

    function connectSocket() {
        socketTemp = io("https://socket-back.azurewebsites.net")
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
                            dispatch({type:"SET_MY_STREAM",payload: stream})

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


    function addPeer(createOffer, partnerName) {
        console.log(partnerName, ' conectado')
        // i add to the peers object a new key of partner name and create a new rtcpeerconnection as value
        peers[partnerName] = new RTCPeerConnection(iceServers)

        if (state.myScreen && state.myScreen.getTracks().length) {
            state.myScreen.getTracks().forEach((track) => {
                peers[partnerName].addTrack(track, screen)
            })
        }
        else if (state.myStream) {
            state.myStream.getTracks().forEach((track) => {
                peers[partnerName].addTrack(track, state.myStream)
            })
        }
        else {
            getFullUserMedia()
                .then((stream) => {
                    dispatch({type: "SET_MY_STREAM", payload: stream})
                    stream.getTracks().forEach((track) => {
                        peers[partnerName].addTrack(track, stream)
                    })
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
            dispatch({
                type: "UPSERT_PEER_STREAM", payload: {
                    partnerName: partnerName,
                    stream: str,
                }
            })

        }

        peers[partnerName].onconnectionstatechange = (d) => {
            switch (peers[partnerName].iceConnectionState) {
                case 'disconnected':
                case 'failed':
                    console.log(peers[partnerName])
                    console.log('peer connection failed: ', partnerName, d)
                    closeVideo(partnerName);
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
        dispatch({type: "REMOVE_PEER_STREAM", payload: partnerName})
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
            dispatch({type: "SET_MY_SCREEN", payload: stream})
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
            if(state.myScreen){
                state.myScreen.getTracks().length ? state.myScreen.getTracks().forEach(track => track.stop()) : ""
            }
            res()
        }).then(() => {
            dispatch({type: "SET_MY_SCREEN", payload: null})
            broadcastNewTracks(state.myStream, 'video')
        }).catch((error) => {
            console.log('stopShareScreen error', error)
        })
    }


    function replaceTrack(stream, recipientPeer) {
        const sender = recipientPeer.getSenders ? recipientPeer.getSenders().find(s => s.track && s.track.kind === stream.kind) : false
        sender ? sender.replaceTrack(stream) : ""
    }

    function broadcastNewTracks(stream, type) {
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
                dispatch({type: "SET_MY_STREAM", payload: stream})
            })
            .catch((error) => {
                console.log('getAndSetUserStream error', error)
            })
    }

    function toggleChat() {
        dispatch({ type: 'TOGGLE_CHAT' })
    }

    function toggleCam() {
        dispatch({type: 'TOGGLE_CAM'})
        broadcastNewTracks(state.myStream, "video")
    }

    function toggleMic() {
        dispatch({type: "TOGGLE_MIC"})
        broadcastNewTracks(state.myStream, "audio")
    }


    function toggleScreenSharing() {
        if (state.myScreen && state.myScreen.getVideoTracks().length && state.myScreen.getVideoTracks()[0].readyState !== "ended") {
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
                isChatVisible: state.chatVisible,
                peerStreams: state.peerStreams,
                myStream: state.myStream,
                myScreen: state.myScreen,
                isCamActive: state.isCamActive,
                isMicActive: state.isMicActive,

                login,
                logout,
                addChatMessage,
                connectSocket,
                toggleScreenSharing,
                toggleChat,
                toggleCam,
                toggleMic,

            }}>
            {children}
        </RoomContext.Provider>
    )
}