"use client";

import { useCallback, useRef, useTransition } from "react";
import { analyzeImageIfWearRockCap } from "@/app/input/actions";

export const VideoInput = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isPending, startTransition] = useTransition();

  const playVideo = useCallback(async () => {
    reset();
    const { VirtualBackground } = await import("skyway-video-processors");
    const backgroundProcessor = new VirtualBackground({ image: "green.png" });
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
      videoRef.current?.play();
    };
  }, []);

  const reset = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current?.pause();
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video === null || canvas === null) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (ctx === null) {
      return;
    }

    const size = Math.min(video.videoWidth, video.videoHeight);

    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;

    const canvasSize = 512;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    ctx.drawImage(
      video,
      startX,
      startY,
      size,
      size,
      0,
      0,
      canvasSize,
      canvasSize,
    );
    return canvas.toDataURL("image/jpeg");
  }, []);

  const handleAnalyze = () => {
    const base64Image = captureImage();
    if (base64Image === undefined) {
      return;
    }
    startTransition(async () => {
      const res = await analyzeImageIfWearRockCap(base64Image);
      console.log(res);
    });
  };
  return (
    <div>
      <button onClick={playVideo}>再生</button>
      <button onClick={captureImage}>スクショ</button>
      <button onClick={handleAnalyze}>分析</button>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={"w-screen h-screen object-cover object-center"}
      />
      <canvas width={512} height={512} ref={canvasRef} />
    </div>
  );
};
