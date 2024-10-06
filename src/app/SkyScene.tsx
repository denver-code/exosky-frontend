'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Line } from '@react-three/drei'
import * as THREE from 'three'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { appConfig } from '@/config'

const StarField = ({ stars, onStarClick, selectedStars }) => {
  const [colorAttribute, setColorAttribute] = useState(null)

  const starTexture = useMemo(() => {
    return new THREE.TextureLoader().load('/star.png')
  }, [])

  const points = useMemo(() => {
    const positions = new Float32Array(stars.length * 3)
    const colors = new Float32Array(stars.length * 3)

    stars.forEach((star, index) => {
      const i3 = index * 3
      positions[i3] = star.x * 12000
      positions[i3 + 1] = star.y * 12000
      positions[i3 + 2] = star.z * 12000

      const isSelected = selectedStars.includes(star.id)
      colors[i3] = isSelected ? 0 : 1
      colors[i3 + 1] = isSelected ? 0 : 1
      colors[i3 + 2] = 1
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const colorAttr = new THREE.BufferAttribute(colors, 3)
    geometry.setAttribute('color', colorAttr)
    setColorAttribute(colorAttr)

    return geometry
  }, [stars, selectedStars])

  const { raycaster, mouse } = useThree()

  const handleClick = useCallback(
    (event) => {
      const intersections = raycaster.intersectObject(event.object)
      if (intersections.length > 0) {
        const intersectedStar = intersections[0].index
        onStarClick(stars[intersectedStar])
      }
    },
    [raycaster, stars, onStarClick]
  )

  return (
    <points geometry={points} onClick={handleClick}>
      <pointsMaterial 
        size={2.5} 
        sizeAttenuation={true}
        map={starTexture}
        alphaTest={0.01}
        transparent={true}
        vertexColors={true}
      />
    </points>
  )
}

const ConstellationLines = ({ constellations, starMap, activeConstellation, onConstellationHover }) => {
  return (
    <>
      {constellations.map((constellation, index) => {
        const positions = constellation.stars.map(starId => {
          const starPosition = starMap[starId]
          return starPosition ? new THREE.Vector3(starPosition.x, starPosition.y, starPosition.z) : null
        }).filter(Boolean)

        if (positions.length < 2) return null

        const geometry = new THREE.BufferGeometry().setFromPoints(positions)
        const color = constellation === activeConstellation ? 'yellow' : 'white'
        const opacity = constellation === activeConstellation ? 1 : 0.3

        return (
          <line key={index} onPointerOver={() => onConstellationHover(constellation)}>
            <bufferGeometry attach="geometry" {...geometry} />
            <lineBasicMaterial attach="material" color={color} transparent opacity={opacity} />
          </line>
        )
      })}
    </>
  )
}

const CoordinateGrids = ({ visible }) => {
  const equatorialGrid = useMemo(() => {
    const points = []
    for (let i = 0; i <= 360; i += 15) {
      const rad = (i * Math.PI) / 180
      points.push(new THREE.Vector3(Math.cos(rad) * 12000, 0, Math.sin(rad) * 12000))
    }
    for (let i = -75; i <= 75; i += 15) {
      const rad = (i * Math.PI) / 180
      const y = Math.sin(rad) * 12000
      const r = Math.cos(rad) * 12000
      for (let j = 0; j <= 360; j += 5) {
        const radJ = (j * Math.PI) / 180
        points.push(new THREE.Vector3(Math.cos(radJ) * r, y, Math.sin(radJ) * r))
      }
    }
    return points
  }, [])

  const galacticGrid = useMemo(() => {
    const points = []
    for (let i = 0; i <= 360; i += 15) {
      const rad = (i * Math.PI) / 180
      points.push(new THREE.Vector3(Math.cos(rad) * 12000, Math.sin(rad) * 12000, 0))
    }
    for (let i = -75; i <= 75; i += 15) {
      const rad = (i * Math.PI) / 180
      const z = Math.sin(rad) * 12000
      const r = Math.cos(rad) * 12000
      for (let j = 0; j <= 360; j += 5) {
        const radJ = (j * Math.PI) / 180
        points.push(new THREE.Vector3(Math.cos(radJ) * r, Math.sin(radJ) * r, z))
      }
    }
    return points
  }, [])

  if (!visible) return null

  return (
    <>
      <Line points={equatorialGrid} color="blue" lineWidth={1} transparent opacity={0.2} />
      <Line points={galacticGrid} color="red" lineWidth={1} transparent opacity={0.2} />
    </>
  )
}

export function SkyScene({ exoplanet }) {
  const [stars, setStars] = useState([])
  const [selectedStars, setSelectedStars] = useState([])
  const [constellations, setConstellations] = useState([])
  const [author, setAuthor] = useState('')
  const [constellationName, setConstellationName] = useState('')
  const [clickedStar, setClickedStar] = useState(null)
  const [showCoordinateGrids, setShowCoordinateGrids] = useState(false)
  const [activeConstellation, setActiveConstellation] = useState(null)

  useEffect(() => {
    const fetchStars = async () => {
      try {
        const response = await fetch(appConfig.apiURL+'/api/stars/?limiting_magnitude=7', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ra: exoplanet.ra, dec: exoplanet.dec }),
        })
        const data = await response.json()
        const starsWithIds = data.data.map((star, index) => ({
          ...star,
          id: star.id || `star-${index}`
        }))
        setStars(starsWithIds)
      } catch (error) {
        console.error('Error fetching stars:', error)
      }
    }

    fetchStars()
  }, [exoplanet])

  useEffect(() => {
    const fetchConstellations = async () => {
      try {
        const response = await fetch(appConfig.apiURL+'/api/constellations/?planet=' + exoplanet.pl_name)
        const data = await response.json()
        if (data.length === 0) {
          return
        }
        setConstellations(data)
      } catch (error) {
        console.error('Error fetching constellations:', error)
      }
    }

    fetchConstellations()
  }, [exoplanet.pl_name])

  const starMap = useMemo(() => {
    const map = {}
    stars.forEach(star => {
      map[star.id] = { x: star.x * 12000, y: star.y * 12000, z: star.z * 12000 }
    })
    return map
  }, [stars])

  const handleStarClick = (star) => {
    setClickedStar(star)
    setSelectedStars((prevSelectedStars) => {
      if (prevSelectedStars.includes(star.id)) {
        return prevSelectedStars.filter((id) => id !== star.id)
      } else {
        return [...prevSelectedStars, star.id]
      }
    })
  }

  const handleSaveConstellation = async () => {
    if (!author || !constellationName || selectedStars.length === 0) {
      alert('Please provide a name, author, and select at least one star.')
      return
    }

    const newConstellation = {
      name: constellationName,
      author,
      stars: selectedStars,
      planet: exoplanet.pl_name,
    }

    try {
      const response = await fetch(appConfig.apiURL+'/api/constellations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConstellation),
      })

      if (response.ok) {
        const savedConstellation = await response.json()
        setConstellations((prevConstellations) => {
          if (Array.isArray(prevConstellations)) {
            return [...prevConstellations, savedConstellation];
          } else {
            return [savedConstellation];
          }
        });
        setSelectedStars([])
        setAuthor('')
        setConstellationName('')
      } else {
        alert('Error saving constellation')
      }
    } catch (error) {
      console.error('Error saving constellation:', error)
      alert('Error saving constellation')
    }
  }

  const handleConstellationHover = (constellation) => {
    setActiveConstellation(constellation)
  }

  if (stars.length === 0) {
    return <div className="p-4">Loading stars...<br/>Please be patient, it might take some time to load stars.</div>
  }


  return (
    <div className="w-full h-screen flex">
      <div className="flex-grow">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 0]} near={0.1} far={100000000} />
          <OrbitControls maxDistance={100000000} minDistance={1} />
          
          {/* <StarField stars={stars} onStarClick={handleStarClick} selectedStars={selectedStars} /> */}
          {/* Display loading when no stars found */}
          {stars.length > 0 && (
            <StarField stars={stars} onStarClick={handleStarClick} selectedStars={selectedStars} />
          )}

          {constellations.length > 0 && (
            <ConstellationLines 
              constellations={constellations} 
              starMap={starMap} 
              activeConstellation={activeConstellation}
              onConstellationHover={handleConstellationHover}
            />
          )}

          <CoordinateGrids visible={showCoordinateGrids} />
        </Canvas>
      </div>

      <div className="w-1/4 p-4 overflow-y-auto border-l">
      {/* controls help */}
      <Card className="mb-4">
          <CardHeader>
            <CardTitle>Controls Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              LMB - View around <br/>
              RMB - Move around <br/>
              MMB + Scroll - Zoom in/out<br/>
              MMB + Move - Fast zoom in/out<br/>
            </p>
          </CardContent>
        </Card>
          
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Create Constellation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Enter author name"
                />
              </div>
              <div>
                <Label htmlFor="constellation">Constellation Name</Label>
                <Input
                  id="constellation"
                  value={constellationName}
                  onChange={(e) => setConstellationName(e.target.value)}
                  placeholder="Enter constellation name"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Button onClick={handleSaveConstellation} disabled={selectedStars.length < 2 || !author || !constellationName}>
                  Save Constellation
                </Button>
                <Button onClick={() => setSelectedStars([])}>Clear Selections</Button>
              </div>
              <p>Selected stars: {selectedStars.length}</p>
              <div className="flex items-center space-x-2">
                <Switch
                  id="coordinate-grids"
                  checked={showCoordinateGrids}
                  onCheckedChange={setShowCoordinateGrids}
                />
                <Label htmlFor="coordinate-grids">Show Coordinate Grids</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {clickedStar && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Star Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p>ID: {clickedStar.id}</p>
              <p>RA: {clickedStar.ra?.toFixed(2) ?? 'N/A'}°</p>
              <p>Dec: {clickedStar.dec?.toFixed(2) ?? 'N/A'}°</p>
              <p>Photo G Mean Magnitude: {clickedStar.phot_g_mean_mag?.toFixed(2) ?? 'N/A'}</p>
              <p>intensity: {clickedStar.intensity?.toFixed(2) ?? 'N/A'}</p>
              <p>parallax: {clickedStar.parallax?.toFixed(2) ?? 'N/A'}</p>
            </CardContent>
          </Card>
        )}

        {activeConstellation && (
          <Card>
            <CardHeader>
              <CardTitle>Active Constellation</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Name:</strong> {activeConstellation.name}</p>
              <p><strong>Author:</strong> {activeConstellation.author}</p>
              <p><strong>Stars:</strong> {activeConstellation.stars.length}</p>
            </CardContent>
          </Card>
        )}

        {/*Make request to /api/generate_star_map?planet= and download image*/}
        <Button  className="mt-4" onClick={
          () => {
            fetch(appConfig.apiURL+'/api/generate_star_map?planet=' + exoplanet.pl_name)
            .then(response => response.blob())
            .then(blob => {
              const url = window.URL.createObjectURL(new Blob([blob]))
              const link = document.createElement('a')
              link.href = url
              link.setAttribute('download', `star_map-${exoplanet.pl_name}.png`)
              document.body.appendChild(link)
              link.click()
              link.parentNode.removeChild(link)
            })
          }
        }>Download Star Map</Button>

      </div>
    </div>
  )
}