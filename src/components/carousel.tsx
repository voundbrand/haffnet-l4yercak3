"use client"

import React, { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CarouselProps {
  children: React.ReactNode[]
  className?: string
}

export function Carousel({ children, className = "" }: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
  })
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true)

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setPrevBtnDisabled(!emblaApi.canScrollPrev())
    setNextBtnDisabled(!emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
  }, [emblaApi, onSelect])

  return (
    <div className={`relative ${className}`}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {children.map((child, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 md:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(33.333%-16px)]">
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-background shadow-lg hover:bg-muted disabled:opacity-30"
        onClick={scrollPrev}
        disabled={prevBtnDisabled}
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-background shadow-lg hover:bg-muted disabled:opacity-30"
        onClick={scrollNext}
        disabled={nextBtnDisabled}
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  )
}
