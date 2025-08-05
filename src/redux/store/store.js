import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../reducer/userSlice';
import searchReducer from '../reducer/SearchSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    search:searchReducer,
  },
});