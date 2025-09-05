"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Product } from "@/lib/products-data"
import { SettingsStorage } from "@/lib/settings-storage"

// Cart item interface
export interface CartItem {
  id: string
  product: Product
  quantity: number
  addedAt: Date
}

// Wishlist item interface
export interface WishlistItem {
  id: string
  product: Product
  addedAt: Date
}

// Promo code interface
export interface PromoCode {
  code: string
  discount: number
  type: 'percentage' | 'fixed'
  minAmount?: number
}

// Cart context interface
interface CartContextType {
  // Cart state
  cartItems: CartItem[]
  cartItemCount: number
  cartSubtotal: number
  cartTax: number
  cartShipping: number
  cartTotal: number
  appliedPromo: PromoCode | null
  isInitialized: boolean

  // Wishlist state
  wishlistItems: WishlistItem[]
  wishlistItemCount: number

  // Cart actions
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateCartItemQuantity: (productId: string, quantity: number) => void
  clearCart: () => void

  // Wishlist actions
  addToWishlist: (product: Product) => void
  removeFromWishlist: (productId: string) => void
  moveToCart: (productId: string) => void
  moveToWishlist: (productId: string) => void

  // Promo code actions
  applyPromoCode: (code: string) => boolean
  removePromoCode: () => void

  // Utility functions
  isInCart: (productId: string) => boolean
  isInWishlist: (productId: string) => boolean
  getCartItem: (productId: string) => CartItem | undefined
  cleanupInvalidItems: () => void
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  cartItemCount: 0,
  cartSubtotal: 0,
  cartTax: 0,
  cartShipping: 0,
  cartTotal: 0,
  appliedPromo: null,
  isInitialized: false,
  wishlistItems: [],
  wishlistItemCount: 0,
  addToCart: () => {},
  removeFromCart: () => {},
  updateCartItemQuantity: () => {},
  clearCart: () => {},
  addToWishlist: () => {},
  removeFromWishlist: () => {},
  moveToCart: () => {},
  moveToWishlist: () => {},
  applyPromoCode: () => false,
  removePromoCode: () => {},
  isInCart: () => false,
  isInWishlist: () => false,
  getCartItem: () => undefined,
  cleanupInvalidItems: () => {},
})

// Storage keys
const STORAGE_KEYS = {
  CART: 'vanity_cart_items',
  WISHLIST: 'vanity_wishlist_items',
  PROMO: 'vanity_applied_promo'
}

// Available promo codes
const AVAILABLE_PROMO_CODES: PromoCode[] = [
  { code: 'WELCOME10', discount: 10, type: 'percentage' },
  { code: 'SAVE20', discount: 20, type: 'fixed', minAmount: 100 },
  { code: 'NEWCLIENT', discount: 15, type: 'percentage', minAmount: 50 },
]

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const { toast } = useToast()

  // Get checkout settings for dynamic rates
  const checkoutSettings = SettingsStorage.getCheckoutSettings()

  // Initialize data from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return

    try {
      const storedCart = localStorage.getItem(STORAGE_KEYS.CART)
      const storedWishlist = localStorage.getItem(STORAGE_KEYS.WISHLIST)
      const storedPromo = localStorage.getItem(STORAGE_KEYS.PROMO)

      if (storedCart) {
        const parsedCart = JSON.parse(storedCart).map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }))
        setCartItems(parsedCart)
      }

      if (storedWishlist) {
        const parsedWishlist = JSON.parse(storedWishlist).map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }))
        setWishlistItems(parsedWishlist)
      }

      if (storedPromo) {
        setAppliedPromo(JSON.parse(storedPromo))
      }

      setIsInitialized(true)
    } catch (error) {
      console.error('Error loading cart data:', error)
      setIsInitialized(true)
    }
  }, [isInitialized])

  // Save cart to localStorage
  const saveCartToStorage = useCallback((items: CartItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(items))
    } catch (error) {
      console.error('Error saving cart:', error)
    }
  }, [])

  // Save wishlist to localStorage
  const saveWishlistToStorage = useCallback((items: WishlistItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(items))
    } catch (error) {
      console.error('Error saving wishlist:', error)
    }
  }, [])

  // Save promo to localStorage
  const savePromoToStorage = useCallback((promo: PromoCode | null) => {
    try {
      if (promo) {
        localStorage.setItem(STORAGE_KEYS.PROMO, JSON.stringify(promo))
      } else {
        localStorage.removeItem(STORAGE_KEYS.PROMO)
      }
    } catch (error) {
      console.error('Error saving promo:', error)
    }
  }, [])

  // Calculate cart totals
  const cartSubtotal = cartItems.reduce((total, item) => {
    const price = item.product.salePrice || item.product.price
    return total + (price * item.quantity)
  }, 0)

  const promoDiscount = appliedPromo ?
    (appliedPromo.type === 'percentage' ?
      cartSubtotal * (appliedPromo.discount / 100) :
      appliedPromo.discount) : 0

  const discountedSubtotal = Math.max(0, cartSubtotal - promoDiscount)

  // Calculate tax using dynamic rate
  const cartTax = discountedSubtotal * (checkoutSettings.taxRate / 100)

  // Calculate shipping using dynamic settings
  let cartShipping = 0
  if (checkoutSettings.shippingType === 'flat') {
    cartShipping = checkoutSettings.shippingAmount
  } else if (checkoutSettings.shippingType === 'percentage') {
    cartShipping = discountedSubtotal * (checkoutSettings.shippingAmount / 100)
  }

  // Apply free shipping threshold
  if (discountedSubtotal >= checkoutSettings.freeShippingThreshold) {
    cartShipping = 0
  }

  const cartTotal = discountedSubtotal + cartTax + cartShipping

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const wishlistItemCount = wishlistItems.length

  // Cart actions
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id)

      if (existingItem) {
        const updatedItems = prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
        saveCartToStorage(updatedItems)
        return updatedItems
      } else {
        const newItem: CartItem = {
          id: `cart_${product.id}_${Date.now()}`,
          product,
          quantity,
          addedAt: new Date()
        }
        const updatedItems = [...prevItems, newItem]
        saveCartToStorage(updatedItems)
        return updatedItems
      }
    })

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }, [toast, saveCartToStorage])

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.filter(item => item.product.id !== productId)
      saveCartToStorage(updatedItems)
      return updatedItems
    })

    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart.",
    })
  }, [toast, saveCartToStorage])

  const updateCartItemQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
      saveCartToStorage(updatedItems)
      return updatedItems
    })
  }, [removeFromCart, saveCartToStorage])

  const clearCart = useCallback(() => {
    setCartItems([])
    saveCartToStorage([])
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart.",
    })
  }, [toast, saveCartToStorage])

  // Wishlist actions
  const addToWishlist = useCallback((product: Product) => {
    setWishlistItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id)

      if (existingItem) {
        toast({
          title: "Already in wishlist",
          description: `${product.name} is already in your wishlist.`,
          variant: "default",
        })
        return prevItems
      }

      const newItem: WishlistItem = {
        id: `wishlist_${product.id}_${Date.now()}`,
        product,
        addedAt: new Date()
      }
      const updatedItems = [...prevItems, newItem]
      saveWishlistToStorage(updatedItems)

      toast({
        title: "Added to wishlist",
        description: `${product.name} has been added to your wishlist.`,
      })

      return updatedItems
    })
  }, [toast, saveWishlistToStorage])

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlistItems(prevItems => {
      const updatedItems = prevItems.filter(item => item.product.id !== productId)
      saveWishlistToStorage(updatedItems)
      return updatedItems
    })

    toast({
      title: "Removed from wishlist",
      description: "Item has been removed from your wishlist.",
    })
  }, [toast, saveWishlistToStorage])

  const moveToCart = useCallback((productId: string) => {
    const wishlistItem = wishlistItems.find(item => item.product.id === productId)
    if (wishlistItem) {
      addToCart(wishlistItem.product, 1)
      removeFromWishlist(productId)
    }
  }, [wishlistItems, addToCart, removeFromWishlist])

  const moveToWishlist = useCallback((productId: string) => {
    const cartItem = cartItems.find(item => item.product.id === productId)
    if (cartItem) {
      addToWishlist(cartItem.product)
      removeFromCart(productId)
    }
  }, [cartItems, addToWishlist, removeFromCart])

  // Promo code actions
  const applyPromoCode = useCallback((code: string) => {
    const promo = AVAILABLE_PROMO_CODES.find(p => p.code.toLowerCase() === code.toLowerCase())

    if (!promo) {
      toast({
        title: "Invalid promo code",
        description: "The promo code you entered is invalid or expired.",
        variant: "destructive",
      })
      return false
    }

    if (promo.minAmount && cartSubtotal < promo.minAmount) {
      toast({
        title: "Minimum amount not met",
        description: `This promo code requires a minimum order of $${promo.minAmount}.`,
        variant: "destructive",
      })
      return false
    }

    setAppliedPromo(promo)
    savePromoToStorage(promo)

    toast({
      title: "Promo code applied",
      description: `${promo.type === 'percentage' ? promo.discount + '%' : '$' + promo.discount} discount has been applied.`,
    })

    return true
  }, [cartSubtotal, toast, savePromoToStorage])

  const removePromoCode = useCallback(() => {
    setAppliedPromo(null)
    savePromoToStorage(null)

    toast({
      title: "Promo code removed",
      description: "The discount has been removed from your order.",
    })
  }, [toast, savePromoToStorage])

  // Utility functions
  const isInCart = useCallback((productId: string) => {
    return cartItems.some(item => item.product.id === productId)
  }, [cartItems])

  const isInWishlist = useCallback((productId: string) => {
    return wishlistItems.some(item => item.product.id === productId)
  }, [wishlistItems])

  const getCartItem = useCallback((productId: string) => {
    return cartItems.find(item => item.product.id === productId)
  }, [cartItems])

  const cleanupInvalidItems = useCallback(() => {
    setCartItems(prevItems => {
      const validItems = prevItems.filter(item => item.product !== undefined && item.product !== null)
      if (validItems.length !== prevItems.length) {
        saveCartToStorage(validItems)
        toast({
          title: "Cart Cleaned",
          description: "Some invalid items were removed from your cart.",
        })
      }
      return validItems
    })
  }, [saveCartToStorage, toast])

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartItemCount,
        cartSubtotal,
        cartTax,
        cartShipping,
        cartTotal,
        appliedPromo,
        isInitialized,
        wishlistItems,
        wishlistItemCount,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        addToWishlist,
        removeFromWishlist,
        moveToCart,
        moveToWishlist,
        applyPromoCode,
        removePromoCode,
        isInCart,
        isInWishlist,
        getCartItem,
        cleanupInvalidItems,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
