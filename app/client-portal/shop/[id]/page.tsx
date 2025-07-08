"use client"

import { useState, useEffect, use, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ClientPortalLayout } from "@/components/client-portal/client-portal-layout"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import {
  ShoppingBag,
  Heart,
  Star,
  ChevronRight,
  Truck,
  RotateCcw,
  Shield,
  Minus,
  Plus,
  ThumbsUp,
  Share2,
  Loader2
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Product, ProductReview } from "@/lib/products-data"

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)

  // Unwrap params using React.use() during render
  const unwrappedParams = use(params)
  const productId = unwrappedParams.id

  // Helper function to convert enum types to readable names
  const formatProductType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'DAILY_CLEANSER': 'Daily Cleanser',
      'TREATMENT_SERUM': 'Treatment Serum',
      'HYDRATING_CREAM': 'Hydrating Cream',
      'ANTI_AGING_TREATMENT': 'Anti-Aging Treatment',
      'WEEKLY_MASK': 'Weekly Mask',
      'LIQUID_FOUNDATION': 'Liquid Foundation',
      'EYE_ENHANCER': 'Eye Enhancer',
      'LIP_COLOR': 'Lip Color',
      'DAILY_SHAMPOO': 'Daily Shampoo',
      'INTENSIVE_TREATMENT': 'Intensive Treatment',
      'TEMPORARY_EXTENSIONS': 'Temporary Extensions',
      'SEMI_PERMANENT_EXTENSIONS': 'Semi-Permanent Extensions',
      'COLOR_POLISH': 'Color Polish',
      'NAIL_TREATMENT': 'Nail Treatment',
      'LUXURY_FRAGRANCE': 'Luxury Fragrance',
      'BODY_MOISTURIZER': 'Body Moisturizer',
      'TARGETED_TREATMENT': 'Targeted Treatment',
      'APPLICATION_TOOLS': 'Application Tools',
      'STYLING_EQUIPMENT': 'Styling Equipment',
      // Legacy types
      'SKINCARE': 'Skincare',
      'MAKEUP': 'Makeup',
      'HAIR_CARE': 'Hair Care',
      'HAIR_EXTENSIONS': 'Hair Extensions',
      'NAIL_CARE': 'Nail Care',
      'FRAGRANCE': 'Fragrance',
      'PERSONAL_CARE': 'Personal Care',
      'SPECIALTY': 'Specialty',
      'TOOLS': 'Tools',
      'ACCESSORIES': 'Accessories',
      'OTHER': 'Other'
    }
    return typeMap[type] || type
  }

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch the product by ID from the API
        const response = await fetch(`/api/products/${productId}`)

        if (!response.ok) {
          if (response.status === 404) {
            setError("Product not found")
          } else {
            throw new Error(`Failed to fetch product: ${response.statusText}`)
          }
          return
        }

        const data = await response.json()
        const foundProduct = data.product

        if (foundProduct && foundProduct.isRetail && foundProduct.isActive) {
          // Parse JSON string fields back to arrays with error handling
          const productWithParsedFields = {
            ...foundProduct,
            features: (() => {
              try {
                return foundProduct.features ? JSON.parse(foundProduct.features) : []
              } catch (e) {
                console.warn('Failed to parse features for product', foundProduct.id, e)
                return []
              }
            })(),
            ingredients: (() => {
              try {
                return foundProduct.ingredients ? JSON.parse(foundProduct.ingredients) : []
              } catch (e) {
                console.warn('Failed to parse ingredients for product', foundProduct.id, e)
                return []
              }
            })(),
            howToUse: (() => {
              try {
                return foundProduct.howToUse ? JSON.parse(foundProduct.howToUse) : []
              } catch (e) {
                console.warn('Failed to parse howToUse for product', foundProduct.id, e)
                return []
              }
            })(),
            images: foundProduct.image ? [foundProduct.image] : []
          }

          setProduct(productWithParsedFields)

          // Set document title for SEO
          document.title = `${foundProduct.name} - Vanity Hub | Professional Beauty Products`

          // Fetch related products from the same category
          try {
            const relatedResponse = await fetch(`/api/client-portal/products?category=${foundProduct.category}`)
            if (relatedResponse.ok) {
              const relatedData = await relatedResponse.json()
              const related = relatedData.products
                .filter((p: Product) => p.id !== productId)
                .slice(0, 4) // Limit to 4 related products
              setRelatedProducts(related)
            }
          } catch (relatedErr) {
            console.error("Error loading related products:", relatedErr)
          }
        } else {
          setError("Product not found")
        }
      } catch (err) {
        console.error("Error loading product:", err)
        setError("Failed to load product details")
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [productId])

  const decreaseQuantity = useCallback(() => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }, [quantity])

  const increaseQuantity = useCallback(() => {
    setQuantity(quantity + 1)
  }, [])

  const handleAddToCart = useCallback(() => {
    if (!product) return

    // Check if we have enough stock
    if (product.stock < quantity) {
      toast({
        title: "Insufficient stock",
        description: `Sorry, only ${product.stock} units available.`,
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Added to cart",
      description: `${quantity} × ${product.name} has been added to your cart.`,
    })
  }, [product, quantity, toast])

  const handleAddToWishlist = useCallback(() => {
    if (!product) return

    toast({
      title: "Added to wishlist",
      description: `${product.name} has been added to your wishlist.`,
    })
  }, [product, toast])

  if (isLoading) {
    return (
        <div className="container mx-auto px-4 py-16 flex justify-center items-center">
          <Loader2 className="h-8 w-8 text-pink-600 animate-spin mr-2" />
          <span>Loading product details...</span>
        </div>
    )
  }

  if (error || (!isLoading && !product)) {
    return (
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">
            {error === "Product not found" ? "Product Not Found" : "Error Loading Product"}
          </h1>
          <p className="text-gray-600 mb-8">
            {error === "Product not found"
              ? "The product you're looking for doesn't exist or has been removed."
              : error || "There was an issue loading the product details."
            }
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/client-portal/shop">
                Return to Shop
              </Link>
            </Button>
            {error && error !== "Product not found" && (
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            )}
          </div>
        </div>
    )
  }

  return (
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-gray-500 mb-8">
          <Link href="/client-portal/shop" className="hover:text-pink-600 transition-colors">
            Shop
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link href={`/client-portal/shop?category=${product.category}`} className="hover:text-pink-600 transition-colors capitalize">
            {product.category}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link href={`/client-portal/shop?type=${product.type}`} className="hover:text-pink-600 transition-colors">
            {formatProductType(product.type)}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900 font-medium truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Product Images */}
          <div>
            <div className="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden mb-4">
              <Image
                src={imageError ? "/placeholder.jpg" : (
                  (product.images?.[selectedImage] && product.images[selectedImage].trim() !== '')
                    ? product.images[selectedImage]
                    : (product.image && product.image.trim() !== '')
                      ? product.image
                      : "/placeholder.jpg"
                )}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={true}
                onError={() => setImageError(true)}
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <Badge className="bg-pink-600">New</Badge>
                )}
                {product.isBestSeller && (
                  <Badge className="bg-amber-500">Best Seller</Badge>
                )}
                {product.isSale && (
                  <Badge className="bg-red-500">Sale</Badge>
                )}
              </div>
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex gap-4">
                {product.images
                  .filter(image => image && image.trim() !== '') // Filter out empty images
                  .map((image, index) => (
                  <button
                    key={index}
                    className={`relative w-20 h-20 rounded-md overflow-hidden ${
                      selectedImage === index ? "ring-2 ring-pink-600" : "opacity-70"
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(product.rating || 0) ? "fill-amber-400" : "fill-gray-200"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">{product.rating} ({product.reviewCount || 0} reviews)</span>
              </div>

              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

              <div className="mb-4">
                {product.isSale && product.salePrice ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold"><CurrencyDisplay amount={product.salePrice || 0} /></span>
                    <span className="text-lg text-gray-500 line-through"><CurrencyDisplay amount={product.price} /></span>
                    <Badge className="bg-red-500 ml-2">
                      Save <CurrencyDisplay amount={product.price - (product.salePrice || 0)} />
                    </Badge>
                  </div>
                ) : (
                  <span className="text-2xl font-bold"><CurrencyDisplay amount={product.price} /></span>
                )}
              </div>

              <p className="text-gray-600 mb-6">
                {product.description}
              </p>

              <div className="space-y-6">
                {product.features && product.features.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Key Features</h3>
                    <ul className="space-y-1">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2 flex-shrink-0 mt-0.5">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex border rounded-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-none border-r"
                      onClick={decreaseQuantity}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center justify-center w-12 text-center">
                      {quantity}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-none border-l"
                      onClick={increaseQuantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    className="flex-1 bg-pink-600 hover:bg-pink-700"
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={handleAddToWishlist}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-gray-500" />
                    <span className="text-sm">Free shipping over <CurrencyDisplay amount={50} /></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5 text-gray-500" />
                    <span className="text-sm">30-day returns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-gray-500" />
                    <span className="text-sm">Secure checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mb-16">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
              <TabsTrigger value="how-to-use">How to Use</TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews ({product.reviewCount || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="p-6 bg-white rounded-lg border">
              <h3 className="text-lg font-medium mb-4">Product Details</h3>
              <p className="text-gray-600 mb-4">
                {product.description}
              </p>

              {product.features && product.features.length > 0 && (
                <>
                  <h4 className="font-medium mb-2">Features</h4>
                  <ul className="space-y-1 mb-4">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2 flex-shrink-0 mt-0.5">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </TabsContent>

            <TabsContent value="ingredients" className="p-6 bg-white rounded-lg border">
              <h3 className="text-lg font-medium mb-4">Ingredients</h3>
              {product.ingredients && Array.isArray(product.ingredients) ? (
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  {product.ingredients.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 mb-4">
                  {product.ingredients || "Ingredients information not available for this product."}
                </p>
              )}
            </TabsContent>

            <TabsContent value="how-to-use" className="p-6 bg-white rounded-lg border">
              <h3 className="text-lg font-medium mb-4">How to Use</h3>
              {product.howToUse && Array.isArray(product.howToUse) ? (
                <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                  {product.howToUse.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-gray-600 mb-4">
                  {product.howToUse || "Usage information not available for this product."}
                </p>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="p-6 bg-white rounded-lg border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Customer Reviews</h3>
                <Button className="bg-pink-600 hover:bg-pink-700">Write a Review</Button>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{product.rating || 0}</div>
                  <div className="flex text-amber-400 justify-center mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(product.rating || 0) ? "fill-amber-400" : "fill-gray-200"}`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">{product.reviewCount || 0} reviews</div>
                </div>

                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    // Since we don't have detailed review data in our model, we'll simulate it
                    const count = star === 5 ? Math.floor((product.reviewCount || 0) * 0.7) :
                                 star === 4 ? Math.floor((product.reviewCount || 0) * 0.2) :
                                 Math.floor((product.reviewCount || 0) * 0.1 / 3)
                    const percentage = product.reviewCount ? (count / product.reviewCount) * 100 : 0

                    return (
                      <div key={star} className="flex items-center gap-2">
                        <div className="text-sm text-gray-500 w-8">{star} star</div>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-gray-500 w-8">{count}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {product.reviews && product.reviews.length > 0 ? (
                <div className="space-y-6">
                  {product.reviews.map((review) => (
                    <div key={review.id} className="border-b pb-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{review.clientName}</h4>
                          <div className="flex items-center gap-2">
                            <div className="flex text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3.5 w-3.5 ${i < Math.floor(review.rating) ? "fill-amber-400" : "fill-gray-200"}`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              on {new Date(review.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                            Helpful
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Share2 className="h-3.5 w-3.5 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">Reviews are coming soon! Be the first to review this product.</p>
                  <Button className="bg-pink-600 hover:bg-pink-700">Write a Review</Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">You May Also Like</h2>
              <Button variant="outline" asChild>
                <Link href="/client-portal/shop">
                  View All
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Card key={relatedProduct.id} className="overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={relatedProduct.image && relatedProduct.image.trim() !== '' ? relatedProduct.image : "/placeholder.jpg"}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {relatedProduct.isNew && (
                          <Badge className="bg-pink-600">New</Badge>
                        )}
                        {relatedProduct.isBestSeller && (
                          <Badge className="bg-amber-500">Best Seller</Badge>
                        )}
                        {relatedProduct.isSale && (
                          <Badge className="bg-red-500">Sale</Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      <Link href={`/client-portal/shop/${relatedProduct.id}`} className="block">
                        <h3 className="font-medium mb-1 group-hover:text-pink-600 transition-colors">
                          {relatedProduct.name}
                        </h3>
                      </Link>

                      <div className="flex justify-between items-center">
                        <div>
                          {relatedProduct.isSale && relatedProduct.salePrice ? (
                            <div className="flex items-center gap-2">
                              <span className="font-bold">${relatedProduct.salePrice.toFixed(2)}</span>
                              <span className="text-sm text-gray-500 line-through">${relatedProduct.price.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="font-bold">${relatedProduct.price.toFixed(2)}</span>
                          )}
                        </div>

                        <Button
                          size="sm"
                          className="bg-pink-600 hover:bg-pink-700"
                          onClick={() => {
                            toast({
                              title: "Added to cart",
                              description: `${relatedProduct.name} has been added to your cart.`,
                            })
                          }}
                        >
                          <ShoppingBag className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
  )
}
