"use client"

import { useState, useEffect, useMemo } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { appConfig } from '@/config'

export function ExoplanetSelector({ onSelect }) {
  const [isLoading, setIsLoading] = useState(true)
  const [exoplanets, setExoplanets] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlanet, setSelectedPlanet] = useState(null)
  const [showSelector, setShowSelector] = useState(true)

  useEffect(() => {
    fetchExoplanets()
  }, [])

  const fetchExoplanets = async () => {
    try {
      const response = await fetch(appConfig.apiURL+'/api/exoplanets/?limit=5765')
      const data = await response.json()
      setExoplanets(data.data)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching exoplanets:', error)
      setIsLoading(false)
    }
  }

  const filteredExoplanets = useMemo(() => {
    return exoplanets.filter(exoplanet => 
      exoplanet.pl_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [exoplanets, searchQuery])

  const handleExoplanetSelect = (exoplanet) => {
    setSelectedPlanet(exoplanet)
    setShowSelector(false)
    onSelect(exoplanet)
  }

  const handleReopenSelector = () => {
    setShowSelector(true)
  }

  useEffect(() => {
    if (selectedPlanet) {
      onSelect(selectedPlanet)
    }
  }, [selectedPlanet, onSelect])

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  if (!showSelector && selectedPlanet) {
    return (
     <div></div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 bg-background z-10 p-4 shadow-md">
        <Input
          type="text"
          placeholder="Search exoplanets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full mb-4"
        />
      </div>
      <ScrollArea className="flex-grow p-4">
        <div className="grid grid-cols-1 gap-4">
          {filteredExoplanets.map((exoplanet) => (
            <Button
              key={exoplanet.pl_name}
              variant={selectedPlanet?.pl_name === exoplanet.pl_name ? "default" : "outline"}
              onClick={() => handleExoplanetSelect(exoplanet)}
              className="w-full h-20 flex items-center justify-center text-center"
            >
              {exoplanet.pl_name}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}