"use client"
import dynamic from 'next/dynamic';
import React from 'react'
import { OnProgressProps } from 'react-player/base';
const ReactPlayer = dynamic(()=> import("react-player/lazy"),{ssr:false})

interface VideoPlayerProps {
  url: string;
  onPlay?: () => void;
  onProgress?: (e:OnProgressProps) => void;
  controls?: boolean
}

const VideoPlayer = ({ url, onPlay, onProgress, controls}:VideoPlayerProps) => {
  return (
    <div className='relative aspect-video'>
      <ReactPlayer
        onPlay={onPlay}
        onProgress={onProgress}
        progressInterval={1000}
        url={url}
        width="100%"
        height="100%"
        playing={false}
        controls
      />
    </div>
  )
}

export default VideoPlayer