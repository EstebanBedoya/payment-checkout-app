import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from 'redux'
import checkoutReducer from './checkout/checkout.slice'
import productReducer from './product/product.slice'
import paymentReducer from './payment/payment.slice'

const paymentPersistConfig = { key: 'payment', storage, whitelist: ['tokenId'] }
const checkoutPersistConfig = { key: 'checkout', storage, whitelist: ['step', 'productId'] }

const rootReducer = combineReducers({
  checkout: persistReducer(checkoutPersistConfig, checkoutReducer),
  product: productReducer,
  payment: persistReducer(paymentPersistConfig, paymentReducer),
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] } }),
})

export const persistor = persistStore(store)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
