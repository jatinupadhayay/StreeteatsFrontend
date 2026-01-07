"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import VendorCard from "./VendorCard"

import { Clock, Flame, Loader2, MapPin, Search, Star } from "lucide-react"

type SearchScope = "nearby" | "all"

interface VendorCardData {
  id: string
  name: string
  image: string
  rating: number
  distanceKm: number | null
  cuisine: string
  speciality: string
  isOpen: boolean
  avgTime: string
  priceRange: string
}

interface DishCardData {
  id: string
  name: string
  image?: string
  price: number
  totalOrders?: number
  vendor: {
    id: string
    shopName: string
    distanceKm?: number | null
    rating?: number
  }
}

const TRENDING_RADIUS_KM = 5
const NEARBY_RADIUS_KM = 5

const formatPrice = (value: number) => `₹${value.toFixed(1)}`

const formatRating = (rating: any): number => {
  if (typeof rating === "number") {
    return Number(rating.toFixed(1))
  }

  if (rating && typeof rating.average === "number") {
    return Number(rating.average.toFixed(1))
  }

  return 4.5
}

const determinePriceRange = (menu?: any[]): string => {
  if (!Array.isArray(menu) || menu.length === 0) return "₹₹"

  const prices = menu
    .map((item) => (item && typeof item.price === "number" ? item.price : 0))
    .filter((price) => price > 0)

  if (prices.length === 0) return "₹₹"

  const average = prices.reduce((sum, value) => sum + value, 0) / prices.length

  if (average <= 150) return "₹"
  if (average <= 300) return "₹₹"
  if (average <= 500) return "₹₹₹"
  return "₹₹₹₹"
}

const formatDistanceLabel = (distanceKm?: number | null) => {
  if (distanceKm == null || Number.isNaN(distanceKm)) return null
  if (distanceKm > 100) return null // Hide if too far
  const decimals = distanceKm < 10 ? 1 : 0
  return `${distanceKm.toFixed(decimals)} km away`
}

const transformVendorFromApi = (vendor: any): VendorCardData => {
  const distanceKm = typeof vendor?.distanceKm === "number" ? vendor.distanceKm : null

  return {
    id: vendor?.id || vendor?._id || "",
    name: vendor?.shopName || vendor?.name || "Vendor",
    image: vendor?.images?.shop?.[0] || vendor?.images?.logo || "/placeholder.svg",
    rating: formatRating(vendor?.rating),
    distanceKm,
    cuisine: Array.isArray(vendor?.cuisine)
      ? vendor.cuisine.filter(Boolean).join(", ")
      : vendor?.cuisine || "Street Food",
    speciality: vendor?.shopDescription || vendor?.speciality || "Specialty Items",
    isOpen: vendor?.isActive ?? true,
    avgTime: vendor?.averagePreparationTime
      ? `${vendor.averagePreparationTime} min`
      : "15-20 min",
    priceRange: determinePriceRange(vendor?.menu),
  }
}

const transformDishFromApi = (dish: any): DishCardData => {
  const vendor = dish?.vendor || {}
  const distanceKm = typeof vendor?.distanceKm === "number" ? vendor.distanceKm : null

  return {
    id: dish?.id || dish?._id || "",
    name: dish?.name || "Dish",
    image: dish?.image || "/placeholder.svg",
    price: typeof dish?.price === "number" ? dish.price : 0,
    totalOrders: typeof dish?.totalOrders === "number" ? dish.totalOrders : undefined,
    vendor: {
      id: vendor?.id || vendor?._id || "",
      shopName: vendor?.shopName || "Vendor",
      distanceKm,
      rating: formatRating(vendor?.rating),
    },
  }
}

const transformVendors = (vendorList: any[] = []): VendorCardData[] =>
  vendorList.map(transformVendorFromApi)

export default function HomePage() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<"pending" | "granted" | "denied">("pending")
  const [locationError, setLocationError] = useState<string | null>(null)

  const [trending, setTrending] = useState<DishCardData[]>([])
  const [trendingLoading, setTrendingLoading] = useState<boolean>(true)
  const [trendingError, setTrendingError] = useState<string | null>(null)
  const [trendingFallback, setTrendingFallback] = useState<boolean>(false)

  const [nearbyVendors, setNearbyVendors] = useState<VendorCardData[]>([])
  const [allVendors, setAllVendors] = useState<VendorCardData[]>([])
  const [vendorLoading, setVendorLoading] = useState<boolean>(true)
  const [vendorError, setVendorError] = useState<string | null>(null)
  const [nearbyFallback, setNearbyFallback] = useState<boolean>(false)

  const [searchQuery, setSearchQuery] = useState<string>("")
  const [searchScope, setSearchScope] = useState<SearchScope>("nearby")
  const [searchResults, setSearchResults] = useState<{ vendors: VendorCardData[]; dishes: DishCardData[] } | null>(null)
  const [searchLoading, setSearchLoading] = useState<boolean>(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchFallback, setSearchFallback] = useState<boolean>(false)
  const [lastSearch, setLastSearch] = useState<string | null>(null)

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("denied")
      setLocationError("Location services are not supported by your browser. Showing top vendors instead.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        })
        setLocationStatus("granted")
        setLocationError(null)
      },
      (error) => {
        setLocationStatus("denied")
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location access was denied. Showing popular vendors near you instead.")
        } else {
          setLocationError("Unable to determine your location right now. Showing best available options.")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 300000,
      },
    )
  }, [])

  useEffect(() => {
    if (locationStatus === "pending") return

    let cancelled = false

    const fetchTrending = async () => {
      setTrendingLoading(true)
      setTrendingError(null)

      try {
        const params: Record<string, number> = {
          radius: TRENDING_RADIUS_KM,
          limit: 12,
        }

        if (locationStatus === "granted" && location) {
          params.lat = location.lat
          params.lng = location.lng
        }

        const response = await api.vendors.getTrendingDishes(params)

        if (cancelled) return

        setTrending((response.dishes || []).map(transformDishFromApi))
        setTrendingFallback(Boolean(response.metadata?.fallbackUsed))
      } catch (error) {
        if (cancelled) return
        console.error("Trending dishes error", error)
        setTrendingError("Unable to load trending dishes. Please try again later.")
        setTrending([])
      } finally {
        if (!cancelled) {
          setTrendingLoading(false)
        }
      }
    }

    fetchTrending()

    return () => {
      cancelled = true
    }
  }, [location, locationStatus])

  useEffect(() => {
    if (locationStatus === "pending") return

    let cancelled = false

    const fetchVendors = async () => {
      setVendorLoading(true)
      setVendorError(null)

      try {
        const nearbyParams =
          locationStatus === "granted" && location
            ? { lat: location.lat, lng: location.lng, radius: NEARBY_RADIUS_KM }
            : undefined

        const [nearbyResponse, allResponse] = await Promise.all([
          api.vendors.getAll(nearbyParams),
          api.vendors.getAll(),
        ])

        if (cancelled) return

        const nearbyList = Array.isArray(nearbyResponse?.vendors) ? nearbyResponse.vendors : []
        const allList = Array.isArray(allResponse?.vendors) ? allResponse.vendors : []

        let effectiveNearby = nearbyList
        let fallback = !nearbyParams

        if (nearbyParams && nearbyList.length === 0 && allList.length > 0) {
          fallback = true
          effectiveNearby = allList
        }

        // Sort by distance if available, otherwise by rating
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        effectiveNearby.sort((a: any, b: any) => {
          const distA = typeof a.distanceKm === 'number' ? a.distanceKm : 99999
          const distB = typeof b.distanceKm === 'number' ? b.distanceKm : 99999
          if (Math.abs(distA - distB) > 0.1) return distA - distB
          const ratingA = a.rating?.average || 0
          const ratingB = b.rating?.average || 0
          return ratingB - ratingA
        })

        setNearbyVendors(transformVendors(effectiveNearby).slice(0, 4))
        setAllVendors(transformVendors(allList).slice(0, 6))
        setNearbyFallback(fallback)
      } catch (error) {
        if (cancelled) return
        console.error("Vendor fetch error", error)
        setVendorError("Failed to load vendors. Please refresh.")
        setNearbyVendors([])
        setAllVendors([])
      } finally {
        if (!cancelled) {
          setVendorLoading(false)
        }
      }
    }

    fetchVendors()

    return () => {
      cancelled = true
    }
  }, [location, locationStatus])

  const runSearch = useCallback(
    async (queryValue: string, scopeValue: SearchScope) => {
      if (!queryValue) return

      setSearchLoading(true)
      setSearchError(null)
      setSearchFallback(false)

      try {
        const filters: Record<string, string | number> = {
          scope: scopeValue,
          radius: NEARBY_RADIUS_KM,
        }

        if (scopeValue === "nearby" && locationStatus === "granted" && location) {
          filters.lat = location.lat
          filters.lng = location.lng
        }

        const response = await api.search.global(queryValue, filters)

        const vendors = transformVendors(response.vendors || []).slice(0, 6)
        const dishes = (response.dishes || []).map(transformDishFromApi).slice(0, 8)

        setSearchResults({ vendors, dishes })
        setSearchFallback(Boolean(response.fallbackUsed))
        setLastSearch(queryValue)
      } catch (error) {
        console.error("Search error", error)
        setSearchError(error instanceof Error ? error.message : "Search failed. Please try again.")
      } finally {
        setSearchLoading(false)
      }
    },
    [location, locationStatus],
  )

  useEffect(() => {
    if (!lastSearch) return
    runSearch(lastSearch, searchScope)
  }, [lastSearch, runSearch, searchScope])

  const handleSearchSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = searchQuery.trim()

    if (!trimmed) {
      setSearchResults(null)
      setSearchError(null)
      setSearchFallback(false)
      setLastSearch(null)
      return
    }

    await runSearch(trimmed, searchScope)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults(null)
    setSearchError(null)
    setSearchFallback(false)
    setLastSearch(null)
  }

  const heroStats = useMemo(
    () => [
      { label: "Vendors", value: "500+" },
      { label: "Orders", value: "50K+" },
      { label: "Avg Pickup", value: "15 min" },
    ],
    [],
  )

  return (
    <div className="space-y-4 sm:space-y-8 p-1 sm:p-4">
      <div className="rounded-2xl sm:rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-3 sm:p-6 text-white shadow-lg">
        <h1 className="mb-2 sm:mb-4 text-xl sm:text-2xl font-bold md:text-3xl">Discover Amazing Street Food</h1>

        <form onSubmit={handleSearchSubmit} className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by dish, vendor, or location"
              className="border-0 bg-white/95 pl-10 text-gray-900 shadow"
            />
          </div>
          <Button type="submit" disabled={searchLoading} className="bg-amber-500 hover:bg-amber-600">
            {searchLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Searching…
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" /> Find Food
              </>
            )}
          </Button>
        </form>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={searchScope === "nearby" ? "secondary" : "outline"}
            onClick={() => setSearchScope("nearby")}
            size="sm"
            className={searchScope === "nearby" ? "bg-white text-orange-600" : "bg-transparent text-white"}
          >
            Nearby (≤{NEARBY_RADIUS_KM} km)
          </Button>
          <Button
            type="button"
            variant={searchScope === "all" ? "secondary" : "outline"}
            onClick={() => setSearchScope("all")}
            size="sm"
            className={searchScope === "all" ? "bg-white text-orange-600" : "bg-transparent text-white"}
          >
            All Vendors
          </Button>
          {locationStatus === "denied" && (
            <Badge variant="outline" className="border-white/50 bg-black/20 text-white">
              Location off — showing best matches
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center text-xs sm:text-sm">
          {heroStats.map((stat) => (
            <div key={stat.label}>
              <div className="text-lg sm:text-xl font-bold text-amber-200">{stat.value}</div>
              <div className="text-orange-100 text-[10px] sm:text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {locationError && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
          {locationError}
        </div>
      )}

      {searchResults && (
        <section className="space-y-4 rounded-2xl sm:border border-orange-100 sm:bg-orange-50 p-2 sm:p-4 sm:shadow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-orange-800">
                Showing results for “{lastSearch}”
              </h2>
              <p className="text-sm text-orange-700">
                {searchResults.dishes.length} dishes · {searchResults.vendors.length} vendors
              </p>
            </div>
            <div className="flex items-center gap-2">
              {searchFallback && (
                <Badge variant="outline" className="border-orange-400 bg-orange-100 text-orange-700">
                  Showing best available matches
                </Badge>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={clearSearch}>
                Clear
              </Button>
            </div>
          </div>

          {searchLoading ? (
            <div className="flex items-center gap-2 text-orange-700">
              <Loader2 className="h-4 w-4 animate-spin" /> Refreshing results…
            </div>
          ) : searchError ? (
            <p className="text-sm text-red-600">{searchError}</p>
          ) : (
            <div className="space-y-6">
              {searchResults.dishes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-orange-800 px-1">Popular dishes</h3>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {searchResults.dishes.map((dish) => {
                      const distanceLabel = formatDistanceLabel(dish.vendor.distanceKm)
                      return (
                        <Link
                          key={dish.id}
                          href={`/vendor/${dish.vendor.id}`}
                          className="group"
                        >
                          <div className="flex w-full overflow-hidden rounded-xl bg-white shadow-md transition hover:-translate-y-1 hover:shadow-lg border border-gray-100 sm:flex-col">
                            <div className="relative h-24 w-28 flex-shrink-0 overflow-hidden bg-orange-100 sm:h-36 sm:w-full">
                              <img
                                src={dish.image || "/placeholder.svg"}
                                alt={dish.name}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              />
                            </div>
                            <div className="flex flex-1 flex-col gap-2 p-4">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-semibold text-gray-900">{dish.name}</h4>
                                <span className="text-sm font-bold text-orange-600">{formatPrice(dish.price)}</span>
                              </div>
                              <p className="text-xs text-gray-600">
                                from <span className="font-medium text-gray-800">{dish.vendor.shopName}</span>
                              </p>
                              <div className="mt-auto flex items-center justify-between text-[11px] text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-400" />
                                  {dish.vendor.rating?.toFixed(1) ?? "4.5"}
                                </span>
                                {dish.totalOrders ? (
                                  <span>{dish.totalOrders} orders</span>
                                ) : (
                                  <span>Popular pick</span>
                                )}
                                {distanceLabel && <span>{distanceLabel}</span>}
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {searchResults.vendors.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-orange-800 px-1">Matching vendors</h3>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {searchResults.vendors.map((vendor) => (
                      <VendorCard
                        key={`${vendor.id}-search`}
                        vendor={vendor}
                      />
                    ))}
                  </div>
                </div>
              )}

              {searchResults.dishes.length === 0 && searchResults.vendors.length === 0 && (
                <p className="text-sm text-orange-700">No exact matches found. Try a different keyword.</p>
              )}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-100 pb-2">
          <h2 className="flex items-center text-lg sm:text-xl font-bold text-gray-900">
            <Flame className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-orange-500" /> Trending items
          </h2>
          {trendingFallback && (
            <Badge variant="outline" className="border-orange-400 bg-orange-50 text-orange-700">
              Showing curated picks
            </Badge>
          )}
        </div>

        {trendingLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading trending dishes…
          </div>
        ) : trendingError ? (
          <p className="text-sm text-red-600">{trendingError}</p>
        ) : trending.length === 0 ? (
          <p className="text-sm text-gray-600">No trending dishes yet — check back soon!</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-3 px-3">
            {trending.map((dish) => {
              const distanceLabel = formatDistanceLabel(dish.vendor.distanceKm)
              return (
                <Link
                  key={dish.id}
                  href={`/vendor/${dish.vendor.id}`}
                  className="group"
                >
                  <div className="flex w-44 sm:w-64 flex-shrink-0 flex-col overflow-hidden rounded-xl bg-white shadow-md transition hover:-translate-y-1 hover:shadow-lg border border-gray-100">
                    <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-gray-100">
                      <img
                        src={dish.image || "/placeholder.svg"}
                        alt={dish.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-1">{dish.name}</h3>
                        <span className="text-xs sm:text-sm font-bold text-orange-600">{formatPrice(dish.price)}</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {dish.vendor.shopName}
                      </p>
                      <div className="mt-auto flex items-center justify-between text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400" />
                          {dish.vendor.rating?.toFixed(1) ?? "4.5"}
                        </span>
                        {dish.totalOrders ? <span>{dish.totalOrders} orders</span> : <span>Popular pick</span>}
                        {distanceLabel && <span>{distanceLabel}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-100 pb-2">
          <h2 className="flex items-center text-lg sm:text-xl font-bold text-gray-900">
            <MapPin className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-green-500" /> Nearby vendors
          </h2>
          <div className="flex items-center gap-2">
            {nearbyFallback && (
              <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
                Showing top vendors for you
              </Badge>
            )}
            <Link href="/customer/vendors">
              <Button variant="outline" size="sm">
                View all
              </Button>
            </Link>
          </div>
        </div>

        {vendorLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading vendors…
          </div>
        ) : vendorError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {vendorError}
          </div>
        ) : nearbyVendors.length === 0 ? (
          <p className="text-sm text-gray-600">No vendors available right now.</p>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Explore all</h2>
          <Link href="/customer/vendors">
            <Button variant="ghost" size="sm">
              Browse marketplace
            </Button>
          </Link>
        </div>

        {vendorLoading && allVendors.length === 0 ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading vendors…
          </div>
        ) : allVendors.length === 0 ? (
          <p className="text-sm text-gray-600">We are onboarding vendors in your area. Check back soon!</p>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {allVendors.map((vendor) => (
              <VendorCard
                key={`${vendor.id}-all`}
                vendor={vendor}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3 grid-cols-2 sm:grid-cols-2">
        <Link href="/group-order">
          <Button className="h-16 sm:h-24 w-full rounded-xl bg-green-500 text-sm sm:text-lg font-semibold text-white shadow-md transition hover:-translate-y-1 hover:bg-green-600">
            <Clock className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Group order
          </Button>
        </Link>
        <Link href="/customer/orders">
          <Button className="h-16 sm:h-24 w-full rounded-xl bg-purple-500 text-sm sm:text-lg font-semibold text-white shadow-md transition hover:-translate-y-1 hover:bg-purple-600">
            <Star className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> My orders
          </Button>
        </Link>
      </section>
    </div>
  )
}
