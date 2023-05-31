import { useEffect, useRef } from 'react'


export default function VideoComponent({ srcObject, ...props }) {
    const refVideo = useRef()

    useEffect(() => {
        if (!refVideo.current) return
        refVideo.current.srcObject = srcObject
    }, [srcObject])

    return <video className="remote-video" ref={refVideo} {...props} />

}