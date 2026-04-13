'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Video } from '@/lib/types'
import StatusBadge from './StatusBadge'

interface VideoCardProps {
  video: Video
}

export default function VideoCard({ video }: VideoCardProps) {
  const formattedDate = new Date(video.created_at).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return (
    <Link href={`/video/${video.id}`}>
      <div className="bg-sand-100 dark:bg-sand-900 rounded-lg border border-sand-300 dark:border-sand-700 overflow-hidden hover:border-sand-400 dark:hover:border-sand-600 transition-colors cursor-pointer group h-full">
        {/* Thumbnail Section */}
        <div className="relative aspect-video bg-gradient-to-br from-sand-200 to-sand-300 dark:from-sand-800 dark:to-sand-900 overflow-hidden">
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt={video.topic}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent-dark/20 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <svg
                  className="w-16 h-16 text-sand-400 dark:text-sand-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </div>
            </div>
          )}

          {/* Play Icon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg
                className="w-6 h-6 text-sand-900 dark:text-sand-50 ml-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <StatusBadge status={video.status} />
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          <h3 className="text-sand-900 dark:text-sand-50 font-semibold text-sm line-clamp-2 mb-2">
            {video.topic}
          </h3>

          <div className="flex items-center justify-between">
            <p className="text-sand-500 dark:text-sand-400 text-xs">{formattedDate}</p>
            {video.duration_sec && (
              <p className="text-sand-500 dark:text-sand-400 text-xs">
                {Math.floor(video.duration_sec / 60)}:
                {String(video.duration_sec % 60).padStart(2, '0')}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
