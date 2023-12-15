"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { analyzeImageIfWearRockCap } from "@/app/input/actions";
import { Button } from "@/components/ui/button";
import { useInterval } from "usehooks-ts";

const INTERVAL = 10 * 1000;

export const VideoInput = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDetectedCap, setDetectedCap] = useState<boolean>(false);
  const [isPlaying, setPlaying] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const playVideo = useCallback(async () => {
    reset();
    const { VirtualBackground } = await import("skyway-video-processors");
    const backgroundProcessor = new VirtualBackground({ image: "bg.png" });
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

  const analyze = useCallback(() => {
    const base64Image = captureImage();
    if (base64Image === undefined) {
      return;
    }
    startTransition(async () => {
      const bool = await analyzeImageIfWearRockCap(base64Image);
      setDetectedCap(bool);
    });
  }, [captureImage]);

  useInterval(
    () => {
      if (isPlaying === true && isPending === false) {
        analyze();
      }
    },
    isPlaying ? INTERVAL : null,
  );

  return (
    <div className={"relative w-screen h-screen"}>
      <div className={"absolute flex gap-4 bottom-4 right-4 z-10"}>
        <Button onClick={playVideo}>Play</Button>
        {isPlaying ? (
          <Button onClick={() => setPlaying(false)}>Stop</Button>
        ) : (
          <Button onClick={() => setPlaying(true)}>Analyze</Button>
        )}
      </div>
      <div className={"relative"}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={"w-screen h-screen object-cover object-center"}
        />
        {isDetectedCap && (
          <img
            src="/bg.png"
            alt=""
            className={
              "w-screen h-screen object-center object-cover absolute top-0 left-0"
            }
          />
        )}
      </div>
      <canvas width={512} height={512} ref={canvasRef} className={"hidden"} />
    </div>
  );
};
