'use client'
import {useCallback, useRef} from "react";

export const VideoInput = () => {

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const playVideo = useCallback(async () => {
        reset()
        const { VirtualBackground } = await import('skyway-video-processors');
        const backgroundProcessor = new VirtualBackground({ image: 'green.png' });
        await backgroundProcessor.initialize();
        const result = await backgroundProcessor.createProcessedStream();
        if (result === null || result.track === null) {
            return;
        }
        const mediaStream = new MediaStream([result.track]);
        streamRef.current = mediaStream;
        if (!videoRef.current) {
            return;
        }
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
        }
    }, [])

    const reset = () => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        if (videoRef.current) {
            videoRef.current?.pause()
            videoRef.current.srcObject = null;
        }
    }

    return (
        <div>
            <button onClick={playVideo}>再生</button>
            <video ref={videoRef} autoPlay playsInline/>
        </div>
    )
}