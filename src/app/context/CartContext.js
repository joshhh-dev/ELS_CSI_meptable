"use client";
import React, { createContext, useContext, useState } from "react";

// Create the context
const CartContext = createContext();

// Hook for easy usage
export function useCart() {
  return useContext(CartContext);
}

// Provider for wrapping the app
export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // Add machine to cart (increments quantity if already in cart)
  const addToCart = (machine) => {
    setCart((prevCart) => {
      const exists = prevCart.find((item) => item.id === machine.id);

      if (exists) {
        // Increase quantity
        return prevCart.map((item) =>
          item.id === machine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // Add new machine with quantity = 1
      return [...prevCart, { ...machine, quantity: 1 }];
    });
  };

  // Remove one quantity of a machine from cart
  const removeOneFromCart = (id) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === id
            ? { ...item, quantity:Math.max (1, item.quantity - 1) } // decrease by 1
            : item
        )
    );
  };
  const updateQuantity = (id, newQuantity) => {
  setCart((prevCart) =>
    prevCart.map((item) =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    )
  );
};

  // Remove the entire machine regardless of quantity
  const removeAllFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart: removeOneFromCart,
        removeAllFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
