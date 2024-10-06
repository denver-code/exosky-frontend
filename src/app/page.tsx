"use client"
import { useState } from 'react'
import { ExoplanetSelector } from './ExoplanetSelector'
import { SkyScene } from './SkyScene'


export default function ExoplanetSkyViewer() {
  const [selectedExoplanet, setSelectedExoplanet] = useState(null)

  return (
    <div className="flex h-screen">
     <div className="border-r">
        <ExoplanetSelector onSelect={setSelectedExoplanet} />
     </div>
      {selectedExoplanet && (
        <div className="flex-1">
          <SkyScene exoplanet={selectedExoplanet} />
        </div>
      )}
    </div>
  )
}